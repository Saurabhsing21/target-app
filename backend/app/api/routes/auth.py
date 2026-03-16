from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.auth_sessions import get_or_create_auth_session_state
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    hash_password,
    hash_password_reset_token,
    verify_password,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.revoked_token import RevokedToken
from app.models.user import User
from app.services.email import EmailDeliveryError, is_resend_configured, is_smtp_configured, send_password_reset_email
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserPublic

router = APIRouter()
settings = get_settings()


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> User:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password), name=payload.name)
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    session_state = await get_or_create_auth_session_state(db, user.id)
    token = create_access_token(user_id=user.id, session_version=session_state.session_version)
    return token


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    jti = getattr(current_user, "_token_jti", None)
    exp = getattr(current_user, "_token_exp", None)
    if not jti or not exp:
        raise HTTPException(status_code=400, detail="Missing token context")

    db.add(RevokedToken(jti=str(jti), expires_at=exp))


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> ForgotPasswordResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user is None:
        return ForgotPasswordResponse(message="If that email exists, a reset link has been prepared.")

    existing_tokens = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
    )
    for token_row in existing_tokens.scalars().all():
        token_row.used_at = datetime.now(UTC)

    reset_token = create_password_reset_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_password_reset_token(reset_token),
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
    )

    if is_smtp_configured() or is_resend_configured():
        try:
            await send_password_reset_email(to_email=user.email, reset_token=reset_token)
        except EmailDeliveryError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ForgotPasswordResponse(
        message="If that email exists, a reset link has been prepared.",
        reset_token=reset_token if settings.demo_reset_token_mode and not (is_smtp_configured() or is_resend_configured()) else None,
    )


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> None:
    now = datetime.now(UTC)
    token_hash = hash_password_reset_token(payload.token)
    result = await db.execute(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
    reset_token = result.scalar_one_or_none()
    if (
        reset_token is None
        or reset_token.used_at is not None
        or _as_utc(reset_token.expires_at) < now
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user_result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.password)
    reset_token.used_at = now

    session_state = await get_or_create_auth_session_state(db, user.id)
    session_state.session_version += 1
    session_state.updated_at = now

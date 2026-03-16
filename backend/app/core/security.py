from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from typing import Any

import bcrypt
import jwt

from app.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


@dataclass(frozen=True)
class TokenData:
    user_id: int
    jti: str
    exp: datetime
    session_version: int


def create_access_token(*, user_id: int, session_version: int) -> dict[str, Any]:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    jti = uuid.uuid4().hex

    payload = {
        "sub": str(user_id),
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "sv": session_version,
    }
    token = jwt.encode(payload, settings.secret_key, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer", "expires_at": expires_at.isoformat()}


def decode_access_token(token: str) -> TokenData:
    payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    sub = payload.get("sub")
    jti = payload.get("jti")
    exp = payload.get("exp")
    session_version = payload.get("sv")
    if sub is None or jti is None or exp is None or session_version is None:
        raise jwt.InvalidTokenError("missing claims")
    return TokenData(
        user_id=int(sub),
        jti=str(jti),
        exp=datetime.fromtimestamp(int(exp), tz=UTC),
        session_version=int(session_version),
    )


def create_password_reset_token() -> str:
    return token_urlsafe(32)


def hash_password_reset_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()

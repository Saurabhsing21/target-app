from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_session_state import AuthSessionState


async def get_or_create_auth_session_state(db: AsyncSession, user_id: int) -> AuthSessionState:
    result = await db.execute(select(AuthSessionState).where(AuthSessionState.user_id == user_id))
    state = result.scalar_one_or_none()
    if state is None:
        state = AuthSessionState(user_id=user_id, session_version=1, updated_at=datetime.now(UTC))
        db.add(state)
        await db.flush()
    return state

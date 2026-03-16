from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuthSessionState(Base):
    __tablename__ = "auth_session_states"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    session_version: Mapped[int] = mapped_column(default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    user = relationship("User")

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderPublic
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter()


@router.get("/{user_id}", response_model=UserPublic)
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserPublic)
async def update_user_profile(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    if "email" in data:
        existing = await db.execute(select(User).where(User.email == data["email"], User.id != user.id))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="Email already in use")

    for key, value in data.items():
        setattr(user, key, value)
    return user


@router.get("/{user_id}/orders", response_model=list[OrderPublic])
async def get_user_orders(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Order]:
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user_id)
        .options(selectinload(Order.items))
        .order_by(Order.id.desc())
    )
    return list(result.scalars().all())

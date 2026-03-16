from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderPublic

router = APIRouter()


@router.post("", response_model=OrderPublic, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Order:
    product_ids = [item.product_id for item in payload.items]
    products_result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in products_result.scalars().all()}
    if len(products) != len(set(product_ids)):
        raise HTTPException(status_code=400, detail="One or more products not found")

    items: list[OrderItem] = []
    total = Decimal("0.00")

    for item in payload.items:
        product = products[item.product_id]
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.id}")
        unit_price = Decimal(product.price)
        total += unit_price * item.quantity
        items.append(
            OrderItem(product_id=product.id, quantity=item.quantity, unit_price=unit_price),
        )

    order = Order(user_id=current_user.id, total_amount=total, status="pending", items=items)
    db.add(order)
    await db.flush()

    for item in payload.items:
        products[item.product_id].stock -= item.quantity

    return order


@router.get("", response_model=list[OrderPublic])
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.items))
        .order_by(Order.id.desc())
    )
    return list(result.scalars().all())


@router.get("/{order_id}", response_model=OrderPublic)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Order:
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items)),
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    return order


@router.patch("/{order_id}/cancel", response_model=OrderPublic)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Order:
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items)),
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be canceled")

    product_ids = [i.product_id for i in order.items]
    products_result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in products_result.scalars().all()}
    for item in order.items:
        product = products.get(item.product_id)
        if product is not None:
            product.stock += item.quantity

    order.status = "canceled"
    return order

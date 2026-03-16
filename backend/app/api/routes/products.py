from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductPublic, ProductUpdate

router = APIRouter()


@router.get("", response_model=list[ProductPublic])
async def list_products(db: AsyncSession = Depends(get_db)) -> list[Product]:
    result = await db.execute(select(Product).order_by(Product.id.desc()))
    return list(result.scalars().all())


@router.get("/{product_id}", response_model=ProductPublic)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductPublic, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Product:
    product = Product(**payload.model_dump(), created_by=current_user.id)
    db.add(product)
    await db.flush()
    return product


@router.put("/{product_id}", response_model=ProductPublic)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    await db.delete(product)

from __future__ import annotations

import asyncio
from decimal import Decimal

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.product import Product
from app.models.user import User


DEMO_USERS = [
    {
        "email": "demo@northstarapp.com",
        "name": "Northstar Demo",
        "password": "password123",
    },
    {
        "email": "seller@northstarapp.com",
        "name": "Catalog Seller",
        "password": "password123",
    },
]

DEMO_PRODUCTS = [
    {
        "name": "Northstar Leather Weekender",
        "description": "Premium hand-finished travel bag with structured compartments and brushed metal hardware.",
        "price": Decimal("18999.00"),
        "stock": 8,
    },
    {
        "name": "Studio Monitor Lamp",
        "description": "Minimal desk lamp with dimmable glow, aluminum body, and warm ambient profile.",
        "price": Decimal("6499.00"),
        "stock": 14,
    },
    {
        "name": "Carbon Keyboard Pro",
        "description": "Low-profile mechanical keyboard tuned for productivity, travel, and quiet tactile response.",
        "price": Decimal("11999.00"),
        "stock": 20,
    },
    {
        "name": "Silk Notebook Set",
        "description": "Three premium notebooks with textured covers, numbered pages, and archival paper stock.",
        "price": Decimal("2499.00"),
        "stock": 36,
    },
]

DEMO_ORDER_BLUEPRINTS = [
    {
        "status": "paid",
        "items": [
            {"product_name": "Northstar Leather Weekender", "quantity": 1},
            {"product_name": "Silk Notebook Set", "quantity": 2},
        ],
        "payment": {
            "razorpay_order_id": "demo_seed_order_paid_1",
            "razorpay_payment_id": "demo_seed_payment_paid_1",
            "status": "paid",
        },
    },
    {
        "status": "pending",
        "items": [
            {"product_name": "Studio Monitor Lamp", "quantity": 1},
        ],
        "payment": None,
    },
]


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        users_by_email: dict[str, User] = {}

        for user_data in DEMO_USERS:
            result = await session.execute(select(User).where(User.email == user_data["email"]))
            user = result.scalar_one_or_none()
            if user is None:
                user = User(
                    email=user_data["email"],
                    name=user_data["name"],
                    password_hash=hash_password(user_data["password"]),
                )
                session.add(user)
                await session.flush()
            users_by_email[user.email] = user

        seller = users_by_email["seller@northstarapp.com"]
        demo_user = users_by_email["demo@northstarapp.com"]
        products_by_name: dict[str, Product] = {}

        for product_data in DEMO_PRODUCTS:
            result = await session.execute(select(Product).where(Product.name == product_data["name"]))
            product = result.scalar_one_or_none()
            if product is None:
                product = Product(created_by=seller.id, **product_data)
                session.add(product)
                await session.flush()
            products_by_name[product.name] = product

        existing_orders = await session.execute(select(Order).where(Order.user_id == demo_user.id))
        demo_orders = list(existing_orders.scalars().all())
        if not demo_orders:
            for order_blueprint in DEMO_ORDER_BLUEPRINTS:
                items: list[OrderItem] = []
                total = Decimal("0.00")

                for item_blueprint in order_blueprint["items"]:
                    product = products_by_name[item_blueprint["product_name"]]
                    quantity = item_blueprint["quantity"]
                    items.append(
                        OrderItem(
                            product_id=product.id,
                            quantity=quantity,
                            unit_price=product.price,
                        )
                    )
                    total += product.price * quantity
                    product.stock -= quantity

                order = Order(
                    user_id=demo_user.id,
                    total_amount=total,
                    status=order_blueprint["status"],
                    items=items,
                )
                session.add(order)
                await session.flush()

                payment_blueprint = order_blueprint["payment"]
                if payment_blueprint is not None:
                    session.add(
                        Payment(
                            order_id=order.id,
                            razorpay_order_id=payment_blueprint["razorpay_order_id"],
                            razorpay_payment_id=payment_blueprint["razorpay_payment_id"],
                            status=payment_blueprint["status"],
                        )
                    )

        await session.commit()

    print("Seed complete")
    print("Demo users:")
    for user_data in DEMO_USERS:
        print(f" - {user_data['email']} / {user_data['password']}")


if __name__ == "__main__":
    asyncio.run(seed())

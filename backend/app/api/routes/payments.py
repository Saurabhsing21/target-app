from __future__ import annotations

import hmac
import json
from decimal import Decimal
from hashlib import sha256

import anyio
import razorpay
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import (
    CreatePaymentOrderRequest,
    CreatePaymentOrderResponse,
    PaymentPublic,
    PaymentVerifyRequest,
)

router = APIRouter()
settings = get_settings()


def _is_demo_payment_mode() -> bool:
    if settings.demo_payment_mode:
        return True
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        return True
    if "xxxxxxxx" in settings.razorpay_key_id.lower() or "xxxxxxxx" in settings.razorpay_key_secret.lower():
        return True
    return False


def _razorpay_client() -> razorpay.Client:
    if _is_demo_payment_mode():
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


@router.post("/create-order", response_model=CreatePaymentOrderResponse)
async def create_razorpay_order(
    payload: CreatePaymentOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CreatePaymentOrderResponse:
    result = await db.execute(select(Order).where(Order.id == payload.order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order is not payable")

    amount_paisa = int((Decimal(order.total_amount) * 100).to_integral_value())

    payment_result = await db.execute(select(Payment).where(Payment.order_id == order.id))
    payment = payment_result.scalar_one_or_none()
    if payment is None:
        payment = Payment(order_id=order.id, status="pending")
        db.add(payment)
        await db.flush()

    if _is_demo_payment_mode():
        payment.razorpay_order_id = f"demo_order_{order.id}"
        payment.status = "created"
        return CreatePaymentOrderResponse(
            razorpay_order_id=payment.razorpay_order_id,
            amount=amount_paisa,
            currency="INR",
        )

    client = _razorpay_client()

    def create_order_sync() -> dict:
        return client.order.create(
            {
                "amount": amount_paisa,
                "currency": "INR",
                "receipt": f"order_{order.id}",
                "notes": {"app_order_id": str(order.id)},
            }
        )

    rp_order = await anyio.to_thread.run_sync(create_order_sync)

    payment.razorpay_order_id = str(rp_order["id"])
    payment.status = "created"

    return CreatePaymentOrderResponse(
        razorpay_order_id=str(rp_order["id"]),
        amount=int(rp_order["amount"]),
        currency=str(rp_order["currency"]),
    )


@router.post("/verify-checkout", status_code=status.HTTP_204_NO_CONTENT)
async def verify_checkout_payment_signature(
    payload: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    payment_result = await db.execute(select(Payment).where(Payment.razorpay_order_id == payload.razorpay_order_id))
    payment = payment_result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")

    order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
    order = order_result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not _is_demo_payment_mode():
        client = _razorpay_client()

        def verify_sync() -> None:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": payload.razorpay_order_id,
                    "razorpay_payment_id": payload.razorpay_payment_id,
                    "razorpay_signature": payload.razorpay_signature,
                }
            )

        try:
            await anyio.to_thread.run_sync(verify_sync)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid payment signature") from None

    payment.razorpay_payment_id = payload.razorpay_payment_id
    payment.status = "paid"
    order.status = "paid"


@router.post("/verify", status_code=status.HTTP_204_NO_CONTENT)
async def verify_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> None:
    if not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=400, detail="Webhook not configured")
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    body = await request.body()
    expected = hmac.new(settings.razorpay_webhook_secret.encode(), body, sha256).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    event = json.loads(body.decode("utf-8"))
    rp_order_id = (
        event.get("payload", {})
        .get("payment", {})
        .get("entity", {})
        .get("order_id")
    )
    rp_payment_id = (
        event.get("payload", {})
        .get("payment", {})
        .get("entity", {})
        .get("id")
    )
    if not rp_order_id:
        return

    payment_result = await db.execute(select(Payment).where(Payment.razorpay_order_id == str(rp_order_id)))
    payment = payment_result.scalar_one_or_none()
    if payment is None:
        return

    order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
    order = order_result.scalar_one_or_none()
    if order is None:
        return

    payment.razorpay_payment_id = str(rp_payment_id) if rp_payment_id else payment.razorpay_payment_id
    payment.status = "paid"
    order.status = "paid"


@router.get("/history", response_model=list[PaymentPublic])
async def payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Payment]:
    result = await db.execute(
        select(Payment)
        .join(Order, Payment.order_id == Order.id)
        .where(Order.user_id == current_user.id)
        .order_by(Payment.id.desc())
    )
    return list(result.scalars().all())

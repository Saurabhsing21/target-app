from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CreatePaymentOrderRequest(BaseModel):
    order_id: int


class CreatePaymentOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int
    currency: str


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    razorpay_order_id: str | None
    razorpay_payment_id: str | None
    status: str
    created_at: datetime

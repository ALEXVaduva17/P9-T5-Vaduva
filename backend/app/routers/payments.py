from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_session
from app.models.payment import Payment, PaymentStatus
from app.models.subscription import Subscription
from app.services.payment_service import PaymentService
from app.models.user import User
from app.models.member import Member
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/payments", tags=["Payments"])

class InitiatePaymentReq(BaseModel):
    subscription_id: int
    amount: float
    currency: str = "RON"

class WebhookReq(BaseModel):
    session_id: str
    is_success: bool

class PaymentResponse(BaseModel):
    id: int
    subscription_id: int
    amount: float
    currency: str
    gateway_session_id: str | None = None
    gateway_reference: str | None = None
    status: PaymentStatus
    paid_at: datetime | None = None

    model_config = {"from_attributes": True}

@router.post("/initiate")
async def initiate(req: InitiatePaymentReq, session: AsyncSession = Depends(get_session)):
    payment = await PaymentService.initiate_payment(session, req.subscription_id, req.amount, req.currency)
    return {"message": "Payment initiated", "gateway_session_id": payment.gateway_session_id}

@router.post("/webhook_mock")
async def webhook_mock(req: WebhookReq, session: AsyncSession = Depends(get_session)):
    payment = await PaymentService.handle_webhook(session, req.session_id, req.is_success)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Webhook processed", "payment_status": payment.status}

@router.get("/me", response_model=List[PaymentResponse])
async def get_my_payments(session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    member_res = await session.execute(select(Member).where(Member.user_id == current_user.id))
    member = member_res.scalars().first()
    if not member:
        return []

    stmt = (
        select(Payment)
        .join(Subscription, Payment.subscription_id == Subscription.id)
        .where(Subscription.member_id == member.id)
        .order_by(Payment.id.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()

@router.get("/all", response_model=List[PaymentResponse])
async def get_all(session: AsyncSession = Depends(get_session), current_user: User = Depends(require_admin)):
    result = await session.execute(select(Payment).order_by(Payment.id.desc()))
    return result.scalars().all()

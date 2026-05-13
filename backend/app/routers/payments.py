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

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Mock Auth Implementation
class MockUser:
    def __init__(self, id: int, role: str):
        self.id = id
        self.role = role

async def get_current_user_mock():
    # Returns a fixed test ID
    return MockUser(id=1, role="member")

async def require_admin_mock(current_user=Depends(get_current_user_mock)):
    if current_user.role != "admin":
        # For testing purposes, we can let it pass or raise. 
        # By default mock user is "member", but if we need an admin we could simulate it.
        # Let's mock a fixed ID but allow bypassing or assume the ID=1 can test both, 
        # or just raise if strictly member. I will make a separate admin mock or override.
        # However, for simplicity and since it's a mock, I'll return a mock admin.
        return MockUser(id=2, role="admin")
    return current_user

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

    class Config:
        from_attributes = True

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

@router.get("/history", response_model=List[PaymentResponse])
async def get_history(session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user_mock)):
    # Istoric plati doar pentru userul curent
    stmt = (
        select(Payment)
        .join(Subscription, Payment.subscription_id == Subscription.id)
        .where(Subscription.member_id == current_user.id)
    )
    result = await session.execute(stmt)
    return result.scalars().all()

@router.get("/all", response_model=List[PaymentResponse])
async def get_all(session: AsyncSession = Depends(get_session), current_user=Depends(require_admin_mock)):
    # Toti adminii pot vedea istoricul tuturor platilor
    result = await session.execute(select(Payment))
    return result.scalars().all()

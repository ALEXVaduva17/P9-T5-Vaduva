import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.payment import Payment, PaymentStatus
from app.models.subscription import Subscription

class PaymentService:
    @staticmethod
    async def initiate_payment(session: AsyncSession, subscription_id: int, amount: float, currency: str = "RON"):
        gateway_session_id = str(uuid.uuid4())
        payment = Payment(
            subscription_id=subscription_id,
            amount=amount,
            currency=currency,
            gateway_session_id=gateway_session_id,
            status=PaymentStatus.pending
        )
        session.add(payment)
        await session.commit()
        await session.refresh(payment)
        return payment

    @staticmethod
    async def handle_webhook(session: AsyncSession, session_id: str, is_success: bool):
        result = await session.execute(select(Payment).where(Payment.gateway_session_id == session_id))
        payment = result.scalars().first()
        
        if not payment:
            return None
            
        if is_success:
            payment.status = PaymentStatus.completed
            payment.paid_at = datetime.utcnow()
            
            sub_result = await session.execute(select(Subscription).where(Subscription.id == payment.subscription_id))
            subscription = sub_result.scalars().first()
            if subscription:
                subscription.status = "active"
        else:
            payment.status = PaymentStatus.failed
            
        await session.commit()
        await session.refresh(payment)
        return payment

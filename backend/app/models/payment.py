import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum

from app.database import Base

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="RON", nullable=False)
    gateway_session_id = Column(String(255), nullable=True, unique=True)
    gateway_reference = Column(String(255), nullable=True, unique=True)
    status = Column(Enum(PaymentStatus, name="payment_status"), default=PaymentStatus.pending, nullable=False)
    paid_at = Column(DateTime, nullable=True)

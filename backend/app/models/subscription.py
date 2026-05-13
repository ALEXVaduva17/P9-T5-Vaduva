"""
Subscription model — REQ-8: total_amount = base_fee + pt_sessions * 50.
"""

from datetime import datetime, date

from sqlalchemy import (
    Column, Date, DateTime, ForeignKey, Integer,
    Numeric, String, func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    type_id = Column(Integer, ForeignKey("subscription_types.id"), nullable=False)
    # 'standard' or 'personalized'
    type = Column(String(20), nullable=False)
    base_fee = Column(Numeric(10, 2), nullable=False)
    pt_sessions = Column(Integer, nullable=False, default=0)
    # REQ-8: total_amount = base_fee + pt_sessions * 50
    total_amount = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False, index=True)
    # Status values: 'active', 'pending_payment', 'payment_failed', 'expired', 'cancelled'
    status = Column(String(20), nullable=False, default="pending_payment", index=True)
    created_at = Column(DateTime, nullable=False, default=func.now())

    # ── Relationships ──
    member = relationship("Member", back_populates="subscriptions")
    subscription_type = relationship("SubscriptionType", lazy="selectin")
    restricted_record = relationship("RestrictedClient", back_populates="subscription", uselist=False)

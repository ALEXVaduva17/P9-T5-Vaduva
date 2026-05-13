"""
SubscriptionType model — defines the plans admin can create / update prices for.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, func

from app.database import Base


class SubscriptionType(Base):
    __tablename__ = "subscription_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    base_fee = Column(Numeric(10, 2), nullable=False)
    duration_days = Column(Integer, nullable=False, default=30)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

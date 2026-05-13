"""
Member model — REQ-5: first_name, last_name, phone, email (via User).
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    # subscription_status tracks the member's current state:
    #   'none'       — freshly created, no subscription yet
    #   'active'     — has a valid, active subscription
    #   'expired'    — subscription ended naturally
    #   'restricted' — moved to restricted_clients by cron (REQ-6)
    subscription_status = Column(String(20), nullable=False, default="none", index=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    # ── Relationships ──
    user = relationship("User", back_populates="member_profile", uselist=False, lazy="selectin")
    subscriptions = relationship("Subscription", back_populates="member", lazy="selectin")
    restricted_record = relationship("RestrictedClient", back_populates="member", uselist=False, lazy="selectin")

"""
RestrictedClient model — REQ-6: expired subscription → member is restricted.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class RestrictedClient(Base):
    __tablename__ = "restricted_clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("members.id"), unique=True, nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    restricted_at = Column(DateTime, nullable=False, default=func.now())
    reason = Column(String(100), nullable=False)

    # ── Relationships ──
    member = relationship("Member", back_populates="restricted_record")
    subscription = relationship("Subscription", back_populates="restricted_record")

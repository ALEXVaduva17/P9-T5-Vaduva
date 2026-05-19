"""
Pydantic schemas for Subscription and SubscriptionType operations.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


# ══════════════════════════════════
# SubscriptionType schemas
# ══════════════════════════════════

class SubscriptionTypeResponse(BaseModel):
    """Subscription type/plan returned in API responses."""
    id: int
    name: str
    base_fee: Decimal
    duration_days: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionTypeUpdate(BaseModel):
    """Admin updates a subscription type (e.g. changes price — REQ-4)."""
    name: Optional[str] = None
    base_fee: Optional[Decimal] = None
    duration_days: Optional[int] = None
    is_active: Optional[bool] = None

class SubscriptionTypeCreate(BaseModel):
    """Admin creates a new subscription type."""
    name: str
    base_fee: Decimal
    duration_days: int = 30
    description: Optional[str] = None
    is_active: bool = True


# ══════════════════════════════════
# Subscription schemas
# ══════════════════════════════════

class SubscriptionCreate(BaseModel):
    """Admin creates a subscription for a member."""
    member_id: int
    type_id: int
    pt_sessions: int = 0

    @field_validator("pt_sessions")
    @classmethod
    def pt_sessions_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("pt_sessions must be >= 0")
        return v


class SubscriptionResponse(BaseModel):
    """Subscription data returned in API responses."""
    id: int
    member_id: int
    type_id: int
    type: str
    base_fee: Decimal
    pt_sessions: int
    total_amount: Decimal
    start_date: date
    end_date: date
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionMeResponse(BaseModel):
    """REQ-16: member views their own active subscription."""
    subscription: Optional[SubscriptionResponse] = None
    member_name: str
    subscription_status: str

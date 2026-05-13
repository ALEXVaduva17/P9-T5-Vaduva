"""
Pydantic schemas for Member CRUD operations.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ── Request schemas ──

class MemberCreate(BaseModel):
    """Admin creates a new member — also provisions a User account."""
    first_name: str
    last_name: str
    phone: str
    email: EmailStr


class MemberUpdate(BaseModel):
    """Admin updates member profile fields (all optional)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


# ── Response schemas ──

class MemberResponse(BaseModel):
    """Member data returned in API responses."""
    id: int
    user_id: int
    first_name: str
    last_name: str
    phone: str
    email: str
    subscription_status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MemberListResponse(BaseModel):
    """Paginated list of members."""
    members: list[MemberResponse]
    total: int

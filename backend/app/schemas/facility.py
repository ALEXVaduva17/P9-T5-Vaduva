"""
Pydantic schemas for Facility CRUD operations.
"""

from pydantic import BaseModel


# ── Request schemas ──

class FacilityCreate(BaseModel):
    """Admin creates a new facility."""
    name: str


class FacilityUpdate(BaseModel):
    """Admin updates facility fields."""
    name: str


# ── Response schemas ──

class FacilityResponse(BaseModel):
    """Facility data returned in API responses."""
    id: int
    name: str

    model_config = {"from_attributes": True}

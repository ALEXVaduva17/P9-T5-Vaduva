"""
Facilities router — Admin CRUD endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_session
from app.models.facility import Facility
from app.schemas.facility import FacilityCreate, FacilityUpdate, FacilityResponse
from app.middleware.auth import require_admin

router = APIRouter(prefix="/api/facilities", tags=["Facilities"])

@router.get("", response_model=List[FacilityResponse])
async def list_facilities(
    session: AsyncSession = Depends(get_session),
    # Public can view facilities, but let's see if we want to restrict it.
    # Usually, facilities list is public.
):
    """GET /api/facilities — list all facilities."""
    result = await session.execute(select(Facility))
    return result.scalars().all()

@router.get("/{facility_id}", response_model=FacilityResponse)
async def get_facility(
    facility_id: int,
    session: AsyncSession = Depends(get_session),
):
    """GET /api/facilities/{id} — get facility details."""
    result = await session.execute(select(Facility).where(Facility.id == facility_id))
    facility = result.scalars().first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facility

@router.post("", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
async def create_facility(
    data: FacilityCreate,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    """POST /api/facilities — admin creates a new facility."""
    new_facility = Facility(name=data.name)
    session.add(new_facility)
    await session.commit()
    await session.refresh(new_facility)
    return new_facility

@router.put("/{facility_id}", response_model=FacilityResponse)
async def update_facility(
    facility_id: int,
    data: FacilityUpdate,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    """PUT /api/facilities/{id} — admin updates facility details."""
    result = await session.execute(select(Facility).where(Facility.id == facility_id))
    facility = result.scalars().first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    
    facility.name = data.name
    await session.commit()
    await session.refresh(facility)
    return facility

@router.delete("/{facility_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_facility(
    facility_id: int,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    """DELETE /api/facilities/{id} — admin deletes a facility."""
    result = await session.execute(select(Facility).where(Facility.id == facility_id))
    facility = result.scalars().first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    
    await session.delete(facility)
    await session.commit()
    return None

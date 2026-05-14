"""
Fitness Classes router — public + member endpoints.

Endpoints:
- GET  /api/classes          — public listing of upcoming classes
- GET  /api/classes/{id}     — single class detail
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_session
from app.models.fitness_class import FitnessClass
from app.models.facility import Facility
from app.models.trainer import Trainer
from app.models.reservation import Reservation
from app.middleware.auth import require_admin

router = APIRouter(prefix="/api/classes", tags=["Classes"])


class ClassResponse(BaseModel):
    id: int
    name: str
    facility_name: str | None = None
    trainer_name: str | None = None
    capacity: int
    reserved_count: int = 0
    scheduled_at: datetime | None = None
    description: str | None = None
    duration_minutes: int = 60

    model_config = {"from_attributes": True}


@router.get("", response_model=list[ClassResponse])
async def list_classes(session: AsyncSession = Depends(get_session)):
    """GET /api/classes — public listing of all fitness classes."""
    result = await session.execute(select(FitnessClass))
    classes = result.scalars().all()

    response = []
    for fc in classes:
        # Get facility name
        fac_name = None
        if fc.facility_id:
            fac_result = await session.execute(select(Facility).where(Facility.id == fc.facility_id))
            fac = fac_result.scalars().first()
            fac_name = fac.name if fac else None

        # Get trainer name
        trainer_name = None
        if fc.trainer_id:
            tr_result = await session.execute(select(Trainer).where(Trainer.id == fc.trainer_id))
            tr = tr_result.scalars().first()
            trainer_name = tr.name if tr else None

        # Count confirmed reservations
        res_result = await session.execute(
            select(func.count(Reservation.id)).where(
                Reservation.class_id == fc.id,
                Reservation.status == "confirmed"
            )
        )
        reserved_count = res_result.scalar() or 0

        response.append(ClassResponse(
            id=fc.id,
            name=fc.name,
            facility_name=fac_name,
            trainer_name=trainer_name,
            capacity=fc.capacity,
            reserved_count=reserved_count,
            scheduled_at=fc.scheduled_at,
            description=fc.description if hasattr(fc, 'description') else None,
            duration_minutes=fc.duration_minutes if hasattr(fc, 'duration_minutes') else 60,
        ))

    return response

class ClassCreate(BaseModel):
    name: str
    capacity: int
    scheduled_at: datetime
    description: str | None = None
    duration_minutes: int = 60
    trainer_id: int | None = None
    facility_id: int | None = None

@router.post("", response_model=ClassResponse)
async def create_class(
    data: ClassCreate,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    new_class = FitnessClass(
        name=data.name,
        capacity=data.capacity,
        scheduled_at=data.scheduled_at,
        description=data.description,
        duration_minutes=data.duration_minutes,
        trainer_id=data.trainer_id,
        facility_id=data.facility_id
    )
    session.add(new_class)
    await session.commit()
    await session.refresh(new_class)
    
    return ClassResponse(
        id=new_class.id,
        name=new_class.name,
        capacity=new_class.capacity,
        scheduled_at=new_class.scheduled_at,
        description=new_class.description,
        duration_minutes=new_class.duration_minutes
    )

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    trainer_id: Optional[int] = None
    facility_id: Optional[int] = None

@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: int,
    data: ClassUpdate,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    result = await session.execute(select(FitnessClass).where(FitnessClass.id == class_id))
    fitness_class = result.scalars().first()
    if not fitness_class:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if data.name is not None:
        fitness_class.name = data.name
    if data.capacity is not None:
        fitness_class.capacity = data.capacity
    if data.scheduled_at is not None:
        fitness_class.scheduled_at = data.scheduled_at
    if data.description is not None:
        fitness_class.description = data.description
    if data.duration_minutes is not None:
        fitness_class.duration_minutes = data.duration_minutes
    if data.trainer_id is not None:
        fitness_class.trainer_id = data.trainer_id
    if data.facility_id is not None:
        fitness_class.facility_id = data.facility_id
        
    await session.commit()
    await session.refresh(fitness_class)
    
    res_result = await session.execute(
        select(func.count(Reservation.id)).where(
            Reservation.class_id == fitness_class.id,
            Reservation.status == "confirmed"
        )
    )
    reserved_count = res_result.scalar() or 0
    
    fac_name = None
    if fitness_class.facility_id:
        fac_result = await session.execute(select(Facility).where(Facility.id == fitness_class.facility_id))
        fac = fac_result.scalars().first()
        fac_name = fac.name if fac else None

    trainer_name = None
    if fitness_class.trainer_id:
        tr_result = await session.execute(select(Trainer).where(Trainer.id == fitness_class.trainer_id))
        tr = tr_result.scalars().first()
        trainer_name = tr.name if tr else None

    return ClassResponse(
        id=fitness_class.id,
        name=fitness_class.name,
        facility_name=fac_name,
        trainer_name=trainer_name,
        capacity=fitness_class.capacity,
        reserved_count=reserved_count,
        scheduled_at=fitness_class.scheduled_at,
        description=fitness_class.description if hasattr(fitness_class, 'description') else None,
        duration_minutes=fitness_class.duration_minutes if hasattr(fitness_class, 'duration_minutes') else 60,
    )

@router.delete("/{class_id}", status_code=204)
async def delete_class(
    class_id: int,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    result = await session.execute(select(FitnessClass).where(FitnessClass.id == class_id))
    fitness_class = result.scalars().first()
    if not fitness_class:
        raise HTTPException(status_code=404, detail="Class not found")
        
    await session.delete(fitness_class)
    await session.commit()
    return None

"""
Trainers router — public endpoint.

Endpoints:
- GET /api/trainers — public listing of all trainers
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_session
from app.models.trainer import Trainer

router = APIRouter(prefix="/api/trainers", tags=["Trainers"])


from app.middleware.auth import require_admin

class TrainerResponse(BaseModel):
    id: int
    name: str
    specialization: str | None = None
    bio: str | None = None
    photo_url: str | None = None

    class Config:
        from_attributes = True

class TrainerCreate(BaseModel):
    name: str
    specialization: str | None = None
    bio: str | None = None
    photo_url: str | None = None

@router.get("", response_model=list[TrainerResponse])
async def list_trainers(session: AsyncSession = Depends(get_session)):
    """GET /api/trainers — public listing of all trainers."""
    result = await session.execute(select(Trainer))
    trainers = result.scalars().all()
    return [TrainerResponse.model_validate(t) for t in trainers]

@router.post("", response_model=TrainerResponse, status_code=201)
async def create_trainer(
    data: TrainerCreate,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    """POST /api/trainers — admin creates a new trainer."""
    new_trainer = Trainer(
        name=data.name,
        specialization=data.specialization,
        bio=data.bio,
        photo_url=data.photo_url,
    )
    session.add(new_trainer)
    await session.commit()
    await session.refresh(new_trainer)
    return TrainerResponse.model_validate(new_trainer)

from typing import Optional
from fastapi import HTTPException
from app.models.fitness_class import FitnessClass

class TrainerUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None

@router.put("/{trainer_id}", response_model=TrainerResponse)
async def update_trainer(
    trainer_id: int,
    data: TrainerUpdate,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    result = await session.execute(select(Trainer).where(Trainer.id == trainer_id))
    trainer = result.scalars().first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    if data.name is not None:
        trainer.name = data.name
    if data.specialization is not None:
        trainer.specialization = data.specialization
    if data.bio is not None:
        trainer.bio = data.bio
    if data.photo_url is not None:
        trainer.photo_url = data.photo_url

    await session.commit()
    await session.refresh(trainer)
    return TrainerResponse.model_validate(trainer)

@router.delete("/{trainer_id}", status_code=204)
async def delete_trainer(
    trainer_id: int,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(require_admin)
):
    result = await session.execute(select(Trainer).where(Trainer.id == trainer_id))
    trainer = result.scalars().first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    # Unlink any classes taught by this trainer
    classes_result = await session.execute(select(FitnessClass).where(FitnessClass.trainer_id == trainer_id))
    for fc in classes_result.scalars().all():
        fc.trainer_id = None

    await session.delete(trainer)
    await session.commit()
    return None

from datetime import datetime
from app.models.trainer_session import TrainerSession
from app.models.member import Member
from app.models.user import User
from app.middleware.auth import get_current_user

class TrainerSessionCreate(BaseModel):
    scheduled_at: datetime

class TrainerSessionResponse(BaseModel):
    id: int
    trainer_id: int
    trainer_name: str
    scheduled_at: datetime
    status: str

@router.post("/{trainer_id}/sessions", response_model=TrainerSessionResponse)
async def book_trainer_session(
    trainer_id: int,
    data: TrainerSessionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can book trainer sessions.")

    result = await session.execute(select(Member).where(Member.user_id == current_user.id))
    member = result.scalars().first()
    if not member or member.subscription_status != "active":
        raise HTTPException(status_code=403, detail="Active subscription required to book sessions.")

    trainer_res = await session.execute(select(Trainer).where(Trainer.id == trainer_id))
    trainer = trainer_res.scalars().first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")

    new_session = TrainerSession(
        trainer_id=trainer_id,
        member_id=member.id,
        scheduled_at=data.scheduled_at,
        status="confirmed"
    )
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)

    return TrainerSessionResponse(
        id=new_session.id,
        trainer_id=trainer.id,
        trainer_name=trainer.name,
        scheduled_at=new_session.scheduled_at,
        status=new_session.status
    )

@router.get("/sessions/me", response_model=list[TrainerSessionResponse])
async def get_my_trainer_sessions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can view trainer sessions.")

    result = await session.execute(select(Member).where(Member.user_id == current_user.id))
    member = result.scalars().first()
    if not member:
        return []

    ts_result = await session.execute(
        select(TrainerSession, Trainer.name)
        .join(Trainer, TrainerSession.trainer_id == Trainer.id)
        .where(TrainerSession.member_id == member.id)
        .order_by(TrainerSession.scheduled_at.desc())
    )

    sessions = []
    for ts, t_name in ts_result:
        sessions.append(TrainerSessionResponse(
            id=ts.id,
            trainer_id=ts.trainer_id,
            trainer_name=t_name,
            scheduled_at=ts.scheduled_at,
            status=ts.status
        ))

    return sessions

@router.delete("/sessions/{session_id}", status_code=200)
async def cancel_trainer_session(
    session_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can cancel trainer sessions.")

    member_res = await session.execute(select(Member).where(Member.user_id == current_user.id))
    member = member_res.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    res_result = await session.execute(
        select(TrainerSession).where(
            TrainerSession.id == session_id,
            TrainerSession.member_id == member.id
        )
    )
    trainer_session = res_result.scalars().first()
    if not trainer_session:
        raise HTTPException(status_code=404, detail="Session not found or does not belong to you.")

    if trainer_session.status == "cancelled":
        raise HTTPException(status_code=400, detail="Session is already cancelled.")

    trainer_session.status = "cancelled"
    await session.commit()
    return {"message": "Session cancelled successfully."}

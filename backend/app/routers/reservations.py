from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from pydantic import BaseModel

from app.database import get_session
from app.models.reservation import Reservation
from app.models.fitness_class import FitnessClass
from app.models.member import Member
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])

class ReservationCreate(BaseModel):
    class_id: int

@router.post("/")
async def create_reservation(
    req: ReservationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can reserve classes.")
        
    result = await session.execute(select(Member).where(Member.user_id == current_user.id))
    member = result.scalars().first()
    
    if not member or member.subscription_status != "active":
        raise HTTPException(status_code=403, detail="Active subscription required to reserve a class.")
        
    class_result = await session.execute(select(FitnessClass).where(FitnessClass.id == req.class_id))
    fitness_class = class_result.scalars().first()
    if not fitness_class:
        raise HTTPException(status_code=404, detail="Class not found.")
        
    existing_reservation = await session.execute(
        select(Reservation).where(
            Reservation.class_id == req.class_id,
            Reservation.member_id == member.id,
            Reservation.status == "confirmed"
        )
    )
    if existing_reservation.scalars().first():
        raise HTTPException(status_code=400, detail="Ești deja înscris la această clasă.")
        
    res_result = await session.execute(
        select(func.count(Reservation.id)).where(
            Reservation.class_id == req.class_id,
            Reservation.status == "confirmed"
        )
    )
    reserved_count = res_result.scalar() or 0
    if reserved_count >= fitness_class.capacity:
        raise HTTPException(status_code=400, detail="Această clasă a atins capacitatea maximă.")
        
    reservation = Reservation(
        class_id=req.class_id,
        member_id=member.id,
        status="confirmed"
    )
    session.add(reservation)
    await session.commit()
    return {"message": "Reservation successful", "reservation_id": reservation.id}

@router.get("/me")
async def get_my_reservations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can view reservations.")
        
    result = await session.execute(select(Member).where(Member.user_id == current_user.id))
    member = result.scalars().first()
    if not member:
        return []
        
    res_result = await session.execute(
        select(Reservation, FitnessClass.name, FitnessClass.scheduled_at)
        .join(FitnessClass, Reservation.class_id == FitnessClass.id)
        .where(Reservation.member_id == member.id)
        .order_by(FitnessClass.scheduled_at.desc())
    )
    
    reservations = []
    for res, c_name, c_time in res_result:
        reservations.append({
            "id": res.id,
            "class_id": res.class_id,
            "class_name": c_name,
            "scheduled_at": c_time,
            "status": res.status
        })
        
    return reservations

@router.delete("/{reservation_id}")
async def cancel_reservation(
    reservation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can cancel reservations.")
        
    member_res = await session.execute(select(Member).where(Member.user_id == current_user.id))
    member = member_res.scalars().first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
        
    res_result = await session.execute(
        select(Reservation).where(
            Reservation.id == reservation_id,
            Reservation.member_id == member.id
        )
    )
    reservation = res_result.scalars().first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found or does not belong to you.")
        
    if reservation.status == "cancelled":
        raise HTTPException(status_code=400, detail="Reservation is already cancelled.")
        
    reservation.status = "cancelled"
    await session.commit()
    return {"message": "Reservation cancelled successfully."}

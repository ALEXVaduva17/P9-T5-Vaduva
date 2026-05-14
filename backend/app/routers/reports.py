from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_session
from app.models.payment import Payment, PaymentStatus
from app.models.reservation import Reservation
from app.models.fitness_class import FitnessClass
from app.models.facility import Facility
from app.models.user import User
from app.models.restricted_client import RestrictedClient
from app.models.member import Member
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

class RevenueResponse(BaseModel):
    year: int
    month: int
    total_revenue: float

class OccupancyReportItem(BaseModel):
    facility_id: int
    facility_name: str
    total_capacity: int
    total_confirmed_reservations: int
    occupancy_rate_percentage: float

class RestrictedClientReportItem(BaseModel):
    member_id: int
    member_name: str
    reason: str
    restricted_at: datetime

@router.get("/revenue", response_model=RevenueResponse)
async def generate_revenue_report(
    year: int = Query(..., description="Year of the report"),
    month: int = Query(..., description="Month of the report"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    stmt = (
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.status == PaymentStatus.completed,
                extract('year', Payment.paid_at) == year,
                extract('month', Payment.paid_at) == month
            )
        )
    )
    result = await session.execute(stmt)
    total = result.scalar() or 0.0
    return RevenueResponse(year=year, month=month, total_revenue=float(total))

@router.get("/occupancy", response_model=List[OccupancyReportItem])
async def generate_occupancy_report(
    year: int = Query(..., description="Year of the report"),
    month: int = Query(..., description="Month of the report"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # 1. Total capacity per facility for the given month
    stmt_capacity = (
        select(
            FitnessClass.facility_id,
            func.sum(FitnessClass.capacity).label('total_capacity')
        )
        .where(
            and_(
                extract('year', FitnessClass.scheduled_at) == year,
                extract('month', FitnessClass.scheduled_at) == month
            )
        )
        .group_by(FitnessClass.facility_id)
    )
    cap_result = await session.execute(stmt_capacity)
    capacities = {row.facility_id: row.total_capacity for row in cap_result}

    # 2. Total confirmed reservations per facility for the given month
    stmt_res = (
        select(
            FitnessClass.facility_id,
            func.count(Reservation.id).label('total_res')
        )
        .join(Reservation, Reservation.class_id == FitnessClass.id)
        .where(
            and_(
                extract('year', FitnessClass.scheduled_at) == year,
                extract('month', FitnessClass.scheduled_at) == month,
                Reservation.status == "confirmed"
            )
        )
        .group_by(FitnessClass.facility_id)
    )
    res_result = await session.execute(stmt_res)
    reservations = {row.facility_id: row.total_res for row in res_result}

    # 3. Get all facilities to build the report
    fac_result = await session.execute(select(Facility))
    facilities = fac_result.scalars().all()

    report = []
    for fac in facilities:
        cap = capacities.get(fac.id, 0)
        res = reservations.get(fac.id, 0)
        rate = (res / cap * 100) if cap > 0 else 0.0
        
        # Include ALL facilities, even those without classes (cap=0)
        report.append(OccupancyReportItem(
            facility_id=fac.id,
            facility_name=fac.name,
            total_capacity=cap,
            total_confirmed_reservations=res,
            occupancy_rate_percentage=round(rate, 2)
        ))

    return report

@router.get("/restricted-clients", response_model=List[RestrictedClientReportItem])
async def generate_restricted_clients_report(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """GET /api/reports/restricted-clients — list all currently restricted members."""
    stmt = (
        select(RestrictedClient, Member.first_name, Member.last_name)
        .join(Member, RestrictedClient.member_id == Member.id)
        .order_by(RestrictedClient.restricted_at.desc())
    )
    result = await session.execute(stmt)
    
    report = []
    for rc, first, last in result:
        report.append(RestrictedClientReportItem(
            member_id=rc.member_id,
            member_name=f"{first} {last}",
            reason=rc.reason,
            restricted_at=rc.restricted_at
        ))
    return report

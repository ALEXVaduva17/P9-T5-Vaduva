"""
Members router — Admin CRUD endpoints (REQ-4, REQ-5).

All endpoints require admin authorization (mocked).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import require_admin
from app.schemas.member import (
    MemberCreate,
    MemberListResponse,
    MemberResponse,
    MemberUpdate,
)
from app.services import member_service

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("", response_model=MemberListResponse)
async def list_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """GET /api/members — list all members (admin only)."""
    members, total = await member_service.get_all_members(session, skip, limit)

    # Enrich with email from the User relationship
    member_responses = []
    for m in members:
        member_responses.append(
            MemberResponse(
                id=m.id,
                user_id=m.user_id,
                first_name=m.first_name,
                last_name=m.last_name,
                phone=m.phone,
                email=m.user.email if m.user else "",
                subscription_status=m.subscription_status,
                created_at=m.created_at,
                updated_at=m.updated_at,
            )
        )

    return MemberListResponse(members=member_responses, total=total)


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: int,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """GET /api/members/{id} — get member details (admin only)."""
    m = await member_service.get_member_by_id(session, member_id)
    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        first_name=m.first_name,
        last_name=m.last_name,
        phone=m.phone,
        email=m.user.email if m.user else "",
        subscription_status=m.subscription_status,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.post("", response_model=MemberResponse, status_code=201)
async def create_member(
    data: MemberCreate,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """POST /api/members — create a new member + User account (admin only)."""
    m = await member_service.create_member(session, data)
    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        first_name=m.first_name,
        last_name=m.last_name,
        phone=m.phone,
        email=m.user.email if m.user else "",
        subscription_status=m.subscription_status,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: int,
    data: MemberUpdate,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """PUT /api/members/{id} — update member profile (admin only)."""
    m = await member_service.update_member(session, member_id, data)
    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        first_name=m.first_name,
        last_name=m.last_name,
        phone=m.phone,
        email=m.user.email if m.user else "",
        subscription_status=m.subscription_status,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )

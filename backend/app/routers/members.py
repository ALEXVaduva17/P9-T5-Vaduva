"""
Members router — Admin CRUD endpoints (REQ-4, REQ-5).

All endpoints require admin authorization (mocked).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import require_admin, get_current_user
from app.schemas.member import (
    MemberCreate,
    MemberListResponse,
    MemberResponse,
    MemberUpdate,
)
from app.services import member_service

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("/profile/me", response_model=MemberResponse)
async def get_my_profile(
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    from fastapi import HTTPException
    m = await member_service.get_member_by_user_id(session, current_user.id)
    if not m:
        raise HTTPException(status_code=404, detail="Profile not found")

    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        first_name=m.first_name,
        last_name=m.last_name,
        phone=m.phone,
        email=m.user.email if m.user else "",
        subscription_status=m.subscription_status,
        photo_url=m.photo_url,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.put("/profile/me", response_model=MemberResponse)
async def update_my_profile(
    data: MemberUpdate,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    from fastapi import HTTPException
    m = await member_service.get_member_by_user_id(session, current_user.id)
    if not m:
        raise HTTPException(status_code=404, detail="Profile not found")

    m = await member_service.update_member(session, m.id, data)
    await session.commit()
    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        first_name=m.first_name,
        last_name=m.last_name,
        phone=m.phone,
        email=m.user.email if m.user else "",
        subscription_status=m.subscription_status,
        photo_url=m.photo_url,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


from fastapi import UploadFile, File
import os

@router.post("/profile/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    from fastapi import HTTPException
    m = await member_service.get_member_by_user_id(session, current_user.id)
    if not m:
        raise HTTPException(status_code=404, detail="Profile not found")

    os.makedirs("uploads", exist_ok=True)
    filename = f"user_{current_user.id}_{file.filename}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    photo_url = f"/api/uploads/{filename}"
    m.photo_url = photo_url
    await session.commit()

    return {"photo_url": photo_url}


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
                photo_url=m.photo_url,
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
        photo_url=m.photo_url,
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
    await session.commit()
    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        first_name=m.first_name,
        last_name=m.last_name,
        phone=m.phone,
        email=m.user.email if m.user else "",
        subscription_status=m.subscription_status,
        photo_url=m.photo_url,
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
    await session.commit()
    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        first_name=m.first_name,
        last_name=m.last_name,
        phone=m.phone,
        email=m.user.email if m.user else "",
        subscription_status=m.subscription_status,
        photo_url=m.photo_url,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.delete("/{member_id}", status_code=204)
async def delete_member(
    member_id: int,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """DELETE /api/members/{id} — delete member and linked data (admin only)."""
    await member_service.delete_member(session, member_id)
    return None

"""
Member service — business logic for member CRUD.

At member creation, a User account is also provisioned in the users table
(simulated with a placeholder password since real auth is on another branch).
"""

from datetime import datetime

import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberUpdate


async def get_all_members(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Member], int]:
    """Return paginated member list and total count."""
    # Count
    count_q = select(sa_func.count()).select_from(Member)
    total = (await session.execute(count_q)).scalar() or 0

    # Fetch
    q = select(Member).offset(skip).limit(limit).order_by(Member.id)
    result = await session.execute(q)
    members = result.scalars().all()

    return members, total


async def get_member_by_id(session: AsyncSession, member_id: int) -> Member:
    """Fetch a single member or raise 404."""
    q = select(Member).where(Member.id == member_id)
    result = await session.execute(q)
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with id={member_id} not found",
        )
    return member


async def get_member_by_user_id(session: AsyncSession, user_id: int) -> Member | None:
    """Fetch member by their linked user_id (used for /me endpoints)."""
    q = select(Member).where(Member.user_id == user_id)
    result = await session.execute(q)
    return result.scalar_one_or_none()


async def create_member(session: AsyncSession, data: MemberCreate) -> Member:
    """
    Create a new member + provision a User account.

    The User account is created with a temporary hashed password.
    In production this would trigger an email invite flow.
    """
    # Check if email already exists
    existing = await session.execute(
        select(User).where(User.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{data.email}' already exists",
        )

    # 1. Create User account
    temp_password = "changeme123"
    hashed = bcrypt.hashpw(temp_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(
        email=data.email,
        hashed_password=hashed,
        role=UserRole.member.value,
    )
    session.add(user)
    await session.flush()  # get user.id

    # 2. Create Member profile
    member = Member(
        user_id=user.id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
    )
    session.add(member)
    await session.flush()

    # Eager-load the user relationship for the response
    await session.refresh(member, ["user"])
    return member


async def update_member(
    session: AsyncSession,
    member_id: int,
    data: MemberUpdate,
) -> Member:
    """Update member profile fields. Optionally updates the linked User email."""
    member = await get_member_by_id(session, member_id)

    update_data = data.model_dump(exclude_unset=True)

    # If email is being changed, update the User record too
    if "email" in update_data:
        new_email = update_data.pop("email")
        # Check uniqueness
        existing = await session.execute(
            select(User).where(User.email == new_email, User.id != member.user_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A user with email '{new_email}' already exists",
            )
        user_q = select(User).where(User.id == member.user_id)
        user = (await session.execute(user_q)).scalar_one()
        user.email = new_email

    if "password" in update_data:
        new_pass = update_data.pop("password")
        if new_pass:
            hashed = bcrypt.hashpw(new_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user_q = select(User).where(User.id == member.user_id)
            user = (await session.execute(user_q)).scalar_one()
            user.hashed_password = hashed

    # Update member fields
    for field, value in update_data.items():
        setattr(member, field, value)

    member.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(member, ["user"])
    return member

from app.models.subscription import Subscription
from app.models.reservation import Reservation
from app.models.trainer_session import TrainerSession

async def delete_member(session: AsyncSession, member_id: int) -> None:
    member = await get_member_by_id(session, member_id)

    # 1. Delete Trainer Sessions
    await session.execute(
        select(TrainerSession).where(TrainerSession.member_id == member.id)
    )
    ts_result = await session.execute(select(TrainerSession).where(TrainerSession.member_id == member.id))
    for ts in ts_result.scalars().all():
        await session.delete(ts)

    # 2. Delete Reservations
    res_result = await session.execute(select(Reservation).where(Reservation.member_id == member.id))
    for r in res_result.scalars().all():
        await session.delete(r)

    # 3. Delete Subscriptions
    sub_result = await session.execute(select(Subscription).where(Subscription.member_id == member.id))
    for s in sub_result.scalars().all():
        await session.delete(s)

    user_id = member.user_id
    await session.delete(member)

    if user_id:
        user_result = await session.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if user:
            await session.delete(user)

    await session.commit()

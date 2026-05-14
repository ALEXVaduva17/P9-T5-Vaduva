"""
Subscription service — business logic for subscriptions.

REQ-8:  total_amount = base_fee + pt_sessions * 50
REQ-4:  Admin can modify prices (via SubscriptionType updates).
REQ-16: Member views their own active subscription.
"""

from datetime import date, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.member import Member
from app.models.subscription import Subscription
from app.models.subscription_type import SubscriptionType
from app.schemas.subscription import SubscriptionCreate, SubscriptionTypeUpdate, SubscriptionTypeCreate, SubscriptionUpdate


PT_SESSION_COST = Decimal("50")  # REQ-8: each PT session costs 50 RON


async def get_subscription_types(session: AsyncSession) -> list[SubscriptionType]:
    """Return all subscription types/plans."""
    q = select(SubscriptionType).order_by(SubscriptionType.id)
    result = await session.execute(q)
    return list(result.scalars().all())


async def update_subscription_type(
    session: AsyncSession,
    type_id: int,
    data: SubscriptionTypeUpdate,
) -> SubscriptionType:
    """Admin updates a subscription type (e.g. changes base_fee — REQ-4)."""
    q = select(SubscriptionType).where(SubscriptionType.id == type_id)
    result = await session.execute(q)
    sub_type = result.scalar_one_or_none()

    if not sub_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SubscriptionType with id={type_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sub_type, field, value)

    await session.flush()
    await session.refresh(sub_type)
    return sub_type


async def create_subscription_type(
    session: AsyncSession,
    data: SubscriptionTypeCreate,
) -> SubscriptionType:
    """Admin creates a new subscription type."""
    new_type = SubscriptionType(
        name=data.name,
        base_fee=data.base_fee,
        duration_days=data.duration_days,
        description=getattr(data, 'description', None),
        is_active=data.is_active
    )
    session.add(new_type)
    await session.flush()
    await session.refresh(new_type)
    return new_type


async def delete_subscription_type(
    session: AsyncSession,
    type_id: int,
) -> None:
    """Admin deletes a subscription type."""
    q = select(SubscriptionType).where(SubscriptionType.id == type_id)
    result = await session.execute(q)
    sub_type = result.scalar_one_or_none()

    if not sub_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SubscriptionType with id={type_id} not found",
        )

    await session.delete(sub_type)
    await session.flush()


def calculate_total(base_fee: Decimal, pt_sessions: int) -> Decimal:
    """REQ-8: total_amount = base_fee + pt_sessions * 50."""
    return base_fee + Decimal(pt_sessions) * PT_SESSION_COST


async def create_subscription(
    session: AsyncSession,
    data: SubscriptionCreate,
) -> Subscription:
    """
    Admin creates a subscription for a member.

    Validates:
    - Member exists
    - SubscriptionType exists and is active
    - Member doesn't already have an active subscription
    """
    # 1. Validate member
    member_q = select(Member).where(Member.id == data.member_id)
    member = (await session.execute(member_q)).scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with id={data.member_id} not found",
        )

    # 2. Validate subscription type
    type_q = select(SubscriptionType).where(SubscriptionType.id == data.type_id)
    sub_type = (await session.execute(type_q)).scalar_one_or_none()
    if not sub_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SubscriptionType with id={data.type_id} not found",
        )
    if not sub_type.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This subscription type is currently inactive",
        )

    # 3. Check for existing active subscription
    active_q = select(Subscription).where(
        Subscription.member_id == data.member_id,
        Subscription.status == "active",
    )
    existing = (await session.execute(active_q)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Member already has an active subscription",
        )

    # 4. Calculate price (REQ-8)
    total = calculate_total(sub_type.base_fee, data.pt_sessions)
    today = date.today()

    # 5. Determine type label
    type_label = "personalized" if data.pt_sessions > 0 else "standard"

    subscription = Subscription(
        member_id=data.member_id,
        type_id=data.type_id,
        type=type_label,
        base_fee=sub_type.base_fee,
        pt_sessions=data.pt_sessions,
        total_amount=total,
        start_date=today,
        end_date=today + timedelta(days=sub_type.duration_days),
        status="active",
    )
    session.add(subscription)

    # Update member status
    member.subscription_status = "active"

    await session.flush()
    await session.refresh(subscription)
    return subscription


async def get_active_subscription(
    session: AsyncSession,
    member_id: int,
) -> Subscription | None:
    """REQ-16: Get the member's active subscription (if any)."""
    q = select(Subscription).where(
        Subscription.member_id == member_id,
        Subscription.status == "active",
    )
    result = await session.execute(q)
    return result.scalar_one_or_none()


async def get_member_subscriptions(
    session: AsyncSession,
    member_id: int,
) -> list[Subscription]:
    """Get all subscriptions for a member (active + historical)."""
    q = (
        select(Subscription)
        .where(Subscription.member_id == member_id)
        .order_by(Subscription.created_at.desc())
    )
    result = await session.execute(q)
    return list(result.scalars().all())


async def update_member_subscription(
    session: AsyncSession,
    member_id: int,
    data: SubscriptionUpdate,
) -> Subscription:
    """Admin updates an active subscription for a member."""
    active_sub = await get_active_subscription(session, member_id)
    if not active_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found for this member",
        )

    type_q = select(SubscriptionType).where(SubscriptionType.id == data.type_id)
    sub_type = (await session.execute(type_q)).scalar_one_or_none()
    if not sub_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SubscriptionType with id={data.type_id} not found",
        )
    if not sub_type.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This subscription type is currently inactive",
        )

    total = calculate_total(sub_type.base_fee, data.pt_sessions)
    type_label = "personalized" if data.pt_sessions > 0 else "standard"

    active_sub.type_id = data.type_id
    active_sub.type = type_label
    active_sub.base_fee = sub_type.base_fee
    active_sub.pt_sessions = data.pt_sessions
    active_sub.total_amount = total
    # Recalculate end_date from start_date if duration changed
    active_sub.end_date = active_sub.start_date + timedelta(days=sub_type.duration_days)

    await session.flush()
    await session.refresh(active_sub)
    return active_sub


async def cancel_member_subscription(
    session: AsyncSession,
    member_id: int,
) -> None:
    """Admin cancels an active subscription for a member."""
    active_sub = await get_active_subscription(session, member_id)
    if not active_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found for this member",
        )

    member_q = select(Member).where(Member.id == member_id)
    member = (await session.execute(member_q)).scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with id={member_id} not found",
        )

    await session.delete(active_sub)
    member.subscription_status = "none"
    await session.flush()

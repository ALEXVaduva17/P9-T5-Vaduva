"""
Subscriptions router — Admin + Member endpoints.

Endpoints:
- GET  /api/subscriptions/me          — REQ-16: member views own active subscription
- GET  /api/subscriptions/types       — list subscription types/plans
- POST /api/subscriptions             — admin creates subscription for a member
- PUT  /api/subscriptions/types/{id}  — admin updates subscription type (REQ-4: modify prices)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import get_current_user, require_admin
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionMeResponse,
    SubscriptionResponse,
    SubscriptionTypeResponse,
    SubscriptionTypeUpdate,
)
from app.services import member_service, subscription_service

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


# ══════════════════════════════════
# Member endpoints
# ══════════════════════════════════

@router.get("/me", response_model=SubscriptionMeResponse)
async def get_my_subscription(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    GET /api/subscriptions/me — REQ-16: member views their own active subscription.

    Uses the mock user's id to find the linked member and their active subscription.
    """
    member = await member_service.get_member_by_user_id(session, current_user["id"])

    if not member:
        return SubscriptionMeResponse(
            subscription=None,
            member_name="Unknown",
            subscription_status="none",
        )

    active_sub = await subscription_service.get_active_subscription(session, member.id)
    sub_response = None
    if active_sub:
        sub_response = SubscriptionResponse.model_validate(active_sub)

    return SubscriptionMeResponse(
        subscription=sub_response,
        member_name=f"{member.first_name} {member.last_name}",
        subscription_status=member.subscription_status,
    )


# ══════════════════════════════════
# Admin endpoints
# ══════════════════════════════════

@router.get("/types", response_model=list[SubscriptionTypeResponse])
async def list_subscription_types(
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """GET /api/subscriptions/types — list all subscription plans."""
    types = await subscription_service.get_subscription_types(session)
    return [SubscriptionTypeResponse.model_validate(t) for t in types]


@router.post("", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(
    data: SubscriptionCreate,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """POST /api/subscriptions — admin creates a subscription for a member."""
    sub = await subscription_service.create_subscription(session, data)
    return SubscriptionResponse.model_validate(sub)


@router.put("/types/{type_id}", response_model=SubscriptionTypeResponse)
async def update_subscription_type(
    type_id: int,
    data: SubscriptionTypeUpdate,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """PUT /api/subscriptions/types/{id} — admin updates subscription type / price (REQ-4)."""
    sub_type = await subscription_service.update_subscription_type(session, type_id, data)
    return SubscriptionTypeResponse.model_validate(sub_type)

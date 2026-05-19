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
    SubscriptionTypeCreate,
)
from app.services import member_service, subscription_service

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


# ══════════════════════════════════
# Public endpoints
# ══════════════════════════════════

@router.get("/types/public", response_model=list[SubscriptionTypeResponse])
async def list_subscription_types_public(
    session: AsyncSession = Depends(get_session),
):
    """GET /api/subscriptions/types/public — public listing of active subscription plans."""
    types = await subscription_service.get_subscription_types(session)
    return [SubscriptionTypeResponse.model_validate(t) for t in types if t.is_active]


# ══════════════════════════════════
# Member endpoints
# ══════════════════════════════════

@router.get("/me", response_model=SubscriptionMeResponse)
async def get_my_subscription(
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """
    GET /api/subscriptions/me — REQ-16: member views their own active subscription.

    Uses the logged in user's id to find the linked member and their active subscription.
    """
    member = await member_service.get_member_by_user_id(session, current_user.id)

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


@router.delete("/me")
async def cancel_my_subscription(
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    from fastapi import HTTPException
    member = await member_service.get_member_by_user_id(session, current_user.id)
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")

    active_sub = await subscription_service.get_active_subscription(session, member.id)
    if not active_sub:
        raise HTTPException(status_code=400, detail="No active subscription to cancel")

    await session.delete(active_sub)
    member.subscription_status = "none"
    await session.commit()

    return {"message": "Subscription cancelled successfully"}

from pydantic import BaseModel
class BuySubscriptionReq(BaseModel):
    type_id: int
    pt_sessions: int = 0

@router.post("/buy")
async def buy_subscription(
    req: BuySubscriptionReq,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user)
):
    from app.services.payment_service import PaymentService
    from fastapi import HTTPException
    
    # 1. Get member
    member = await member_service.get_member_by_user_id(session, current_user.id)
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
        
    # 2. Verify subscription type
    from app.models.subscription_type import SubscriptionType
    from sqlalchemy.future import select
    res = await session.execute(select(SubscriptionType).where(SubscriptionType.id == req.type_id))
    sub_type = res.scalars().first()
    if not sub_type or not sub_type.is_active:
        raise HTTPException(status_code=404, detail="Plan not available")
        
    # 3. Create Subscription (Mocking payment flow)
    sub_data = SubscriptionCreate(
        member_id=member.id,
        type_id=req.type_id,
        pt_sessions=req.pt_sessions
    )
    sub = await subscription_service.create_subscription(session, sub_data)
    
    # 4. Initiate mock payment & auto-complete it
    payment = await PaymentService.initiate_payment(session, sub.id, float(sub.total_amount), "RON")
    await PaymentService.handle_webhook(session, payment.gateway_session_id, is_success=True)
    
    return {"message": "Subscription activated successfully"}


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

@router.post("/types", response_model=SubscriptionTypeResponse, status_code=201)
async def create_subscription_type(
    data: SubscriptionTypeCreate,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """POST /api/subscriptions/types — admin creates a new subscription type."""
    sub_type = await subscription_service.create_subscription_type(session, data)
    return SubscriptionTypeResponse.model_validate(sub_type)

@router.delete("/types/{type_id}", status_code=204)
async def delete_subscription_type(
    type_id: int,
    session: AsyncSession = Depends(get_session),
    _admin: dict = Depends(require_admin),
):
    """DELETE /api/subscriptions/types/{id} — admin deletes a subscription type."""
    await subscription_service.delete_subscription_type(session, type_id)
    await session.commit()
    return None

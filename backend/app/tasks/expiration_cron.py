"""
Expiration Cron Job — REQ-6.

Runs daily to:
1. Find subscriptions where end_date <= today and status == 'active'
2. Mark them as 'expired'
3. Set the member's subscription_status to 'restricted'
4. Insert a record into restricted_clients
"""

import logging
from datetime import date, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models.member import Member
from app.models.subscription import Subscription
from app.models.restricted_client import RestrictedClient
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


async def run_expiration_check():
    """
    Async function called by APScheduler daily.

    Scans for active subscriptions that have passed their end_date,
    marks them expired, and moves the member to restricted_clients.
    """
    logger.info("🕐 Expiration cron job started...")

    async with async_session_factory() as session:
        try:
            today = date.today()

            # 1. Find all active subscriptions that have expired
            q = select(Subscription).where(
                Subscription.status == "active",
                Subscription.end_date <= today,
            )
            result = await session.execute(q)
            expired_subscriptions = result.scalars().all()

            if not expired_subscriptions:
                logger.info("✅ No expired subscriptions found.")
                return

            expired_count = 0
            restricted_count = 0

            for sub in expired_subscriptions:
                # 2. Mark subscription as expired
                sub.status = "expired"
                expired_count += 1

                # 3. Update member status to 'restricted'
                member_q = select(Member).where(Member.id == sub.member_id)
                member = (await session.execute(member_q)).scalar_one_or_none()

                if member:
                    member.subscription_status = "restricted"
                    member.updated_at = datetime.utcnow()

                    # 4. Check if already in restricted_clients
                    existing_q = select(RestrictedClient).where(
                        RestrictedClient.member_id == member.id
                    )
                    existing = (await session.execute(existing_q)).scalar_one_or_none()

                    if not existing:
                        restricted = RestrictedClient(
                            member_id=member.id,
                            subscription_id=sub.id,
                            reason=f"Subscription #{sub.id} expired on {sub.end_date}",
                        )
                        session.add(restricted)
                        restricted_count += 1
                        
                        # 5. Send notification email (UC-27)
                        if member.user and member.user.email:
                            await EmailService.send_expiration_notification(
                                member_email=member.user.email,
                                member_name=f"{member.first_name} {member.last_name}",
                                subscription_id=sub.id
                            )

            await session.commit()

            logger.info(
                f"✅ Expiration cron complete: "
                f"{expired_count} subscription(s) expired, "
                f"{restricted_count} member(s) restricted."
            )

        except Exception as e:
            await session.rollback()
            logger.error(f"❌ Expiration cron job failed: {e}", exc_info=True)
            raise

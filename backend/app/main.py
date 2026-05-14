"""
FastAPI application entry point.

Registers routers, configures CORS, sets up APScheduler
for the daily expiration cron job, and creates tables on startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base

# ── Import all models so Base.metadata is populated ──
from app.models.user import User  # noqa: F401
from app.models.member import Member  # noqa: F401
from app.models.subscription_type import SubscriptionType  # noqa: F401
from app.models.subscription import Subscription  # noqa: F401
from app.models.restricted_client import RestrictedClient  # noqa: F401
from app.models.facility import Facility  # noqa: F401
from app.models.fitness_class import FitnessClass  # noqa: F401
from app.models.reservation import Reservation  # noqa: F401
from app.models.equipment import Equipment  # noqa: F401
from app.models.trainer import Trainer  # noqa: F401
from app.models.trainer_session import TrainerSession  # noqa: F401
# ── Routers ──
from app.routers import auth, members, subscriptions, payments, equipment, reports, reservations, classes, trainers, facilities

# ── Scheduler ──
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tasks.expiration_cron import run_expiration_check

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# ── Lifespan (startup / shutdown) ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application-level resources."""
    # Startup — create tables (development only, use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified.")

    # Seed default subscription types if none exist
    await _seed_subscription_types()

    # Start the APScheduler cron job (runs daily at midnight)
    scheduler.add_job(
        run_expiration_check,
        trigger=CronTrigger(hour=0, minute=0),
        id="expiration_cron",
        name="Daily subscription expiration check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — expiration cron scheduled at 00:00 daily.")

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    await engine.dispose()
    logger.info("Database connections closed.")


# ── App instance ──
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.2.0",
    lifespan=lifespan,
)

# ── CORS (allow the Vite dev server) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(subscriptions.router)
app.include_router(payments.router)
app.include_router(equipment.router)
app.include_router(reports.router)
app.include_router(reservations.router)
app.include_router(classes.router)
app.include_router(trainers.router)
app.include_router(facilities.router)

import os
from fastapi.staticfiles import StaticFiles

os.makedirs("uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Health check ──
@app.get("/api/health", tags=["infra"])
async def health_check():
    """Simple liveness probe."""
    return {
        "status": "operational",
        "service": settings.PROJECT_NAME,
        "version": "0.2.0",
    }


# ── Seed helper ──
async def _seed_subscription_types():
    """Insert default subscription types if the table is empty."""
    from app.database import async_session_factory
    from sqlalchemy import select, func as sa_func

    async with async_session_factory() as session:
        count = (await session.execute(
            select(sa_func.count()).select_from(SubscriptionType)
        )).scalar() or 0

        if count == 0:
            defaults = [
                SubscriptionType(name="Standard Lunar", base_fee=150.00, duration_days=30),
                SubscriptionType(name="Premium Lunar", base_fee=250.00, duration_days=30),
                SubscriptionType(name="Standard Trimestrial", base_fee=400.00, duration_days=90),
                SubscriptionType(name="Premium Anual", base_fee=1200.00, duration_days=365),
            ]
            session.add_all(defaults)
            await session.commit()
            logger.info("Seeded 4 default subscription types.")

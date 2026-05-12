"""
Async SQLAlchemy engine & session factory.

Usage in route handlers:
    from app.database import get_session
    async def my_route(session: AsyncSession = Depends(get_session)):
        ...
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ── Engine ──
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,       # Log SQL in debug mode
    future=True,
    pool_size=5,
    max_overflow=10,
)

# ── Session factory ──
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Declarative Base (models will inherit from this) ──
class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# ── Dependency for FastAPI ──
async def get_session() -> AsyncSession:  # type: ignore[misc]
    """Yield an async session and ensure it is closed after the request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

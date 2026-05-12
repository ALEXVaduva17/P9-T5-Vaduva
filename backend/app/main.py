"""
FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routers import auth


# ── Lifespan (startup / shutdown) ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application-level resources."""
    # Startup — nothing heavy yet; DB pool is lazy
    yield
    # Shutdown — dispose of the connection pool
    await engine.dispose()


# ── App instance ──
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS (allow the Vite dev server) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth.router)

# ── Health check ──
@app.get("/health", tags=["infra"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok"}

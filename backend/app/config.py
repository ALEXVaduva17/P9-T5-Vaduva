"""
Application settings loaded from environment variables.
Uses pydantic-settings for validation and type coercion.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration — values are read from env vars / .env file."""

    # ── Database ──
    DATABASE_URL: str = (
        "postgresql+asyncpg://fitness_user:fitness_secret_password@db:5432/fitness_center_db"
    )

    # ── Security ──
    SECRET_KEY: str = "change-me-to-a-random-secret"

    # ── App ──
    PROJECT_NAME: str = "Fitness Center Management System"
    DEBUG: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Singleton instance — import this wherever settings are needed
settings = Settings()

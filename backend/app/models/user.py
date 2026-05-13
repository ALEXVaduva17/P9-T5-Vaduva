"""
User model — minimal definition for FK references.

The real User model (with password hashing, JWT, lockout logic)
lives on the feature/auth branch. This is the structural stub
needed by Member.user_id ForeignKey.
"""

from datetime import datetime
import enum

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.member.value)
    is_active = Column(Boolean, nullable=False, default=True)
    is_locked = Column(Boolean, nullable=False, default=False)
    login_attempts = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.user import User
from app.schemas.auth import Token, UserResponse
from app.services.auth_service import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    phone: str = ""
    first_name: str = ""
    last_name: str = ""

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session)
):
    from sqlalchemy.future import select
    from app.services.auth_service import get_password_hash
    from app.models.member import Member
    
    # Check if user already exists
    result = await session.execute(select(User).where(User.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email is already registered.")
        
    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role="member",
        is_active=True
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    
    # Create an empty member profile for them
    member_profile = Member(
        user_id=new_user.id,
        first_name=user_data.first_name or user_data.email.split('@')[0],
        last_name=user_data.last_name or "",
        phone=user_data.phone or "",
        subscription_status="none"
    )
    session.add(member_profile)
    await session.commit()
    
    return new_user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)
):
    user = await authenticate_user(session, form_data.username, form_data.password)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"email": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

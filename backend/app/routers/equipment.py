from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel

from app.database import get_session
from app.models.equipment import Equipment
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/equipment", tags=["Equipment"])

async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

class EquipmentCreate(BaseModel):
    facility_id: int | None = None
    name: str
    category: str | None = None
    quantity: int = 1
    condition: str = "good"

class EquipmentResponse(EquipmentCreate):
    id: int

    class Config:
        from_attributes = True

@router.post("/", response_model=EquipmentResponse)
async def create_equipment(
    equipment: EquipmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    new_equipment = Equipment(**equipment.model_dump())
    session.add(new_equipment)
    await session.commit()
    await session.refresh(new_equipment)
    return new_equipment

@router.get("/", response_model=List[EquipmentResponse])
async def get_equipments(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    result = await session.execute(select(Equipment))
    return result.scalars().all()

@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    equipment_update: EquipmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    result = await session.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalars().first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    for key, value in equipment_update.model_dump().items():
        setattr(equipment, key, value)
        
    await session.commit()
    await session.refresh(equipment)
    return equipment

@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    result = await session.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalars().first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    await session.delete(equipment)
    await session.commit()
    return {"message": "Equipment deleted"}

from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100))
    quantity = Column(Integer, default=1)
    condition = Column(String(50), default="good") # "good", "fair", "poor", "broken"

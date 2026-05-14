from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from app.database import Base

class FitnessClass(Base):
    __tablename__ = "fitness_classes"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"))
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    name = Column(String(100))
    description = Column(Text, nullable=True)
    capacity = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=60)
    scheduled_at = Column(DateTime)

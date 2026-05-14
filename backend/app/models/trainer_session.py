from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.database import Base

class TrainerSession(Base):
    __tablename__ = "trainer_sessions"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String(50), default="confirmed")

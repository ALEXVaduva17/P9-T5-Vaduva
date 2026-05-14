from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("fitness_classes.id"))
    member_id = Column(Integer, ForeignKey("members.id"))
    status = Column(String(50)) # e.g. "confirmed", "cancelled"

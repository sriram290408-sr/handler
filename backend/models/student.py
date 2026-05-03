from sqlalchemy import Column, DateTime, Integer, String, func
from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    father_name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)
    standard = Column(Integer, nullable=False, index=True)
    medium = Column(String(50), nullable=False)
    school_name = Column(String(150), nullable=False)
    dob = Column(String(20), nullable=False)
    community = Column(String(100), nullable=False)
    blood_group = Column(String(10), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    parent_phone_number = Column(String(15), nullable=False, index=True)
    parents_occupation = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
from sqlalchemy import Column, DateTime, Integer, String, func

from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    standard = Column(Integer, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    blood_group = Column(String(10), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    father_name = Column(String(100), nullable=False)
    father_occupation = Column(String(100), nullable=False)
    mother_name = Column(String(100), nullable=False)
    mother_occupation = Column(String(100), nullable=False)
    school_name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

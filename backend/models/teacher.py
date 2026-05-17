from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    func,
)

from database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    gender = Column(String, nullable=False)

    qualification = Column(String, nullable=False)

    experience = Column(Integer, nullable=False)

    phone_number = Column(String, nullable=False)

    email = Column(String, nullable=False, unique=True)

    address = Column(String, nullable=False)

    # JSON strings
    subjects = Column(String, nullable=False)

    assigned_classes = Column(String, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

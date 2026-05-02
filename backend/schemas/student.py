from datetime import datetime
from enum import Enum
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class BloodGroupEnum(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class StudentBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    standard: int = Field(ge=6, le=12)
    age: int = Field(ge=3, le=30)
    blood_group: BloodGroupEnum
    email: EmailStr
    father_name: str = Field(min_length=1, max_length=100)
    father_occupation: str = Field(min_length=1, max_length=100)
    mother_name: str = Field(min_length=1, max_length=100)
    mother_occupation: str = Field(min_length=1, max_length=100)
    school_name: str = Field(min_length=1, max_length=150)
    address: str = Field(min_length=1, max_length=255)
    phone_number: str = Field(
        min_length=7,
        max_length=15,
        pattern=r"^\+?[0-9]{7,15}$"
    )

    # ✅ FIX ADDED HERE
    @field_validator("phone_number", mode="before")
    @classmethod
    def clean_phone_number(cls, v):
        if v is None:
            raise ValueError("Phone number is required")

        v = str(v).strip()

        # Handle float issue from CSV
        if v.endswith(".0"):
            v = v[:-2]

        # Remove spaces
        v = v.replace(" ", "")

        if not re.fullmatch(r"\+?[0-9]{7,15}", v):
            raise ValueError("Phone number must be 7-15 digits")

        return v


class StudentCreate(StudentBase):
    pass


class StudentPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    standard: int | None = Field(default=None, ge=6, le=12)
    age: int | None = Field(default=None, ge=3, le=30)
    blood_group: BloodGroupEnum | None = None
    email: EmailStr | None = None
    father_name: str | None = Field(default=None, min_length=1, max_length=100)
    father_occupation: str | None = Field(default=None, min_length=1, max_length=100)
    mother_name: str | None = Field(default=None, min_length=1, max_length=100)
    mother_occupation: str | None = Field(default=None, min_length=1, max_length=100)
    school_name: str | None = Field(default=None, min_length=1, max_length=150)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    phone_number: str | None = Field(
        default=None,
        min_length=7,
        max_length=15,
        pattern=r"^\+?[0-9]{7,15}$"
    )


class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class StudentListResponse(BaseModel):
    data: list[StudentResponse]
    total: int
    page: int
    total_pages: int


class StandardDistributionItem(BaseModel):
    standard: int
    count: int
    percentage: float


class DashboardStatsResponse(BaseModel):
    total_students: int
    standards: list[StandardDistributionItem]
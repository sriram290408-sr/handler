from datetime import datetime
from enum import Enum
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BloodGroupEnum(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


def normalize_phone_number(v):
    if v is None:
        raise ValueError("Phone number is required")

    v = str(v).strip().replace(" ", "")

    if v.endswith(".0"):
        v = v[:-2]

    if "e" in v.lower():
        try:
            v = str(int(float(v)))
        except Exception:
            raise ValueError("Invalid phone number format")

    if v.startswith("+91"):
        v = v[3:]
    elif v.startswith("91") and len(v) == 12:
        v = v[2:]

    v = re.sub(r"[^\d]", "", v)

    if not re.fullmatch(r"[6-9]\d{9}", v):
        raise ValueError("Phone number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9")

    return v


class StudentBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    father_name: str = Field(min_length=1, max_length=100)
    gender: str = Field(min_length=1, max_length=10)
    standard: int = Field(ge=6, le=12)
    medium: str = Field(min_length=1, max_length=50)
    school_name: str = Field(min_length=1, max_length=150)
    dob: str = Field(min_length=1, max_length=20)
    community: str = Field(min_length=1, max_length=100)
    blood_group: BloodGroupEnum
    address: str = Field(min_length=1, max_length=255)
    parent_phone_number: str
    parents_occupation: str = Field(min_length=1, max_length=100)

    @field_validator("parent_phone_number", mode="before")
    @classmethod
    def clean_phone_number(cls, v):
        return normalize_phone_number(v)


class StudentCreate(StudentBase):
    pass


class StudentPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    father_name: str | None = Field(default=None, min_length=1, max_length=100)
    gender: str | None = Field(default=None, min_length=1, max_length=10)
    standard: int | None = Field(default=None, ge=6, le=12)
    medium: str | None = Field(default=None, min_length=1, max_length=50)
    school_name: str | None = Field(default=None, min_length=1, max_length=150)
    dob: str | None = Field(default=None, min_length=1, max_length=20)
    community: str | None = Field(default=None, min_length=1, max_length=100)
    blood_group: BloodGroupEnum | None = None
    address: str | None = Field(default=None, min_length=1, max_length=255)
    parent_phone_number: str | None = None
    parents_occupation: str | None = Field(default=None, min_length=1, max_length=100)

    @field_validator("parent_phone_number", mode="before")
    @classmethod
    def clean_phone_number_patch(cls, v):
        if v is None:
            return v
        return normalize_phone_number(v)


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
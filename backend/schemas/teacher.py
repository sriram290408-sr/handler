from datetime import datetime, date
from typing import List, Literal

from pydantic import BaseModel, EmailStr


TeacherAttendanceStatus = Literal["present", "absent", "leave"]


class TeacherBase(BaseModel):
    name: str

    gender: str

    qualification: str

    experience: int

    phone_number: str

    email: EmailStr

    address: str

    subjects: List[str]

    assigned_classes: List[str]


class TeacherCreate(TeacherBase):
    pass


class TeacherPatch(BaseModel):
    name: str | None = None

    gender: str | None = None

    qualification: str | None = None

    experience: int | None = None

    phone_number: str | None = None

    email: EmailStr | None = None

    address: str | None = None

    subjects: List[str] | None = None

    assigned_classes: List[str] | None = None


class TeacherResponse(TeacherBase):
    id: int

    created_at: datetime

    class Config:
        from_attributes = True


class TeacherListResponse(BaseModel):
    data: list[TeacherResponse]

    total: int

    page: int

    total_pages: int


class TeacherAttendanceCreate(BaseModel):
    teacher_id: int

    status: TeacherAttendanceStatus


class TeacherAttendanceResponse(BaseModel):
    id: int

    teacher_id: int

    date: date

    status: TeacherAttendanceStatus

    class Config:
        from_attributes = True
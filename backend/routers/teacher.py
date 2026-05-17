import json
from math import ceil
from datetime import date, datetime
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from core.dependencies import get_current_user

from models.teacher import Teacher
from models.teacher_attendance import TeacherAttendance

from schemas.teacher import (
    TeacherCreate,
    TeacherPatch,
    TeacherResponse,
    TeacherListResponse,
    TeacherAttendanceCreate,
)

router = APIRouter(
    prefix="/teachers",
    tags=["Teachers"],
)


TeacherAttendanceStatus = Literal["present", "absent", "leave"]
VALID_STATUSES = {"present", "absent", "leave"}


class TeacherAttendanceRecordSave(BaseModel):
    teacher_id: int
    status: TeacherAttendanceStatus


class TeacherAttendanceBulkSave(BaseModel):
    date: date
    records: list[TeacherAttendanceRecordSave]


# ─────────────────────────────────────────────
# Create Teacher
# ─────────────────────────────────────────────


@router.post(
    "",
    response_model=TeacherResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    existing = db.query(Teacher).filter(Teacher.email == payload.email).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Teacher email already exists",
        )

    teacher = Teacher(
        name=payload.name,
        gender=payload.gender,
        qualification=payload.qualification,
        experience=payload.experience,
        phone_number=payload.phone_number,
        email=payload.email,
        address=payload.address,
        subjects=json.dumps(payload.subjects),
        assigned_classes=json.dumps(payload.assigned_classes),
    )

    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    teacher.subjects = json.loads(teacher.subjects)
    teacher.assigned_classes = json.loads(teacher.assigned_classes)

    return teacher


# ─────────────────────────────────────────────
# List Teachers
# ─────────────────────────────────────────────


@router.get(
    "",
    response_model=TeacherListResponse,
)
def list_teachers(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    search: str | None = Query(default=None),
    subject: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    query = db.query(Teacher)

    if search:
        query = query.filter(Teacher.name.ilike(f"%{search}%"))

    teachers = query.order_by(Teacher.id.asc()).all()

    filtered = []

    for teacher in teachers:
        teacher.subjects = json.loads(teacher.subjects)
        teacher.assigned_classes = json.loads(teacher.assigned_classes)

        if subject and subject not in teacher.subjects:
            continue

        filtered.append(teacher)

    total = len(filtered)
    total_pages = ceil(total / limit) if total > 0 else 1

    start = (page - 1) * limit
    end = start + limit

    paginated = filtered[start:end]

    return TeacherListResponse(
        data=paginated,
        total=total,
        page=page,
        total_pages=total_pages,
    )


# ─────────────────────────────────────────────
# Get Teacher Daily Attendance
# IMPORTANT: Keep this before /{teacher_id}
# URL: /teachers/attendance/daily?date=YYYY-MM-DD
# ─────────────────────────────────────────────


@router.get("/attendance/daily")
def get_teacher_daily_attendance(
    date_str: str = Query(..., alias="date"),
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    try:
        target_date = datetime.strptime(
            date_str,
            "%Y-%m-%d",
        ).date()

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD",
        )

    teachers = db.query(Teacher).order_by(Teacher.id.asc()).all()

    attendance_records = (
        db.query(TeacherAttendance).filter(TeacherAttendance.date == target_date).all()
    )

    attendance_map = {record.teacher_id: record.status for record in attendance_records}

    records = []

    for teacher in teachers:
        status_value = attendance_map.get(teacher.id, "absent")

        if status_value not in VALID_STATUSES:
            status_value = "absent"

        records.append(
            {
                "teacher_id": teacher.id,
                "name": teacher.name,
                "email": teacher.email,
                "phone_number": teacher.phone_number,
                "status": status_value,
            }
        )

    present_count = sum(1 for record in records if record["status"] == "present")

    absent_count = sum(1 for record in records if record["status"] == "absent")

    leave_count = sum(1 for record in records if record["status"] == "leave")

    return {
        "date": target_date,
        "records": records,
        "total": len(records),
        "present": present_count,
        "absent": absent_count,
        "leave": leave_count,
    }


# ─────────────────────────────────────────────
# Save Teacher Attendance Bulk
# URL: /teachers/attendance/save
# ─────────────────────────────────────────────


@router.post("/attendance/save")
def save_teacher_attendance(
    payload: TeacherAttendanceBulkSave,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    try:
        for record in payload.records:
            teacher = db.query(Teacher).filter(Teacher.id == record.teacher_id).first()

            if not teacher:
                raise HTTPException(
                    status_code=404,
                    detail=f"Teacher not found: {record.teacher_id}",
                )

            if record.status not in VALID_STATUSES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status: {record.status}",
                )

            existing = (
                db.query(TeacherAttendance)
                .filter(
                    TeacherAttendance.teacher_id == record.teacher_id,
                    TeacherAttendance.date == payload.date,
                )
                .first()
            )

            if existing:
                existing.status = record.status

            else:
                db.add(
                    TeacherAttendance(
                        teacher_id=record.teacher_id,
                        date=payload.date,
                        status=record.status,
                    )
                )

        db.commit()

        return {
            "message": "Teacher attendance saved successfully",
            "date": str(payload.date),
            "present": sum(
                1 for record in payload.records if record.status == "present"
            ),
            "absent": sum(1 for record in payload.records if record.status == "absent"),
            "leave": sum(1 for record in payload.records if record.status == "leave"),
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ─────────────────────────────────────────────
# Mark Single Teacher Attendance
# Existing route kept for compatibility
# URL: /teachers/attendance
# ─────────────────────────────────────────────


@router.post("/attendance")
def mark_teacher_attendance(
    payload: TeacherAttendanceCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    teacher = db.query(Teacher).filter(Teacher.id == payload.teacher_id).first()

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found",
        )

    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status: {payload.status}",
        )

    existing = (
        db.query(TeacherAttendance)
        .filter(
            TeacherAttendance.teacher_id == payload.teacher_id,
            TeacherAttendance.date == date.today(),
        )
        .first()
    )

    if existing:
        existing.status = payload.status

    else:
        db.add(
            TeacherAttendance(
                teacher_id=payload.teacher_id,
                date=date.today(),
                status=payload.status,
            )
        )

    db.commit()

    return {
        "message": "Teacher attendance marked",
    }


# ─────────────────────────────────────────────
# Get Teacher
# IMPORTANT: Keep this below /attendance routes
# URL: /teachers/{teacher_id}
# ─────────────────────────────────────────────


@router.get(
    "/{teacher_id}",
    response_model=TeacherResponse,
)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found",
        )

    teacher.subjects = json.loads(teacher.subjects)
    teacher.assigned_classes = json.loads(teacher.assigned_classes)

    return teacher


# ─────────────────────────────────────────────
# Update Teacher
# ─────────────────────────────────────────────


@router.patch(
    "/{teacher_id}",
    response_model=TeacherResponse,
)
def patch_teacher(
    teacher_id: int,
    payload: TeacherPatch,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found",
        )

    updates = payload.model_dump(exclude_unset=True)

    for key, value in updates.items():
        if key in ["subjects", "assigned_classes"]:
            value = json.dumps(value)

        setattr(teacher, key, value)

    db.commit()
    db.refresh(teacher)

    teacher.subjects = json.loads(teacher.subjects)
    teacher.assigned_classes = json.loads(teacher.assigned_classes)

    return teacher


# ─────────────────────────────────────────────
# Delete Teacher
# ─────────────────────────────────────────────


@router.delete(
    "/{teacher_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found",
        )

    db.delete(teacher)
    db.commit()

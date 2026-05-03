from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.student import Student
from schemas.student import (
    BloodGroupEnum,
    StudentCreate,
    StudentListResponse,
    StudentPatch,
    StudentResponse,
)

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    student = Student(**payload.model_dump(exclude_none=True))
    db.add(student)
    try:
        db.commit()
        db.refresh(student)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create student")
    return student


@router.get("", response_model=StudentListResponse)
def list_students(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None),
    standard: int | None = Query(default=None, ge=6, le=12),
    blood_group: BloodGroupEnum | None = Query(default=None),
    community: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    query = db.query(Student)

    if search:
        query = query.filter(Student.name.ilike(f"%{search}%"))
    if standard is not None:
        query = query.filter(Student.standard == standard)
    if blood_group is not None:
        query = query.filter(Student.blood_group == blood_group.value)
    if community is not None:
        query = query.filter(func.lower(Student.community) == community.lower())  # ✅ exact match, not ilike

    total = query.count()
    total_pages = ceil(total / limit) if total > 0 else 1

    students = (
        query.order_by(Student.id.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return StudentListResponse(
        data=students,
        total=total,
        page=page,
        total_pages=total_pages,
    )


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.patch("/{student_id}", response_model=StudentResponse)
def patch_student(
    student_id: int,
    payload: StudentPatch,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    for key, value in updates.items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.student import Student
from schemas.student import DashboardStatsResponse, StandardDistributionItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    total_students = db.query(Student).count()
    rows = db.query(Student.standard, func.count(Student.id)).group_by(Student.standard).order_by(Student.standard).all()

    standards = []
    for standard, count in rows:
        percentage = (count / total_students * 100) if total_students else 0
        standards.append(
            StandardDistributionItem(
                standard=standard,
                count=count,
                percentage=round(percentage, 2),
            )
        )

    return DashboardStatsResponse(total_students=total_students, standards=standards)

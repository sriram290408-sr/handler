from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.attendence import Attendance
from models.student import Student
from schemas.attendence import (
    AttendanceBulkSave,
    DailyAttendanceResponse,
    DashboardAttendanceStats,
    StudentAnalysisResponse,
    StudentAttendanceStatus,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


# ─────────────────────────────────────────────────────────────────────────────
# WebSocket Manager
# ─────────────────────────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

        if websocket not in self.active_connections:
            self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [
            ws for ws in self.active_connections
            if ws != websocket
        ]

    async def broadcast(self, data: dict):
        disconnected = []

        for websocket in self.active_connections:
            try:
                await websocket.send_json(data)

            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket)


manager = ConnectionManager()


# ─────────────────────────────────────────────────────────────────────────────
# WebSocket Endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.websocket("/ws")
async def attendance_websocket(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            message = await websocket.receive_text()

            # optional ping-pong
            if message == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        manager.disconnect(websocket)

    except Exception:
        manager.disconnect(websocket)


# ─────────────────────────────────────────────────────────────────────────────
# Get Daily Attendance
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/daily", response_model=DailyAttendanceResponse)
def get_daily_attendance(
    date_str: str = Query(..., alias="date"),
    standard: int | None = Query(default=None, ge=6, le=12),
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

    student_query = db.query(Student)

    if standard is not None:
        student_query = student_query.filter(
            Student.standard == standard
        )

    students = (
        student_query
        .order_by(Student.id.asc())
        .all()
    )

    attendance_records = (
        db.query(Attendance)
        .filter(Attendance.date == target_date)
        .all()
    )

    attendance_map = {
        record.student_id: record.status
        for record in attendance_records
    }

    records = []

    for student in students:
        records.append(
            StudentAttendanceStatus(
                student_id=student.id,
                name=student.name,
                father_name=student.father_name,
                standard=student.standard,
                status=attendance_map.get(student.id, "absent"),
            )
        )

    present_count = sum(
        1 for record in records
        if record.status == "present"
    )

    return DailyAttendanceResponse(
        date=target_date,
        records=records,
        total=len(records),
        present=present_count,
        absent=len(records) - present_count,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Save Attendance
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/save")
async def save_attendance(
    payload: AttendanceBulkSave,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    try:
        for record in payload.records:

            existing = (
                db.query(Attendance)
                .filter(
                    Attendance.student_id == record.student_id,
                    Attendance.date == payload.date,
                )
                .first()
            )

            if existing:
                existing.status = record.status

            else:
                db.add(
                    Attendance(
                        student_id=record.student_id,
                        date=payload.date,
                        status=record.status,
                    )
                )

        db.commit()

        await manager.broadcast({
            "event": "attendance_saved",
            "date": str(payload.date),
            "present": sum(
                1 for r in payload.records
                if r.status == "present"
            ),
        })

        return {
            "message": "Attendance saved successfully",
            "date": str(payload.date),
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ─────────────────────────────────────────────────────────────────────────────
# Student Attendance Analysis
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/analysis/{student_id}",
    response_model=StudentAnalysisResponse,
)
def get_student_analysis(
    student_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    records = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.date.asc())
        .all()
    )

    month_data = defaultdict(
        lambda: {
            "present": 0,
            "total": 0,
        }
    )

    for record in records:
        key = (record.date.year, record.date.month)

        month_data[key]["total"] += 1

        if record.status == "present":
            month_data[key]["present"] += 1

    monthly_breakdown = []

    for (year, month), data in sorted(month_data.items()):

        percentage = (
            round(
                (data["present"] / data["total"]) * 100,
                1,
            )
            if data["total"]
            else 0.0
        )

        monthly_breakdown.append({
            "month": MONTH_LABELS[month - 1],
            "year": year,
            "total_days": data["total"],
            "present_days": data["present"],
            "percentage": percentage,
        })

    total_days = len(records)

    present_days = sum(
        1 for record in records
        if record.status == "present"
    )

    overall_percentage = (
        round((present_days / total_days) * 100, 1)
        if total_days
        else 0.0
    )

    highest_month = (
        max(
            monthly_breakdown,
            key=lambda x: x["percentage"],
        )
        if monthly_breakdown
        else None
    )

    lowest_month = (
        min(
            monthly_breakdown,
            key=lambda x: x["percentage"],
        )
        if monthly_breakdown
        else None
    )

    return StudentAnalysisResponse(
        student_id=student.id,
        name=student.name,
        father_name=student.father_name,
        standard=student.standard,
        medium=student.medium,
        school_name=student.school_name,
        total_session_days=total_days,
        days_present=present_days,
        days_absent=total_days - present_days,
        overall_percentage=overall_percentage,
        highest_month=(
            f"{highest_month['month']} "
            f"({highest_month['percentage']}%)"
            if highest_month
            else "-"
        ),
        lowest_month=(
            f"{lowest_month['month']} "
            f"({lowest_month['percentage']}%)"
            if lowest_month
            else "-"
        ),
        monthly_breakdown=monthly_breakdown,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Dashboard Attendance Stats
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/dashboard-stats",
    response_model=DashboardAttendanceStats,
)
def get_dashboard_attendance_stats(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    today = date.today()

    total_students = db.query(Student).count()

    today_records = (
        db.query(Attendance)
        .filter(Attendance.date == today)
        .all()
    )

    today_present = sum(
        1 for record in today_records
        if record.status == "present"
    )

    today_percentage = (
        round((today_present / total_students) * 100, 1)
        if total_students
        else 0.0
    )

    # Monthly Trend
    monthly_trend = []

    for i in range(9, -1, -1):

        ref_date = (
            today.replace(day=1)
            - timedelta(days=i * 30)
        )

        year = ref_date.year
        month = ref_date.month

        month_records = (
            db.query(Attendance)
            .filter(
                func.extract("year", Attendance.date) == year,
                func.extract("month", Attendance.date) == month,
            )
            .all()
        )

        if not month_records:
            monthly_trend.append({
                "month": MONTH_LABELS[month - 1],
                "percentage": 0.0,
            })
            continue

        days_map = defaultdict(
            lambda: {
                "present": 0,
                "total": 0,
            }
        )

        for record in month_records:

            days_map[record.date]["total"] += 1

            if record.status == "present":
                days_map[record.date]["present"] += 1

        daily_percentages = [
            (value["present"] / value["total"]) * 100
            for value in days_map.values()
            if value["total"] > 0
        ]

        average = (
            round(
                sum(daily_percentages)
                / len(daily_percentages),
                1,
            )
            if daily_percentages
            else 0.0
        )

        monthly_trend.append({
            "month": MONTH_LABELS[month - 1],
            "percentage": average,
        })

    # Overall Average Attendance
    all_records = db.query(Attendance).all()

    overall_days_map = defaultdict(
        lambda: {
            "present": 0,
            "total": 0,
        }
    )

    for record in all_records:

        overall_days_map[record.date]["total"] += 1

        if record.status == "present":
            overall_days_map[record.date]["present"] += 1

    overall_daily_percentages = [
        (value["present"] / value["total"]) * 100
        for value in overall_days_map.values()
        if value["total"] > 0
    ]

    average_attendance = (
        round(
            sum(overall_daily_percentages)
            / len(overall_daily_percentages),
            1,
        )
        if overall_daily_percentages
        else 0.0
    )

    return DashboardAttendanceStats(
        today={
            "date": today,
            "total": total_students,
            "present": today_present,
            "absent": total_students - today_present,
            "percentage": today_percentage,
        },
        monthly_trend=monthly_trend,
        avg_attendance=average_attendance,
        total_enrollment=total_students,
    )
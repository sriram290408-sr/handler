from datetime import date
from typing import Literal

from pydantic import BaseModel


AttendanceStatus = Literal["present", "absent", "leave"]


class AttendanceRecordSave(BaseModel):
    student_id: int
    status: AttendanceStatus


class AttendanceBulkSave(BaseModel):
    date: date
    records: list[AttendanceRecordSave]


class StudentAttendanceStatus(BaseModel):
    student_id: int
    name: str
    father_name: str | None = None
    standard: int
    status: AttendanceStatus


class DailyAttendanceResponse(BaseModel):
    date: date
    records: list[StudentAttendanceStatus]
    total: int
    present: int
    absent: int
    leave: int = 0


class MonthlyBreakdown(BaseModel):
    month: str
    year: int
    total_days: int
    present_days: int
    percentage: float


class StudentAnalysisResponse(BaseModel):
    student_id: int
    name: str
    father_name: str | None = None
    standard: int
    medium: str | None = None
    school_name: str | None = None
    total_session_days: int
    days_present: int
    days_absent: int
    days_leave: int = 0
    overall_percentage: float
    highest_month: str
    lowest_month: str
    monthly_breakdown: list[MonthlyBreakdown]


class DashboardTodayStats(BaseModel):
    date: date
    total: int
    present: int
    absent: int
    leave: int = 0
    percentage: float


class DashboardMonthlyTrend(BaseModel):
    month: str
    percentage: float


class DashboardAttendanceStats(BaseModel):
    today: DashboardTodayStats
    monthly_trend: list[DashboardMonthlyTrend]
    avg_attendance: float
    total_enrollment: int
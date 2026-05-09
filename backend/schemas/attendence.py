from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class AttendanceRecord(BaseModel):
    student_id: int
    status: str  # "present" or "absent"


class AttendanceBulkSave(BaseModel):
    date: date
    records: list[AttendanceRecord]


class StudentAttendanceStatus(BaseModel):
    student_id: int
    name: str
    father_name: str
    standard: int
    status: str


class DailyAttendanceResponse(BaseModel):
    date: date
    records: list[StudentAttendanceStatus]
    total: int
    present: int
    absent: int


class MonthlyBreakdownItem(BaseModel):
    month: str
    year: int
    total_days: int
    present_days: int
    percentage: float


class StudentAnalysisResponse(BaseModel):
    student_id: int
    name: str
    father_name: str
    standard: int
    medium: str
    school_name: str
    total_session_days: int
    days_present: int
    days_absent: int
    overall_percentage: float
    highest_month: str
    lowest_month: str
    monthly_breakdown: list[MonthlyBreakdownItem]


class AttendanceSummary(BaseModel):
    date: date
    total: int
    present: int
    absent: int
    percentage: float


class DashboardAttendanceStats(BaseModel):
    today: AttendanceSummary
    monthly_trend: list[dict]
    avg_attendance: float
    total_enrollment: int
from datetime import datetime, date, time
from typing import Optional

from pydantic import BaseModel

from app.models.schedule import DayOfWeek


class ScheduleBase(BaseModel):
    """Base schedule schema."""

    class_id: int
    subject_id: int
    teacher_id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room: Optional[str] = None
    effective_from: date
    effective_to: Optional[date] = None


class ScheduleCreate(ScheduleBase):
    """Schema for creating a schedule entry."""

    pass


class ScheduleUpdate(BaseModel):
    """Schema for updating a schedule entry."""

    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    day_of_week: Optional[DayOfWeek] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None


class ScheduleRead(ScheduleBase):
    """Schema for reading a schedule entry."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScheduleWithDetails(ScheduleRead):
    """Schedule with related entity names."""

    class_name: Optional[str] = None
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None

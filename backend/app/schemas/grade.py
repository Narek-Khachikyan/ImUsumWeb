from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class GradeBase(BaseModel):
    """Base grade schema."""

    student_id: int
    subject_id: int
    grade_value: float
    max_value: float = 100
    grade_type: str  # "test", "assignment", "participation"
    reference_id: Optional[int] = None
    date: date
    comment: Optional[str] = None


class GradeCreate(GradeBase):
    """Schema for creating a grade."""

    pass


class GradeUpdate(BaseModel):
    """Schema for updating a grade."""

    grade_value: Optional[float] = None
    max_value: Optional[float] = None
    comment: Optional[str] = None


class GradeRead(GradeBase):
    """Schema for reading a grade."""

    id: int
    teacher_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GradeSummary(BaseModel):
    """Summary of student grades."""

    subject_id: int
    subject_name: str
    average: float
    total_grades: int
    highest: float
    lowest: float

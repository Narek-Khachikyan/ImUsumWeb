from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.assignment import AssignmentType


class AssignmentBase(BaseModel):
    """Base assignment schema."""

    title: str
    description: Optional[str] = None
    assignment_type: AssignmentType = AssignmentType.INDIVIDUAL
    subject_id: int
    class_id: int
    due_date: datetime
    max_points: int = 100
    is_published: bool = False


class AssignmentCreate(AssignmentBase):
    """Schema for creating an assignment."""

    pass


class AssignmentUpdate(BaseModel):
    """Schema for updating an assignment."""

    title: Optional[str] = None
    description: Optional[str] = None
    assignment_type: Optional[AssignmentType] = None
    due_date: Optional[datetime] = None
    max_points: Optional[int] = None
    is_published: Optional[bool] = None


class AssignmentRead(AssignmentBase):
    """Schema for reading an assignment."""

    id: int
    teacher_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    """Schema for creating a submission."""

    content: Optional[str] = None
    file_url: Optional[str] = None


class SubmissionRead(BaseModel):
    """Schema for reading a submission."""

    id: int
    assignment_id: int
    student_id: int
    content: Optional[str] = None
    file_url: Optional[str] = None
    submitted_at: Optional[datetime] = None
    points_earned: Optional[int] = None
    feedback: Optional[str] = None
    is_graded: bool

    class Config:
        from_attributes = True


class SubmissionGrade(BaseModel):
    """Schema for grading a submission."""

    points_earned: int
    feedback: Optional[str] = None

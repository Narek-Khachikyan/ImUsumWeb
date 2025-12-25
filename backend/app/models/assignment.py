from enum import Enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class AssignmentType(str, Enum):
    """Assignment type enumeration."""

    INDIVIDUAL = "individual"
    GROUP = "group"


class Assignment(Base, TimestampMixin):
    """Assignment/Homework model."""

    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assignment_type = Column(
        SQLEnum(AssignmentType), default=AssignmentType.INDIVIDUAL
    )
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    max_points = Column(Integer, default=100)
    is_published = Column(Boolean, default=False)

    # Relationships
    subject = relationship("Subject", back_populates="assignments")
    teacher = relationship("TeacherProfile", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")


class AssignmentSubmission(Base, TimestampMixin):
    """Student submission for an assignment."""

    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    content = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    points_earned = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    is_graded = Column(Boolean, default=False)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("StudentProfile", back_populates="assignment_submissions")

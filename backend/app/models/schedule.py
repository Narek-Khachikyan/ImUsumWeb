from enum import Enum

from sqlalchemy import Column, Integer, String, Time, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class DayOfWeek(str, Enum):
    """Days of the week enumeration."""

    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class Schedule(Base, TimestampMixin):
    """Schedule model for class timetables."""

    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=False)
    day_of_week = Column(SQLEnum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(50), nullable=True)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)

    # Relationships
    class_ = relationship("Class", back_populates="schedules")
    subject = relationship("Subject", back_populates="schedules")
    teacher = relationship("TeacherProfile", back_populates="schedules")

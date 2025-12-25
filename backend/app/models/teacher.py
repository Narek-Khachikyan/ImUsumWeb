from sqlalchemy import Column, Integer, String, ForeignKey, Table, Text
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


# Many-to-many relationship between teachers and subjects
teacher_subjects = Table(
    "teacher_subjects",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("teacher_profiles.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
)


class TeacherProfile(Base, TimestampMixin):
    """Teacher-specific profile data."""

    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=True)
    department = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User", back_populates="teacher_profile")
    subjects = relationship(
        "Subject", secondary=teacher_subjects, back_populates="teachers"
    )
    assignments = relationship("Assignment", back_populates="teacher")
    schedules = relationship("Schedule", back_populates="teacher")


class Subject(Base, TimestampMixin):
    """Subject/Course model."""

    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    teachers = relationship(
        "TeacherProfile", secondary=teacher_subjects, back_populates="subjects"
    )
    schedules = relationship("Schedule", back_populates="subject")
    assignments = relationship("Assignment", back_populates="subject")
    grades = relationship("Grade", back_populates="subject")

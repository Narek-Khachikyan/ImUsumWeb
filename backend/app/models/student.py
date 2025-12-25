from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class StudentProfile(Base, TimestampMixin):
    """Student-specific profile data."""

    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    student_id_number = Column(String(50), unique=True, nullable=True)
    gpa = Column(Float, nullable=True)
    bonus_points = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    class_ = relationship("Class", back_populates="students")
    grades = relationship("Grade", back_populates="student")
    assignment_submissions = relationship(
        "AssignmentSubmission", back_populates="student"
    )

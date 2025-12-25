from sqlalchemy import Column, Integer, Float, String, ForeignKey, Date
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class Grade(Base, TimestampMixin):
    """Grade model for tracking student performance."""

    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=False)
    grade_value = Column(Float, nullable=False)
    max_value = Column(Float, default=100)
    grade_type = Column(String(50), nullable=False)  # "test", "assignment", "participation"
    reference_id = Column(Integer, nullable=True)  # ID of test or assignment
    date = Column(Date, nullable=False)
    comment = Column(String(500), nullable=True)

    # Relationships
    student = relationship("StudentProfile", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")

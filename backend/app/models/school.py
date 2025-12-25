from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class School(Base, TimestampMixin):
    """School model."""

    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String(20), nullable=True)

    # Relationships
    users = relationship("User", back_populates="school")
    classes = relationship("Class", back_populates="school")


class Class(Base, TimestampMixin):
    """Class/Grade model (e.g., 10A, 11B)."""

    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    grade_level = Column(Integer, nullable=False)
    school_id = Column(Integer, nullable=False)

    # Relationships
    school = relationship("School", back_populates="classes")
    students = relationship("StudentProfile", back_populates="class_")
    schedules = relationship("Schedule", back_populates="class_")

from enum import Enum

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class UserRole(str, Enum):
    """User role enumeration."""

    STUDENT = "student"
    TEACHER = "teacher"
    DIRECTOR = "director"
    ADMIN = "admin"


class User(Base, TimestampMixin):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)

    # Foreign keys
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)

    # Relationships
    school = relationship("School", back_populates="users")
    student_profile = relationship(
        "StudentProfile", back_populates="user", uselist=False
    )
    teacher_profile = relationship(
        "TeacherProfile", back_populates="user", uselist=False
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

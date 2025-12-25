from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str
    role: UserRole = UserRole.STUDENT
    school_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    school_id: Optional[int] = None


class UserRead(UserBase):
    """Schema for reading user data."""

    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    school_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithToken(BaseModel):
    """User with authentication tokens."""

    user: UserRead
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

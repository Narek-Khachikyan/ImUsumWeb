from datetime import date
from typing import Optional

from pydantic import BaseModel


class BlogPostBase(BaseModel):
    """Base blog post schema - matches frontend BlogPost interface."""

    title: str
    image: Optional[str] = None
    letter: str  # Matches frontend 'letter' field (content)
    date: date
    hot: bool = False


class BlogPostCreate(BlogPostBase):
    """Schema for creating a blog post."""

    pass


class BlogPostUpdate(BaseModel):
    """Schema for updating a blog post."""

    title: Optional[str] = None
    image: Optional[str] = None
    letter: Optional[str] = None
    date: Optional[date] = None
    hot: Optional[bool] = None


class BlogPostRead(BlogPostBase):
    """Schema for reading a blog post - matches frontend BlogPost interface."""

    id: int

    class Config:
        from_attributes = True

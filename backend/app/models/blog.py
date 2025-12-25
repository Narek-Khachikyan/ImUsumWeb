from sqlalchemy import Column, Integer, String, Text, Boolean, Date

from .base import Base, TimestampMixin


class BlogPost(Base, TimestampMixin):
    """Blog post model - matches frontend BlogPost interface."""

    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    image = Column(String(500), nullable=True)
    letter = Column(Text, nullable=False)  # Matches frontend 'letter' field
    date = Column(Date, nullable=False)
    hot = Column(Boolean, default=False)  # Featured/trending flag

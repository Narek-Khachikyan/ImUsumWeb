from sqlalchemy import Column, Integer, String, Text

from .base import Base, TimestampMixin


class Partner(Base, TimestampMixin):
    """Partner/Sponsor model - matches frontend Partner interface."""

    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    image = Column(String(500), nullable=True)  # Matches frontend Partner.image
    website = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)

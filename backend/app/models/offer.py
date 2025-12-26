"""Offer model for the marketplace."""

from enum import Enum

from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class OfferCategory(str, Enum):
    """Offer category enumeration."""

    FOOD = "food"
    CLOTHING = "clothing"
    ENTERTAINMENT = "entertainment"
    EDUCATION = "education"
    OTHER = "other"


class Offer(Base, TimestampMixin):
    """Marketplace offer model."""

    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)  # Cost in bonus points
    image_url = Column(String(500), nullable=True)
    brand_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, default=OfferCategory.OTHER.value)
    stock_quantity = Column(Integer, nullable=True)  # NULL = unlimited
    is_active = Column(Boolean, default=True)

    # Relationships
    purchases = relationship("Purchase", back_populates="offer")

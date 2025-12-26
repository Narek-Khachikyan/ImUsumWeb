"""Purchase model for tracking student transactions."""

from enum import Enum

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class PurchaseStatus(str, Enum):
    """Purchase status enumeration."""

    PENDING = "pending"
    REDEEMED = "redeemed"
    EXPIRED = "expired"


class Purchase(Base, TimestampMixin):
    """Student purchase/transaction model."""

    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer, ForeignKey("student_profiles.id"), nullable=False, index=True
    )
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=False, index=True)
    points_spent = Column(Integer, nullable=False)
    qr_code = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(String(20), nullable=False, default=PurchaseStatus.PENDING.value)
    redeemed_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("StudentProfile", back_populates="purchases")
    offer = relationship("Offer", back_populates="purchases")

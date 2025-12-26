"""Pydantic schemas for Purchase model."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PurchaseCreate(BaseModel):
    """Schema for creating a purchase (internal use)."""

    offer_id: int


class PurchaseRead(BaseModel):
    """Schema for reading a purchase."""

    id: int
    offer_id: int
    points_spent: int
    qr_code: str
    status: str
    created_at: datetime
    redeemed_at: Optional[datetime]

    # Nested offer info for display
    offer_name: str
    offer_brand: str
    offer_image_url: Optional[str]

    class Config:
        from_attributes = True


class PurchaseRedeemResponse(BaseModel):
    """Response after redeeming a purchase."""

    success: bool
    message: str


class StudentBalanceRead(BaseModel):
    """Schema for reading student balance."""

    bonus_points: int

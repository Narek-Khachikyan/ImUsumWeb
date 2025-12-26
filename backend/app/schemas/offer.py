"""Pydantic schemas for Offer model."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OfferBase(BaseModel):
    """Base offer schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: int = Field(..., gt=0, description="Cost in bonus points")
    image_url: Optional[str] = Field(None, max_length=500)
    brand_name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="other", max_length=50)
    stock_quantity: Optional[int] = Field(None, ge=0)


class OfferCreate(OfferBase):
    """Schema for creating an offer."""

    pass


class OfferUpdate(BaseModel):
    """Schema for updating an offer."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[int] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    brand_name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=50)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class OfferRead(OfferBase):
    """Schema for reading an offer."""

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OfferListRead(BaseModel):
    """Schema for listing offers with availability status."""

    id: int
    name: str
    description: Optional[str]
    price: int
    image_url: Optional[str]
    brand_name: str
    category: str
    stock_quantity: Optional[int]
    is_available: bool  # Computed: is_active AND (stock > 0 OR stock is NULL)

    class Config:
        from_attributes = True

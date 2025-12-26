"""API endpoints for offers marketplace."""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_director
from app.models.user import User, UserRole
from app.models.offer import Offer
from app.models.purchase import Purchase, PurchaseStatus
from app.models.student import StudentProfile
from app.schemas.offer import OfferCreate, OfferRead, OfferUpdate, OfferListRead
from app.schemas.purchase import PurchaseRead, StudentBalanceRead

router = APIRouter()


@router.get("", response_model=List[OfferListRead])
async def get_offers(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all active offers."""
    query = db.query(Offer).filter(Offer.is_active == True)  # noqa: E712

    if category:
        query = query.filter(Offer.category == category)

    offers = query.order_by(Offer.created_at.desc()).all()

    return [
        OfferListRead(
            id=o.id,
            name=o.name,
            description=o.description,
            price=o.price,
            image_url=o.image_url,
            brand_name=o.brand_name,
            category=o.category,
            stock_quantity=o.stock_quantity,
            is_available=o.is_active
            and (o.stock_quantity is None or o.stock_quantity > 0),
        )
        for o in offers
    ]


@router.get("/balance", response_model=StudentBalanceRead)
async def get_my_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current student's bonus points balance."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view balance",
        )

    student = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    return StudentBalanceRead(bonus_points=student.bonus_points or 0)


@router.get("/{offer_id}", response_model=OfferRead)
async def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get offer details."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )
    return offer


@router.post("", response_model=OfferRead, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
):
    """Create a new offer (Director/Admin only)."""
    offer = Offer(**offer_in.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.put("/{offer_id}", response_model=OfferRead)
async def update_offer(
    offer_id: int,
    offer_in: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
):
    """Update an offer (Director/Admin only)."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )

    update_data = offer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(offer, field, value)

    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
):
    """Soft delete an offer (Director/Admin only)."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )

    offer.is_active = False
    db.commit()
    return None


@router.post("/{offer_id}/purchase", response_model=PurchaseRead)
async def purchase_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Purchase an offer (Student only) - atomic transaction."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can make purchases",
        )

    # Get student profile with row lock for update
    student = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .with_for_update()
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    # Get offer with row lock
    offer = (
        db.query(Offer)
        .filter(Offer.id == offer_id, Offer.is_active == True)  # noqa: E712
        .with_for_update()
        .first()
    )

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found or inactive",
        )

    # Check stock
    if offer.stock_quantity is not None and offer.stock_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offer out of stock",
        )

    # Check balance
    current_balance = student.bonus_points or 0
    if current_balance < offer.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Need {offer.price}, have {current_balance}",
        )

    # Generate unique QR code
    qr_code = f"IMUSUM-{uuid.uuid4().hex[:12].upper()}"

    # Atomic transaction
    try:
        # Deduct points
        student.bonus_points = current_balance - offer.price

        # Reduce stock if applicable
        if offer.stock_quantity is not None:
            offer.stock_quantity -= 1

        # Create purchase record
        purchase = Purchase(
            student_id=student.id,
            offer_id=offer.id,
            points_spent=offer.price,
            qr_code=qr_code,
            status=PurchaseStatus.PENDING.value,
        )
        db.add(purchase)
        db.commit()
        db.refresh(purchase)

        return PurchaseRead(
            id=purchase.id,
            offer_id=purchase.offer_id,
            points_spent=purchase.points_spent,
            qr_code=purchase.qr_code,
            status=purchase.status,
            created_at=purchase.created_at,
            redeemed_at=purchase.redeemed_at,
            offer_name=offer.name,
            offer_brand=offer.brand_name,
            offer_image_url=offer.image_url,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Purchase failed. Please try again.",
        )

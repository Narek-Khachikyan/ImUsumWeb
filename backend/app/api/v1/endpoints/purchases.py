"""API endpoints for purchases (student transaction history)."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.purchase import Purchase, PurchaseStatus
from app.models.offer import Offer
from app.models.student import StudentProfile
from app.schemas.purchase import PurchaseRead, PurchaseRedeemResponse

router = APIRouter()


@router.get("", response_model=List[PurchaseRead])
async def get_my_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current student's purchase history."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view purchases",
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

    purchases = (
        db.query(Purchase, Offer)
        .join(Offer, Purchase.offer_id == Offer.id)
        .filter(Purchase.student_id == student.id)
        .order_by(Purchase.created_at.desc())
        .all()
    )

    return [
        PurchaseRead(
            id=p.Purchase.id,
            offer_id=p.Purchase.offer_id,
            points_spent=p.Purchase.points_spent,
            qr_code=p.Purchase.qr_code,
            status=p.Purchase.status,
            created_at=p.Purchase.created_at,
            redeemed_at=p.Purchase.redeemed_at,
            offer_name=p.Offer.name,
            offer_brand=p.Offer.brand_name,
            offer_image_url=p.Offer.image_url,
        )
        for p in purchases
    ]


@router.get("/{purchase_id}", response_model=PurchaseRead)
async def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific purchase with QR code."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view purchases",
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

    result = (
        db.query(Purchase, Offer)
        .join(Offer, Purchase.offer_id == Offer.id)
        .filter(Purchase.id == purchase_id, Purchase.student_id == student.id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found",
        )

    return PurchaseRead(
        id=result.Purchase.id,
        offer_id=result.Purchase.offer_id,
        points_spent=result.Purchase.points_spent,
        qr_code=result.Purchase.qr_code,
        status=result.Purchase.status,
        created_at=result.Purchase.created_at,
        redeemed_at=result.Purchase.redeemed_at,
        offer_name=result.Offer.name,
        offer_brand=result.Offer.brand_name,
        offer_image_url=result.Offer.image_url,
    )


@router.post("/{purchase_id}/redeem", response_model=PurchaseRedeemResponse)
async def redeem_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a purchase as redeemed (for partner integration)."""
    # Future: This would be called by partner API with authentication
    # For now, allow students to mark their own purchases as redeemed
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()

    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found",
        )

    if purchase.status == PurchaseStatus.REDEEMED.value:
        return PurchaseRedeemResponse(success=False, message="Already redeemed")

    if purchase.status == PurchaseStatus.EXPIRED.value:
        return PurchaseRedeemResponse(success=False, message="Purchase expired")

    purchase.status = PurchaseStatus.REDEEMED.value
    purchase.redeemed_at = datetime.utcnow()
    db.commit()

    return PurchaseRedeemResponse(success=True, message="Successfully redeemed")

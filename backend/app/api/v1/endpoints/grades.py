from typing import List
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user, get_current_teacher
from app.models.user import User, UserRole
from app.models.grade import Grade
from app.models.student import StudentProfile
from app.models.teacher import TeacherProfile, Subject
from app.schemas.grade import GradeCreate, GradeRead, GradeUpdate, GradeSummary

router = APIRouter()


@router.get("", response_model=List[GradeRead])
async def get_grades(
    student_id: int = None,
    subject_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get grades with optional filters."""
    query = db.query(Grade)

    if student_id:
        query = query.filter(Grade.student_id == student_id)
    if subject_id:
        query = query.filter(Grade.subject_id == subject_id)

    grades = query.order_by(Grade.date.desc()).all()
    return grades


@router.get("/my", response_model=List[GradeRead])
async def get_my_grades(
    subject_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current student's grades."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their grades",
        )

    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile not found",
        )

    query = db.query(Grade).filter(Grade.student_id == student_profile.id)

    if subject_id:
        query = query.filter(Grade.subject_id == subject_id)

    grades = query.order_by(Grade.date.desc()).all()
    return grades


@router.get("/summary", response_model=List[GradeSummary])
async def get_grade_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get grade summary by subject for current student."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view grade summary",
        )

    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile not found",
        )

    # Get summary by subject
    summaries = (
        db.query(
            Grade.subject_id,
            Subject.name.label("subject_name"),
            func.avg(Grade.grade_value).label("average"),
            func.count(Grade.id).label("total_grades"),
            func.max(Grade.grade_value).label("highest"),
            func.min(Grade.grade_value).label("lowest"),
        )
        .join(Subject, Grade.subject_id == Subject.id)
        .filter(Grade.student_id == student_profile.id)
        .group_by(Grade.subject_id, Subject.name)
        .all()
    )

    return [
        GradeSummary(
            subject_id=s.subject_id,
            subject_name=s.subject_name,
            average=round(s.average, 2),
            total_grades=s.total_grades,
            highest=s.highest,
            lowest=s.lowest,
        )
        for s in summaries
    ]


@router.post("", response_model=GradeRead, status_code=status.HTTP_201_CREATED)
async def create_grade(
    grade_in: GradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Create a new grade (Teacher only)."""
    teacher_profile = (
        db.query(TeacherProfile)
        .filter(TeacherProfile.user_id == current_user.id)
        .first()
    )
    if not teacher_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher profile not found",
        )

    grade = Grade(
        **grade_in.model_dump(),
        teacher_id=teacher_profile.id,
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.put("/{grade_id}", response_model=GradeRead)
async def update_grade(
    grade_id: int,
    grade_in: GradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Update a grade (Teacher only)."""
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found",
        )

    update_data = grade_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(grade, field, value)

    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Delete a grade (Teacher only)."""
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found",
        )

    db.delete(grade)
    db.commit()
    return None

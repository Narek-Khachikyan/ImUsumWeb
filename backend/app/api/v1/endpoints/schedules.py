from typing import List
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_director
from app.models.user import User, UserRole
from app.models.schedule import Schedule, DayOfWeek
from app.models.student import StudentProfile
from app.models.teacher import TeacherProfile
from app.schemas.schedule import ScheduleCreate, ScheduleRead, ScheduleUpdate

router = APIRouter()


@router.get("", response_model=List[ScheduleRead])
async def get_schedules(
    class_id: int = None,
    teacher_id: int = None,
    day_of_week: DayOfWeek = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all schedules with optional filters."""
    query = db.query(Schedule)

    if class_id:
        query = query.filter(Schedule.class_id == class_id)
    if teacher_id:
        query = query.filter(Schedule.teacher_id == teacher_id)
    if day_of_week:
        query = query.filter(Schedule.day_of_week == day_of_week)

    # Filter by active schedules
    today = date.today()
    query = query.filter(Schedule.effective_from <= today)
    query = query.filter(
        (Schedule.effective_to.is_(None)) | (Schedule.effective_to >= today)
    )

    schedules = query.order_by(Schedule.day_of_week, Schedule.start_time).all()
    return schedules


@router.get("/my", response_model=List[ScheduleRead])
async def get_my_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's schedule (student's class or teacher's classes)."""
    today = date.today()
    query = db.query(Schedule)

    if current_user.role == UserRole.STUDENT:
        # Get student's class schedule
        student_profile = (
            db.query(StudentProfile)
            .filter(StudentProfile.user_id == current_user.id)
            .first()
        )
        if not student_profile or not student_profile.class_id:
            return []
        query = query.filter(Schedule.class_id == student_profile.class_id)

    elif current_user.role == UserRole.TEACHER:
        # Get teacher's schedule
        teacher_profile = (
            db.query(TeacherProfile)
            .filter(TeacherProfile.user_id == current_user.id)
            .first()
        )
        if not teacher_profile:
            return []
        query = query.filter(Schedule.teacher_id == teacher_profile.id)

    else:
        # Directors/admins see all
        pass

    # Filter by active schedules
    query = query.filter(Schedule.effective_from <= today)
    query = query.filter(
        (Schedule.effective_to.is_(None)) | (Schedule.effective_to >= today)
    )

    schedules = query.order_by(Schedule.day_of_week, Schedule.start_time).all()
    return schedules


@router.post("", response_model=ScheduleRead, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
):
    """Create a new schedule entry (Director only)."""
    # Check for conflicts
    existing = (
        db.query(Schedule)
        .filter(
            Schedule.class_id == schedule_in.class_id,
            Schedule.day_of_week == schedule_in.day_of_week,
            Schedule.start_time == schedule_in.start_time,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Schedule conflict: class already has a lesson at this time",
        )

    schedule = Schedule(**schedule_in.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleRead)
async def update_schedule(
    schedule_id: int,
    schedule_in: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
):
    """Update a schedule entry (Director only)."""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    update_data = schedule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
):
    """Delete a schedule entry (Director only)."""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    db.delete(schedule)
    db.commit()
    return None

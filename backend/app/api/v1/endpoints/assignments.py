from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_teacher
from app.models.user import User, UserRole
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.student import StudentProfile
from app.models.teacher import TeacherProfile
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    SubmissionCreate,
    SubmissionRead,
    SubmissionGrade,
)

router = APIRouter()


@router.get("", response_model=List[AssignmentRead])
async def get_assignments(
    class_id: int = None,
    subject_id: int = None,
    is_published: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all assignments with optional filters."""
    query = db.query(Assignment)

    if class_id:
        query = query.filter(Assignment.class_id == class_id)
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)
    if is_published is not None:
        query = query.filter(Assignment.is_published == is_published)

    # Students only see published assignments
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Assignment.is_published == True)

    assignments = query.order_by(Assignment.due_date.desc()).all()
    return assignments


@router.get("/my", response_model=List[AssignmentRead])
async def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's assignments."""
    query = db.query(Assignment)

    if current_user.role == UserRole.STUDENT:
        # Get student's class assignments
        student_profile = (
            db.query(StudentProfile)
            .filter(StudentProfile.user_id == current_user.id)
            .first()
        )
        if not student_profile or not student_profile.class_id:
            return []
        query = query.filter(
            Assignment.class_id == student_profile.class_id,
            Assignment.is_published == True,
        )

    elif current_user.role == UserRole.TEACHER:
        # Get teacher's created assignments
        teacher_profile = (
            db.query(TeacherProfile)
            .filter(TeacherProfile.user_id == current_user.id)
            .first()
        )
        if not teacher_profile:
            return []
        query = query.filter(Assignment.teacher_id == teacher_profile.id)

    assignments = query.order_by(Assignment.due_date.desc()).all()
    return assignments


@router.get("/{assignment_id}", response_model=AssignmentRead)
async def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get assignment by ID."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


@router.post("", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Create a new assignment (Teacher only)."""
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

    assignment = Assignment(
        **assignment_in.model_dump(),
        teacher_id=teacher_profile.id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.put("/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(
    assignment_id: int,
    assignment_in: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Update an assignment (Teacher only - owner)."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    # Check ownership
    teacher_profile = (
        db.query(TeacherProfile)
        .filter(TeacherProfile.user_id == current_user.id)
        .first()
    )
    if (
        teacher_profile
        and assignment.teacher_id != teacher_profile.id
        and current_user.role not in [UserRole.DIRECTOR, UserRole.ADMIN]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this assignment",
        )

    update_data = assignment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)

    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Delete an assignment (Teacher only - owner)."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    db.delete(assignment)
    db.commit()
    return None


@router.post("/{assignment_id}/submit", response_model=SubmissionRead)
async def submit_assignment(
    assignment_id: int,
    submission_in: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an assignment (Student only)."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments",
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

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    # Check if already submitted
    existing = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student_profile.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already submitted this assignment",
        )

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=student_profile.id,
        content=submission_in.content,
        file_url=submission_in.file_url,
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/{assignment_id}/submissions", response_model=List[SubmissionRead])
async def get_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Get all submissions for an assignment (Teacher only)."""
    submissions = (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .all()
    )
    return submissions


@router.put("/{assignment_id}/submissions/{submission_id}", response_model=SubmissionRead)
async def grade_submission(
    assignment_id: int,
    submission_id: int,
    grade_in: SubmissionGrade,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Grade a submission (Teacher only)."""
    submission = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.id == submission_id,
            AssignmentSubmission.assignment_id == assignment_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    submission.points_earned = grade_in.points_earned
    submission.feedback = grade_in.feedback
    submission.is_graded = True

    db.commit()
    db.refresh(submission)
    return submission

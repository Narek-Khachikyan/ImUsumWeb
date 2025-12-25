from typing import List

from fastapi import HTTPException, status

from app.models.user import UserRole


class Permission:
    """Permission class for role-based access control."""

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action",
            )
        return current_user


# Permission presets
IsAuthenticated = Permission(
    [UserRole.STUDENT, UserRole.TEACHER, UserRole.DIRECTOR, UserRole.ADMIN]
)
IsTeacher = Permission([UserRole.TEACHER, UserRole.DIRECTOR, UserRole.ADMIN])
IsDirector = Permission([UserRole.DIRECTOR, UserRole.ADMIN])
IsAdmin = Permission([UserRole.ADMIN])

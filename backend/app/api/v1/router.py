from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, blogs, schedules, assignments, grades, offers, purchases

api_router = APIRouter()

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# User management endpoints
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Blog endpoints (matches frontend blogService)
api_router.include_router(blogs.router, prefix="/blogs", tags=["Blogs"])

# Schedule endpoints
api_router.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])

# Assignment endpoints
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])

# Grade endpoints
api_router.include_router(grades.router, prefix="/grades", tags=["Grades"])

# Offers marketplace endpoints
api_router.include_router(offers.router, prefix="/offers", tags=["Offers"])

# Purchase history endpoints
api_router.include_router(purchases.router, prefix="/purchases", tags=["Purchases"])

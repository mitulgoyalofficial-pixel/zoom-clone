# =============================================================================
# File: app/routers/current_user_router.py
# Purpose: Endpoint for "who is logged in". There is no login in this app,
#          so this always returns the default user (id 1).
# Contains: get_current_user() -> GET /api/me
# =============================================================================

from fastapi import APIRouter, Depends

from app.api_schemas import UserResponse
from app.database_models import User
from app.routers.current_user_dependency import load_default_user

router = APIRouter(prefix="/api", tags=["user"])


# Purpose: Return the logged-in user for the navbar profile.
# Input:   none (GET /api/me)
# Output:  UserResponse; 404 (from the dependency) if the user is missing
@router.get("/me", response_model=UserResponse)
def get_current_user(user: User = Depends(load_default_user)):
    return user

# =============================================================================
# File: app/routers/current_user_dependency.py
# Purpose: One reusable answer to "who is the logged-in user?" for endpoints.
#          There is no login, so it is always the default user (id 1). If real
#          authentication were added, only this file would change.
# Contains: load_default_user() - a FastAPI dependency
# Usage in an endpoint:  host: User = Depends(load_default_user)
# =============================================================================

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.app_settings import DEFAULT_USER_ID
from app.database_connection import get_db_session
from app.database_models import User


# Purpose: Load the logged-in user from the database.
# Input:   db - session injected by FastAPI
# Output:  the User with DEFAULT_USER_ID; 404 if the database has no such user
def load_default_user(db: Session = Depends(get_db_session)) -> User:
    user = db.get(User, DEFAULT_USER_ID)
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Default user not found. Restart the server to re-seed the database.",
        )
    return user

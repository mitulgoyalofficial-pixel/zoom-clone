# =============================================================================
# File: app/main.py
# Purpose: Entry point of the backend. Creates the FastAPI app.
# Contains:
#   - .env loading (FRONTEND_URL, DATABASE_URL) and router registration
#   - prepare_database(): create tables and seed sample data (safe to run on several instances)
#   - lifespan(): runs prepare_database() when the server starts
#   - CORS setup so the Next.js frontend (other origin) can call the API
#   - health_check(): GET /api/health to confirm the server AND the database are reachable
# Run locally (from backend/):  uvicorn app.main:app --reload
# Deployed on Vercel: Vercel finds this file (app/main.py) and its `app` variable by itself.
# =============================================================================

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Must run before importing app.database_connection, which reads DATABASE_URL at import time.
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException  # noqa: E402  (imports must come after load_dotenv)
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.exc import SQLAlchemyError  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app import database_models  # noqa: E402,F401  (import registers the tables on Base.metadata)
from app.app_settings import FRONTEND_URL  # noqa: E402
from app.database_connection import Base, SessionLocal, engine, get_db_session  # noqa: E402
from app.routers import current_user_router, meetings_router, participants_router  # noqa: E402
from app.sample_data_seeder import seed_database_if_empty  # noqa: E402

logger = logging.getLogger("uvicorn.error")


# Purpose: Make sure the tables exist and hold the sample data.
# Input:   none
# Output:  none
# How it works: creates any missing tables, then seeds them if empty. On a serverless host several
#   instances can start at the same moment and both try to create or fill the tables; the loser of
#   that race gets a duplicate error. That is harmless (the winner finished the job), so it is
#   logged and ignored instead of crashing the instance.
def prepare_database() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_database_if_empty(db)
    except SQLAlchemyError:
        logger.exception("Database setup hit an error (another instance may have finished it first)")


# Purpose: Prepare the database once when the server starts.
# Input:   app - the FastAPI app (required by FastAPI, unused here)
# Output:  none; code before `yield` runs at startup, after it at shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    prepare_database()
    yield


app = FastAPI(title="Zoom Clone API", lifespan=lifespan)

# Frontend runs on another origin (Vercel / localhost:3000), so the browser
# needs CORS headers; only that one origin is allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(current_user_router.router)
app.include_router(meetings_router.router)
app.include_router(participants_router.router)


# Purpose: Let us (and the host) check the server and its database are working.
# Input:   none (GET /api/health)
# Output:  {"status": "ok", "database": "ok"}; 503 with a hint if the database cannot be reached
# How it works: runs the cheapest possible query ("SELECT 1"). When a deployment misbehaves,
#   this tells at once whether the problem is the app or the database connection (DATABASE_URL).
@app.get("/api/health")
def health_check(db: Session = Depends(get_db_session)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Health check could not reach the database")
        raise HTTPException(status_code=503, detail="The database cannot be reached. Check DATABASE_URL.")
    return {"status": "ok", "database": "ok"}

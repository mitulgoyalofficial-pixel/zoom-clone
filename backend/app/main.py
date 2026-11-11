# =============================================================================
# File: app/main.py
# Purpose: Entry point of the backend. Creates the FastAPI app.
# Contains:
#   - .env loading (FRONTEND_URL, DATABASE_URL) and router registration
#   - lifespan(): startup work - create tables and seed sample data
#   - CORS setup so the Next.js frontend (other origin) can call the API
#   - health_check(): GET /api/health to confirm the server is up
# Run locally (from backend/):  uvicorn app.main:app --reload
# =============================================================================

from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Must run before importing app.database_connection, which reads DATABASE_URL at import time.
load_dotenv()

from fastapi import FastAPI  # noqa: E402  (imports must come after load_dotenv)
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app import database_models  # noqa: E402,F401  (import registers the tables on Base.metadata)
from app.app_settings import FRONTEND_URL  # noqa: E402
from app.database_connection import Base, SessionLocal, engine  # noqa: E402
from app.routers import current_user_router, meetings_router  # noqa: E402
from app.sample_data_seeder import seed_database_if_empty  # noqa: E402


# Purpose: Prepare the database once when the server starts.
# Input:   app - the FastAPI app (required by FastAPI, unused here)
# Output:  none; code before `yield` runs at startup, after it at shutdown
# How it works: creates any missing tables, then seeds them if empty.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Hosting disk is ephemeral, so the DB may be brand new on every deploy.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database_if_empty(db)
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


# Purpose: Let us (and the host) check the server is running.
# Input:   none (GET /api/health)
# Output:  {"status": "ok"}
# How it works: returns a constant; no DB access.
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

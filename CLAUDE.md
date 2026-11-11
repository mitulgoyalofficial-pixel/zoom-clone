# Zoom Clone - Project Context

Assignment: build a web clone of the Zoom web app (Scaler SDE Fullstack assignment).
Deadline is 1 day, so prefer simple, working, well-structured code over extra features.
I must be able to explain every line in an interview: keep code readable, avoid clever abstractions,
and explain any non-obvious decision in a short comment.

## Stack (fixed by the brief)
- frontend/: Next.js (App Router, TypeScript, Tailwind), behaves as a single-page app.
  All data is fetched from the FastAPI backend in client components via NEXT_PUBLIC_API_URL.
- backend/: Python FastAPI + SQLAlchemy 2.x + Pydantic v2, SQLite database.
- No login: a default user (id=1) is always "logged in".

## Must-have features
1. Dashboard: Zoom-style navbar (profile/settings placeholders), New Meeting / Join / Schedule
   buttons, Upcoming meetings section, Recent meetings section.
2. Instant meeting: create meeting, unique 11-digit meeting ID (shown as "123 4567 8901"),
   shareable invite link, redirect to the meeting room.
3. Join meeting: by meeting ID or invite link, enter display name first, validate the meeting exists.
4. Schedule meeting: title, description, date and time picker, duration, auto-generated link,
   stored in DB, appears in Upcoming.

## Bonus (only after must-haves work and are deployed)
- Responsive layout. Host controls (mute all / remove participant). Skip auth.

## Meeting room scope
- Pre-join screen with local camera/mic preview (getUserMedia), name field, mic/camera toggles.
- Room: dark Zoom UI, bottom control bar (Mute, Stop Video, Participants, Share link, Leave),
  participant list from the DB (polled every few seconds). No real multi-party video.

## Database schema
- users(id, name, email unique, avatar_color, created_at)
- meetings(id, meeting_code unique+indexed, title, description, host_id FK users,
  meeting_type instant|scheduled, scheduled_start nullable, duration_minutes,
  passcode nullable, status scheduled|live|ended, created_at, started_at, ended_at)
- participants(id, meeting_id FK meetings, user_id FK users nullable for guests, display_name,
  role host|participant, is_muted, joined_at, left_at, removed_at)
- "Upcoming" and "Recent" are derived by query, not stored.
- Tables are created and seeded on startup if empty (hosting disk is ephemeral).

## Backend structure
backend/app/: main.py (app, CORS, startup), database.py, models.py, schemas.py,
routers/meetings.py, services/meeting_service.py, seed.py

## API
GET /api/me  GET /api/meetings/upcoming  GET /api/meetings/recent
POST /api/meetings/instant  POST /api/meetings/schedule  GET /api/meetings/{code}
POST /api/meetings/{code}/join  POST /api/meetings/{code}/leave
GET /api/meetings/{code}/participants  POST /api/meetings/{code}/mute-all
DELETE /api/meetings/{code}/participants/{id}

## UI rules
- Match Zoom closely: Zoom blue #0B5CFF, orange New Meeting tile, white dashboard,
  dark meeting room, rounded tiles, Inter-like sans font, lucide-react icons.
- Reusable components in frontend/components/ (Navbar, ActionTile, MeetingCard, Modal,
  ControlBarButton, ParticipantTile). API calls only in frontend/lib/api.ts.

## Working rules
- Work in small steps; after each step, tell me what changed and how to run/test it.
- Do not add dependencies without saying why.
- Never commit venv/, node_modules/, .env files or *.db.

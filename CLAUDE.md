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
   The Join input accepts either the ID (spaces allowed) or a full invite URL; parse the code out.
4. Schedule meeting: title, description, date and time picker, duration, auto-generated link,
   stored in DB, appears in Upcoming.

## Bonus (only after must-haves work and are deployed)
- Responsive layout. Host controls (mute all / remove participant). Skip auth.

## Meeting room scope
- Pre-join screen with local camera/mic preview (getUserMedia), name field, mic/camera toggles.
- Room: dark Zoom UI, bottom control bar (Mute, Stop Video, Participants, Share link, Leave),
  participant list from the DB (polled every few seconds).
- No real multi-party video (no WebRTC): out of scope for a 1-day deadline.
  Must be stated as an assumption in the README.

## Database schema
The brief says schema design is evaluated ("proper relationships"), so keep it deliberate.

- users(id, name, email unique, avatar_color, created_at)
- meetings(id, meeting_code unique+indexed, title, description nullable, host_id FK users indexed,
  meeting_type instant|scheduled, scheduled_start nullable, duration_minutes default 40,
  passcode nullable, status scheduled|live|ended, created_at, started_at nullable, ended_at nullable)
- participants(id, meeting_id FK meetings ON DELETE CASCADE, user_id FK users nullable for guests,
  display_name, role host|participant, is_muted, joined_at, left_at nullable, removed_at nullable)
  - composite index on (meeting_id, left_at): the polling query filters on both.

Constraints:
- CHECK duration_minutes > 0.
- CHECK meeting_type = 'instant' OR scheduled_start IS NOT NULL.
- Enums use SQLAlchemy Enum(native_enum=False): VARCHAR + CHECK on SQLite.

Decisions:
- meeting_code is an 11-char digit string, not an int (no maths on it, no lost leading zeros).
  Stored without spaces; the UI formats it. First digit non-zero; retry on collision.
- Invite link is NOT stored; built from the code: {FRONTEND_URL}/join/{code}?pwd={passcode}.
- Passcode (Zoom-style): 6 random alphanumeric chars, generated for every new meeting.
  NULL means "no passcode required" (schedule form has a Zoom-style "Passcode" checkbox, on by default).
  Joining by ID asks for the passcode; the invite link carries ?pwd= so link joiners skip that step.
  The join endpoint checks it and returns 403 on mismatch.
- All datetimes stored in UTC (SQLite has no timezone support); frontend displays local time.
- Status transitions: instant meeting is created `live` (started_at = now); a scheduled meeting
  becomes `live` on first join; a meeting becomes `ended` when the host leaves.
- Every join inserts a new participants row (no reuse on rejoin). Active participant =
  left_at IS NULL AND removed_at IS NULL. removed_at is separate from left_at so the removed
  person's next poll can show "You were removed by the host".
- Host vs guest without login: joining via New Meeting / Start (dashboard) = user 1, role host.
  Joining via the Join flow = guest (user_id NULL), role participant.
- Ghost participants (tab closed): send /leave with navigator.sendBeacon on `pagehide`.
  No heartbeat column.
- "Upcoming" and "Recent" are derived by query, not stored:
  - Upcoming: meeting_type = scheduled AND status != ended AND scheduled_start + duration > now,
    ordered by scheduled_start.
  - Recent: meetings hosted by user 1 with started_at NOT NULL, newest first.

Seeding:
- Tables are created and seeded on startup if empty (hosting disk is ephemeral).
- Seed dates are relative to now (e.g. "tomorrow 10:00", "2 days ago") so Upcoming never goes stale.
- Seed 4-5 users (default user + colleagues) and past meetings whose participants are those users,
  so the users -> participants relationship is visible in the demo.

## Backend structure
backend/app/: main.py (app, CORS, startup), database.py, models.py, schemas.py,
routers/meetings.py, services/meeting_service.py, seed.py
- Env: FRONTEND_URL (CORS origin + invite links), DATABASE_URL (default sqlite:///./zoom.db).
- requirements.txt must be UTF-8 (PowerShell `>` writes UTF-16, which breaks pip on Linux).

## API
GET /api/me  GET /api/meetings/upcoming  GET /api/meetings/recent
POST /api/meetings/instant  POST /api/meetings/schedule  GET /api/meetings/{code}
POST /api/meetings/{code}/join  (body: display_name, passcode, as_host)
POST /api/meetings/{code}/leave
GET /api/meetings/{code}/participants  POST /api/meetings/{code}/mute-all
PATCH /api/meetings/{code}/participants/{id}  (self mute/unmute: body is_muted)
DELETE /api/meetings/{code}/participants/{id}  (host removes participant)

## Deployment and submission (required by the brief)
- Public GitHub repo + deployed link. Frontend on Vercel, backend on Render.
- Deploy a hello-world of both early to shake out CORS/env issues.
- README: setup instructions, tech stack, assumptions (no auth, no real video, host/guest rule,
  passcode behaviour), plus an ER diagram and table descriptions (DB design is graded).

## UI rules
- Match Zoom closely: Zoom blue #0B5CFF, orange New Meeting tile, white dashboard,
  dark meeting room, rounded tiles, Inter-like sans font, lucide-react icons.
- Reusable components in frontend/components/ (Navbar, ActionTile, MeetingCard, Modal,
  ControlBarButton, ParticipantTile). API calls only in frontend/lib/api.ts.

## Commenting rules (apply to every file, backend and frontend)
- File header: a comment block at the top with File, Purpose, and what it Contains.
- Every function/class: comment block directly ABOVE it with Purpose, Input, Output,
  How it works (use # in Python, // or /* */ in TS; not docstrings).
- Function names must be self-explanatory (e.g. round_up_to_next_half_hour, not next_hh).
- Every key decision: a single-line comment on the line above it explaining why.

## Working rules
- Work in small steps; after each step, tell me what changed and how to run/test it.
- Do not add dependencies without saying why.
- Never commit venv/, node_modules/, .env files or *.db.

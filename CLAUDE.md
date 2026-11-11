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
backend/app/: main.py (app, CORS, startup), database_connection.py, database_models.py,
api_schemas.py (Pydantic request/response shapes), app_settings.py (FRONTEND_URL, DEFAULT_USER_ID),
routers/meetings_router.py, routers/participants_router.py, routers/current_user_router.py,
routers/current_user_dependency.py, routers/meeting_route_helpers.py (load_meeting_or_404,
error -> HTTP status table), services/meeting_service.py, services/participant_service.py, services/host_controls_service.py,
services/meeting_errors.py (MeetingRuleError family; services never raise HTTP errors),
sample_data_seeder.py. Tests in backend/tests/ (run: venv\Scripts\python -m pytest tests -v).
- Dev-only packages (pytest, httpx) live in requirements-dev.txt, not requirements.txt.
- Public GET /meetings/{code} never returns the passcode (has_passcode only); the host's own
  Upcoming/Recent lists include passcode + invite_link.
- API datetimes are serialized with a "Z" suffix so the browser reads them as UTC.
- Env: FRONTEND_URL (CORS origin + invite links), DATABASE_URL (default sqlite:///./zoom.db).
- requirements.txt must be UTF-8 (PowerShell `>` writes UTF-16, which breaks pip on Linux).

## API
GET /api/me  GET /api/meetings/upcoming  GET /api/meetings/recent
POST /api/meetings/instant  POST /api/meetings/schedule  GET /api/meetings/{code}
POST /api/meetings/{code}/join  (body: display_name, passcode, as_host)
POST /api/meetings/{code}/leave?participant_id=  (query param, not body: sendBeacon-friendly;
  host leaving ends the meeting)
GET /api/meetings/{code}/participants?participant_id=  (returns meeting_status, participants,
  was_removed for the asking participant)
POST /api/meetings/{code}/mute-all?host_participant_id=  (host only; mutes everyone but the host)
PATCH /api/meetings/{code}/participants/{id}  (self mute/unmute: body is_muted)
DELETE /api/meetings/{code}/participants/{id}?host_participant_id=  (host removes participant;
  sets removed_at; host cannot remove themselves)
- Host-only actions: the caller sends their own participant id as host_participant_id; the server
  checks that row is active in THIS meeting and has role host (403 if not, 404 if not inside).
  Known limit: no login, so anyone who knows the host's participant id could act as host.

## Deployment and submission (required by the brief)
- Public GitHub repo + deployed link. Frontend on Vercel, backend on Render.
- Deploy a hello-world of both early to shake out CORS/env issues.
- README: setup instructions, tech stack, assumptions (no auth, no real video, host/guest rule,
  passcode behaviour), plus an ER diagram and table descriptions (DB design is graded).

## UI rules
- Detailed visual analysis of each Zoom screen (tokens, layout, components) lives in
  docs/zoom-design-analysis.md. Read it before building any UI; screenshots are in design-ref/ (not committed).
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

## Naming and coding practices (from naming_conventions_and_coding_practices.pdf)
Naming:
- File names say what is inside (database_models.py, not models.py). Python files snake_case;
  React components PascalCase (MeetingCard.tsx); other TS files camelCase (apiClient.ts).
- Casing: Python snake_case / PascalCase classes / UPPER_SNAKE_CASE constants;
  TS camelCase / PascalCase types and components / UPPER_SNAKE_CASE constants.
- Variables are nouns; collections plural; booleans read as questions (is_muted, has_passcode,
  can_join); units in names (duration_minutes, timeout_ms); no magic numbers (named constants).
- Functions start with a verb and do one job. Prefixes: get_ = cheap, no I/O; fetch_/load_ = DB
  or network; calculate_ = real computation; to_ = conversion; is_/has_/can_ = returns bool.
  A name needing "and" means split the function.
- Avoid noise words (data, info, manager, handler, obj, temp) and abbreviations (except id, url).
- One word per concept everywhere: always "meeting" (not room/session), "participant"
  (not attendee/member), "fetch" for DB reads.
Practices:
- KISS and YAGNI: simplest thing that works; no abstractions for imagined needs.
- Guard clauses and early returns instead of deep nesting.
- Functions ~20-30 lines max, 3-4 parameters max, no boolean flag parameters where avoidable.
- DRY, but only extract after the pattern appears 3 times.
- Comments explain WHY (plus the Purpose/Input/Output blocks above); no commented-out code.
- Errors: validate at the API boundary, raise HTTPException with a clear message
  (what went wrong + what to do), catch specific exceptions only, never `except: pass`.
- Security: never trust input (Pydantic validation), SQLAlchemy parameterised queries only
  (never f-string SQL), secrets via env vars.
- Performance: no queries inside loops (N+1); use joins / selectinload when listing.
- Tests: pytest, descriptive names (test_join_fails_when_passcode_is_wrong),
  Arrange-Act-Assert, in-memory SQLite so tests are fast and independent.
- Small focused commits with imperative messages.

## Working rules
- Work in small steps; after each step, tell me what changed and how to run/test it.
- Do not add dependencies without saying why.
- Never commit venv/, node_modules/, .env files or *.db.

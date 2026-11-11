# =============================================================================
# File: app/services/meeting_service.py
# Purpose: Business logic for meetings (the "rules" of the app).
#          Routers only handle HTTP and call these functions; this layer is
#          the only place that decides how meetings are created/joined/ended.
# Contains (so far):
#   - generate_meeting_code(): unique 11-digit meeting ID
#   - generate_passcode(): random 6-character passcode
# =============================================================================

import secrets
import string

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Meeting

# Letters + digits, like Zoom passcodes (e.g. "aB3xY9").
PASSCODE_ALPHABET = string.ascii_letters + string.digits


# Purpose: Create a meeting ID that no other meeting uses.
# Input:   db - open database session (to check for collisions)
# Output:  11-digit string, e.g. "84512367790"
# How it works: builds 1 random digit 1-9 + 10 random digits 0-9, then
#   checks the meetings table; if the code exists, tries again.
def generate_meeting_code(db: Session) -> str:
    while True:
        # First digit 1-9 so the code never starts with 0 and always shows 11 digits.
        first_digit = str(secrets.randbelow(9) + 1)
        other_digits = "".join(str(secrets.randbelow(10)) for _ in range(10))
        code = first_digit + other_digits

        # Collision is very unlikely (9 * 10^10 codes) but we check to guarantee uniqueness.
        existing_id = db.scalar(select(Meeting.id).where(Meeting.meeting_code == code))
        if existing_id is None:
            return code


# Purpose: Create a passcode for a new meeting.
# Input:   none
# Output:  6-character string of letters and digits, e.g. "aB3xY9"
# How it works: picks 6 random characters from PASSCODE_ALPHABET.
def generate_passcode() -> str:
    # `secrets` (not `random`) because a passcode must not be predictable.
    return "".join(secrets.choice(PASSCODE_ALPHABET) for _ in range(6))

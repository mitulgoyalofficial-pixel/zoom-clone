# =============================================================================
# File: app/app_settings.py
# Purpose: One place for configuration values that several files need, so
#          nobody reads environment variables or repeats constants ad hoc.
# Contains:
#   - FRONTEND_URL: where the Next.js app lives (CORS origin + invite links)
#   - DEFAULT_USER_ID: the always-"logged in" user (there is no login)
# Note: import this file only after load_dotenv() has run (main.py does it).
# =============================================================================

import os

# Env var so production (Vercel URL) differs from local development.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# The seeder creates this user first, so it always gets id 1.
DEFAULT_USER_ID = 1

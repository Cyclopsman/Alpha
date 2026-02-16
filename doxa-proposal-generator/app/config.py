import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# --- Server ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# --- Company branding ---
AGENCY_NAME = os.getenv("AGENCY_NAME", "DOXA")
AGENCY_TAGLINE = os.getenv(
    "AGENCY_TAGLINE",
    "AI-Powered Automation for African Enterprises",
)
AGENCY_WEBSITE = os.getenv("AGENCY_WEBSITE", "https://doxa.africa")
AGENCY_EMAIL = os.getenv("AGENCY_EMAIL", "hello@doxa.africa")

# --- Pricing defaults (USD) ---
DEFAULT_SETUP_FEE_MIN = int(os.getenv("DEFAULT_SETUP_FEE_MIN", "2000"))
DEFAULT_SETUP_FEE_MAX = int(os.getenv("DEFAULT_SETUP_FEE_MAX", "10000"))
DEFAULT_MONTHLY_MIN = int(os.getenv("DEFAULT_MONTHLY_MIN", "500"))
DEFAULT_MONTHLY_MAX = int(os.getenv("DEFAULT_MONTHLY_MAX", "3000"))

# --- Currency ---
CURRENCY = os.getenv("CURRENCY", "USD")

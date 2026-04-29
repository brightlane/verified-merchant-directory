import os
from dotenv import load_dotenv

# Load .env file automatically
load_dotenv()

class Config:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///app.db")

    # Affiliate / External APIs (add as needed)
    AFFILIATE_API_KEY = os.getenv("AFFILIATE_API_KEY", "")
    LINKCONNECTOR_API_KEY = os.getenv("LINKCONNECTOR_API_KEY", "")

    # App settings
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    ENV = os.getenv("ENV", "development")

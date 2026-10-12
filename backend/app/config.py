import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file (check backend/.env and cwd)
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Uptrix Digital Marketing Job Platform API")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    HOST: str = os.getenv("API_HOST") or os.getenv("SERVER_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("API_PORT") or os.getenv("SERVER_PORT", 8000))
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")

    # Database Connection parameters (host, port, database, user, password)
    DB_HOST: str = os.getenv("DB_HOST") or os.getenv("host", "db.vlzlpzevbfbpzorvkple.supabase.co")
    DB_PORT: int = int(os.getenv("DB_PORT") or os.getenv("port", 5432))
    DB_NAME: str = os.getenv("DB_NAME") or os.getenv("database", "postgres")
    DB_USER: str = os.getenv("DB_USER") or os.getenv("user", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD") or os.getenv("password", "Kyadaritarun")
    DB_SCHEMA: str = os.getenv("DB_SCHEMA", "hiring_portal")

    @property
    def DATABASE_URL(self) -> str:
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Security Settings loaded from .env
    SECRET_KEY: str = os.getenv("SECRET_KEY", "uptrix_digital_marketing_hiring_secret_key_2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

    # Superadmin Master Credentials loaded from .env
    SUPERADMIN_EMAIL: str = os.getenv("SUPERADMIN_EMAIL", "superadmin@intentpeople.com")
    SUPERADMIN_PASSWORD: str = os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@IntentPeople2026!")

    # SMTP Email Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "IntentPeople Hiring Platform")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() in ("true", "1", "yes")

    # AWS S3 Storage Settings
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "")
    AWS_S3_CUSTOM_DOMAIN: str = os.getenv("AWS_S3_CUSTOM_DOMAIN", "")

    # Google OAuth 2.0 & Google Meet API Settings
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Razorpay Payment Gateway Settings
    @property
    def RAZORPAY_KEY_ID(self) -> str:
        return os.getenv("RAZORPAY_KEY_ID") or "rzp_live_SWEEWJkuQSNLrI"

    @property
    def RAZORPAY_KEY_SECRET(self) -> str:
        return os.getenv("RAZORPAY_KEY_SECRET") or "IHHD7uSoGSkK2cSQ6gxLToCk"

settings = Settings()


from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

schema_name = getattr(settings, "DB_SCHEMA", "hiring_portal") or "hiring_portal"

connect_args = {
    "connect_timeout": 10,
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 3,
    "options": f"-c search_path={schema_name},public"
}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,        # Automatically recycle connections every 5 minutes
    pool_size=10,            # High-capacity pool
    max_overflow=20,         # Allow overflow for concurrent requests
    pool_timeout=30,         # Wait up to 30 seconds for a pooled connection
    connect_args=connect_args
)

def ensure_schema_exists():
    """Ensure the target PostgreSQL schema exists before creating tables."""
    try:
        with engine.connect() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
            conn.commit()
    except Exception as e:
        print(f"[SCHEMA INIT WARNING] Could not verify/create schema '{schema_name}': {e}")

def ensure_columns_exist():
    """Auto-migrate columns for new features if they don't exist yet."""
    try:
        with engine.connect() as conn:
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_applications ADD COLUMN IF NOT EXISTS fit_score DOUBLE PRECISION;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_applications ADD COLUMN IF NOT EXISTS fit_breakdown JSON;'))
            conn.commit()
    except Exception as e:
        pass

# Ensure schema exists on startup
ensure_schema_exists()
ensure_columns_exist()

metadata = MetaData(schema=schema_name)
Base = declarative_base(metadata=metadata)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

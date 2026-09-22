import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import GoogleOAuthToken
from sqlalchemy import text

def run_migration():
    print("Running migration: add Google Meet fields and OAuth tokens table...")
    
    # 1. Create any missing tables (like portal_google_oauth_tokens)
    Base.metadata.create_all(bind=engine)
    print("Created tables if missing.")

    # 2. Add columns to portal_interviews if not existing
    columns_to_add = [
        ("meeting_provider", "VARCHAR DEFAULT 'google_meet'"),
        ("meeting_url", "VARCHAR"),
        ("meeting_code", "VARCHAR"),
        ("google_space_name", "VARCHAR"),
        ("meeting_created_at", "TIMESTAMP"),
    ]

    with engine.connect() as conn:
        for col_name, col_type in columns_to_add:
            try:
                sql = f"ALTER TABLE portal_interviews ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                conn.execute(text(sql))
                conn.commit()
                print(f"Column '{col_name}' checked/added.")
            except Exception as e:
                print(f"Note on column '{col_name}': {e}")

    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()

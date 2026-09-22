"""
Database Initialization & Table Provisioning Script
Run this script whenever you connect to a new database server or update database models.

Usage:
    python init_db.py
"""
import sys
import os

from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from app.database import engine, Base
import app.models  # Registers all SQLAlchemy models
from sqlalchemy import inspect
from app.seed import seed

def initialize_database():
    masked_url = settings.DATABASE_URL
    if settings.DB_PASSWORD:
        masked_url = masked_url.replace(settings.DB_PASSWORD, "****")
    
    print(f"Connecting to database at:\n  {masked_url}\n")
    
    schema = getattr(settings, "DB_SCHEMA", "hiring_portal") or "hiring_portal"
    print(f"Targeting PostgreSQL Schema: '{schema}'\n")

    inspector = inspect(engine)
    before_tables = inspector.get_table_names(schema=schema)
    print(f"Tables currently in schema '{schema}' ({len(before_tables)}): {before_tables}")
    
    print(f"\nCreating all missing tables in schema '{schema}'...")
    Base.metadata.create_all(bind=engine)
    
    inspector = inspect(engine)
    after_tables = inspector.get_table_names(schema=schema)
    print(f"Tables now in schema '{schema}' ({len(after_tables)}): {after_tables}")

    
    print("\nSeeding initial data...")
    seed()
    
    print("\n[SUCCESS] Database setup complete! All tables and seed data are ready.")

if __name__ == "__main__":
    initialize_database()

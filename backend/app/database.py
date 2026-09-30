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
    """Auto-migrate columns and tables for new features if they don't exist yet."""
    try:
        with engine.connect() as conn:
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_applications ADD COLUMN IF NOT EXISTS fit_score DOUBLE PRECISION;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_applications ADD COLUMN IF NOT EXISTS fit_breakdown JSON;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_jobs ADD COLUMN IF NOT EXISTS screening_questions JSON DEFAULT \'[]\'::json;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_applications ADD COLUMN IF NOT EXISTS screening_answers JSON DEFAULT \'[]\'::json;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_candidates ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_candidates ADD COLUMN IF NOT EXISTS top_search_count INTEGER DEFAULT 0;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_jobs ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES "{schema_name}".portal_users(id);'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_jobs ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES "{schema_name}".portal_staff_groups(id) ON DELETE SET NULL;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_jobs ADD COLUMN IF NOT EXISTS interview_rounds JSON DEFAULT \'[]\'::json;'))
            conn.execute(text(f'CREATE INDEX IF NOT EXISTS idx_portal_jobs_group_id ON "{schema_name}".portal_jobs(group_id);'))
            conn.execute(text(f'CREATE INDEX IF NOT EXISTS idx_portal_jobs_created_by ON "{schema_name}".portal_jobs(created_by);'))
            
            # Create portal_staff_groups table
            conn.execute(text(f'''
                CREATE TABLE IF NOT EXISTS "{schema_name}".portal_staff_groups (
                    id SERIAL PRIMARY KEY,
                    company_id INTEGER NOT NULL REFERENCES "{schema_name}".portal_companies(id) ON DELETE CASCADE,
                    name VARCHAR NOT NULL,
                    description TEXT,
                    department VARCHAR DEFAULT 'General',
                    created_by INTEGER REFERENCES "{schema_name}".portal_users(id),
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
                );
            '''))

            # Create portal_staff_group_members join table
            conn.execute(text(f'''
                CREATE TABLE IF NOT EXISTS "{schema_name}".portal_staff_group_members (
                    id SERIAL PRIMARY KEY,
                    group_id INTEGER NOT NULL REFERENCES "{schema_name}".portal_staff_groups(id) ON DELETE CASCADE,
                    member_id INTEGER NOT NULL REFERENCES "{schema_name}".portal_company_members(id) ON DELETE CASCADE,
                    assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                    CONSTRAINT unique_staff_group_member UNIQUE (group_id, member_id)
                );
            '''))
            # Plan and subscription columns for portal_companies
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS plan_type VARCHAR DEFAULT \'FREE\';'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS plan_status VARCHAR DEFAULT \'ACTIVE\';'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMP WITHOUT TIME ZONE;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITHOUT TIME ZONE;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS max_roles INTEGER DEFAULT 1;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS max_jobs INTEGER DEFAULT 1;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS max_candidates_per_job INTEGER DEFAULT 15;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS sidebar_access JSON DEFAULT \'{{}}\'::json;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS organisation_type VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS primary_industry VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS sub_industry VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS company_size VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS headquarters_location VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS other_locations TEXT;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS contact_person VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS year_founded VARCHAR;'))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_candidates ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR;'))

            # Create portal_payment_transactions table
            conn.execute(text(f'''
                CREATE TABLE IF NOT EXISTS "{schema_name}".portal_payment_transactions (
                    id SERIAL PRIMARY KEY,
                    company_id INTEGER NOT NULL REFERENCES "{schema_name}".portal_companies(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES "{schema_name}".portal_users(id) ON DELETE CASCADE,
                    plan_id VARCHAR NOT NULL,
                    amount INTEGER NOT NULL,
                    currency VARCHAR DEFAULT 'INR',
                    razorpay_order_id VARCHAR,
                    razorpay_payment_id VARCHAR,
                    razorpay_signature VARCHAR,
                    status VARCHAR DEFAULT 'SUCCESS',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
                );
            '''))

            # Create portal_plan_configs table
            conn.execute(text(f'''
                CREATE TABLE IF NOT EXISTS "{schema_name}".portal_plan_configs (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    price INTEGER NOT NULL DEFAULT 0,
                    price_display VARCHAR NOT NULL DEFAULT '₹0',
                    billing VARCHAR NOT NULL DEFAULT 'Free Trial',
                    duration_days INTEGER NOT NULL DEFAULT 365,
                    max_roles INTEGER NOT NULL DEFAULT 1,
                    max_jobs INTEGER NOT NULL DEFAULT 1,
                    max_candidates_per_job INTEGER NOT NULL DEFAULT 15,
                    badge VARCHAR DEFAULT '',
                    is_popular BOOLEAN DEFAULT FALSE,
                    description TEXT,
                    features JSON DEFAULT '[]'::json,
                    sidebar_access JSON DEFAULT '{{}}'::json,
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
                );
            '''))
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_plan_configs ADD COLUMN IF NOT EXISTS sidebar_access JSON DEFAULT \'{{}}\'::json;'))

            # Vendor custom subdomain on portal_companies
            conn.execute(text(f'ALTER TABLE "{schema_name}".portal_companies ADD COLUMN IF NOT EXISTS subdomain VARCHAR;'))
            conn.execute(text(f'CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_companies_subdomain ON "{schema_name}".portal_companies(subdomain);'))

            # Create portal_vendor_invitations table
            conn.execute(text(f'''
                CREATE TABLE IF NOT EXISTS "{schema_name}".portal_vendor_invitations (
                    id SERIAL PRIMARY KEY,
                    token VARCHAR NOT NULL UNIQUE,
                    vendor_name VARCHAR NOT NULL,
                    vendor_email VARCHAR NOT NULL,
                    vendor_phone VARCHAR,
                    company_name VARCHAR NOT NULL,
                    subdomain VARCHAR NOT NULL,
                    price INTEGER NOT NULL DEFAULT 0,
                    currency VARCHAR DEFAULT 'INR',
                    validity_days INTEGER NOT NULL DEFAULT 30,
                    billing_note VARCHAR,
                    max_roles INTEGER NOT NULL DEFAULT 2,
                    max_jobs INTEGER NOT NULL DEFAULT 5,
                    max_candidates_per_job INTEGER NOT NULL DEFAULT 100,
                    sidebar_access JSON DEFAULT '{{}}'::json,
                    status VARCHAR DEFAULT 'PENDING',
                    created_by_user_id INTEGER REFERENCES "{schema_name}".portal_users(id),
                    created_company_id INTEGER REFERENCES "{schema_name}".portal_companies(id),
                    created_user_id INTEGER REFERENCES "{schema_name}".portal_users(id),
                    generated_password VARCHAR,
                    razorpay_order_id VARCHAR,
                    razorpay_payment_id VARCHAR,
                    payment_completed_at TIMESTAMP WITHOUT TIME ZONE,
                    invitation_sent_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
                );
            '''))
            conn.execute(text(f'CREATE INDEX IF NOT EXISTS idx_portal_vendor_invitations_token ON "{schema_name}".portal_vendor_invitations(token);'))
            conn.execute(text(f'CREATE INDEX IF NOT EXISTS idx_portal_vendor_invitations_email ON "{schema_name}".portal_vendor_invitations(vendor_email);'))
            conn.execute(text(f'CREATE INDEX IF NOT EXISTS idx_portal_vendor_invitations_subdomain ON "{schema_name}".portal_vendor_invitations(subdomain);'))
            conn.commit()
    except Exception as e:
        print(f"[AUTO-MIGRATE WARNING] {e}")

def ensure_plan_configs_exist():
    """Ensure the 3 standard hiring plans exist in portal_plan_configs with full role sidebar permissions."""
    try:
        import json
        default_plans = [
            {
                "id": "FREE",
                "name": "Free Starter",
                "price": 0,
                "price_display": "₹0",
                "billing": "Free Trial",
                "duration_days": 365,
                "max_roles": 1,
                "max_jobs": 1,
                "max_candidates_per_job": 5,
                "badge": "TIER 1",
                "is_popular": False,
                "description": "Essential trial access for exploratory hiring",
                "features": json.dumps([
                    "1 Recruiter / Staff role",
                    "1 Job requisition posting",
                    "5 Candidates visible per job",
                    "Excess candidate cards blurred"
                ]),
                "sidebar_access": json.dumps({
                    "ADMIN": ["dashboard", "admin_dashboard", "add_staff", "hiring_groups", "applicants", "company_profile", "support"],
                    "RECRUITER": ["recruiter_dashboard", "dashboard", "manage_jobs", "post_job", "applicants", "company_profile", "support"],
                    "HIRING_MANAGER": ["hiring_manager_dashboard", "dashboard", "manage_jobs", "company_profile", "support"],
                    "MANAGER": ["hiring_manager_dashboard", "dashboard", "manage_jobs", "company_profile", "support"]
                })
            },
            {
                "id": "PLAN_4999",
                "name": "Standard Role Plan",
                "price": 4999,
                "price_display": "₹4,999",
                "billing": "per role / 45 days",
                "duration_days": 45,
                "max_roles": 2,
                "max_jobs": 4,
                "max_candidates_per_job": 6,
                "badge": "MOST POPULAR",
                "is_popular": True,
                "description": "Ideal for focused hiring with dedicated recruiter and hiring manager roles",
                "features": json.dumps([
                    "2 Staff roles (Recruiter + Hiring Manager)",
                    "4 Active job postings",
                    "6 Candidates visible per job",
                    "AI candidate fit scoring"
                ]),
                "sidebar_access": json.dumps({
                    "ADMIN": ["dashboard", "admin_dashboard", "add_staff", "hiring_groups", "manage_jobs", "applicants", "interviews", "company_profile", "support"],
                    "RECRUITER": ["recruiter_dashboard", "dashboard", "manage_jobs", "post_job", "applicants", "application_status", "company_profile", "support"],
                    "HIRING_MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "company_profile", "support"],
                    "MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "company_profile", "support"]
                })
            },
            {
                "id": "PLAN_14999",
                "name": "Growth Scale Plan",
                "price": 14999,
                "price_display": "₹14,999",
                "billing": "per month",
                "duration_days": 30,
                "max_roles": 4,
                "max_jobs": 8,
                "max_candidates_per_job": 200,
                "badge": "HIGH VOLUME SCALE",
                "is_popular": False,
                "description": "Full agency-scale recruitment power with expanded team capacity and candidate reach",
                "features": json.dumps([
                    "4 Staff roles (2 Recruiters + 2 Managers)",
                    "8 Active job postings",
                    "200 Candidates visible per job",
                    "Agency-scale pipeline & pods"
                ]),
                "sidebar_access": json.dumps({
                    "ADMIN": ["dashboard", "admin_dashboard", "add_staff", "hiring_groups", "manage_jobs", "applicants", "interviews", "messages", "staff_documents", "company_profile", "support"],
                    "RECRUITER": ["recruiter_dashboard", "dashboard", "post_job", "manage_jobs", "applicants", "search_candidates", "application_status", "interviews", "messages", "documents", "company_profile", "support"],
                    "HIRING_MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "interviews", "messages", "company_profile", "support"],
                    "MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "interviews", "messages", "company_profile", "support"]
                })
            }
        ]

        with engine.connect() as conn:
            for p in default_plans:
                existing = conn.execute(
                    text(f'SELECT id, sidebar_access FROM "{schema_name}".portal_plan_configs WHERE id = :id'),
                    {"id": p["id"]}
                ).first()

                if not existing:
                    conn.execute(
                        text(f'''
                            INSERT INTO "{schema_name}".portal_plan_configs
                            (id, name, price, price_display, billing, duration_days, max_roles, max_jobs, max_candidates_per_job, badge, is_popular, description, features, sidebar_access, updated_at)
                            VALUES (:id, :name, :price, :price_display, :billing, :duration_days, :max_roles, :max_jobs, :max_candidates_per_job, :badge, :is_popular, :description, CAST(:features AS JSON), CAST(:sidebar_access AS JSON), NOW() AT TIME ZONE 'utc')
                        '''),
                        p
                    )
                else:
                    conn.execute(
                        text(f'''
                            UPDATE "{schema_name}".portal_plan_configs
                            SET sidebar_access = CAST(:sidebar_access AS JSON)
                            WHERE id = :id
                        '''),
                        {"id": p["id"], "sidebar_access": p["sidebar_access"]}
                    )
            conn.commit()
    except Exception as e:
        print(f"[PLAN CONFIGS INIT WARNING] {e}")

def ensure_superadmin_exists():
    """Ensure a default Superadmin account exists in portal_users using settings from .env."""
    try:
        import hashlib
        superadmin_email = (getattr(settings, "SUPERADMIN_EMAIL", None) or "superadmin@intentpeople.com").strip().lower()
        superadmin_pass = getattr(settings, "SUPERADMIN_PASSWORD", None) or "SuperAdmin@IntentPeople2026!"
        superadmin_pass_hash = hashlib.sha256(superadmin_pass.encode()).hexdigest()
        
        # Primary superadmin list to ensure created/updated from .env
        target_accounts = [
            (superadmin_email, superadmin_pass_hash)
        ]
        
        with engine.connect() as conn:
            # Clean up superadmin@uptrix.com if present
            conn.execute(text(f'DELETE FROM "{schema_name}".portal_users WHERE LOWER(email) = :email'), {"email": "superadmin@uptrix.com"})
            conn.commit()
            for email, p_hash in target_accounts:
                res = conn.execute(text(f'SELECT id FROM "{schema_name}".portal_users WHERE LOWER(email) = :email'), {"email": email.lower()}).first()
                if not res:
                    conn.execute(
                        text(f'''
                            INSERT INTO "{schema_name}".portal_users (email, password_hash, role, is_verified, created_at)
                            VALUES (:email, :pwd, 'SUPERADMIN', true, NOW() AT TIME ZONE 'utc')
                        '''),
                        {"email": email.lower(), "pwd": p_hash}
                    )
                    conn.commit()
                    print(f"[SUPERADMIN INIT] Created superadmin account: {email}")
                else:
                    conn.execute(
                        text(f'''
                            UPDATE "{schema_name}".portal_users 
                            SET password_hash = :pwd, role = 'SUPERADMIN', is_verified = true 
                            WHERE LOWER(email) = :email
                        '''),
                        {"email": email.lower(), "pwd": p_hash}
                    )
                    conn.commit()
    except Exception as e:
        print(f"[SUPERADMIN INIT WARNING] Could not verify/create superadmin: {e}")

def init_db_extensions():
    """Ensure columns, standard plan templates, and superadmin exist after tables are created."""
    ensure_columns_exist()
    ensure_plan_configs_exist()
    ensure_superadmin_exists()

# Ensure schema exists on startup
ensure_schema_exists()

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

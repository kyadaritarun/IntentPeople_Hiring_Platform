from app.database import engine, schema_name, SessionLocal
from sqlalchemy import text
from app import models
from app.services.scoring import CandidateScorer
from app.api.endpoints.application import _job_to_dict, _candidate_to_dict

def run_migration_and_rescore():
    print(f"Connecting to database with schema {schema_name}...")
    with engine.connect() as conn:
        print("Checking/adding fit_score and fit_breakdown columns...")
        conn.execute(text(f'ALTER TABLE "{schema_name}".portal_applications ADD COLUMN IF NOT EXISTS fit_score DOUBLE PRECISION;'))
        conn.execute(text(f'ALTER TABLE "{schema_name}".portal_applications ADD COLUMN IF NOT EXISTS fit_breakdown JSON;'))
        conn.commit()
        print("Columns fit_score and fit_breakdown ensured successfully!")

    db = SessionLocal()
    try:
        apps = db.query(models.Application).all()
        print(f"Found {len(apps)} total applications in database.")
        scored = 0
        for a in apps:
            job = db.query(models.Job).filter(models.Job.id == a.job_id).first()
            cand = db.query(models.Candidate).filter(models.Candidate.id == a.candidate_id).first()
            if job and cand:
                scorer = CandidateScorer(_job_to_dict(job))
                result = scorer.score(_candidate_to_dict(cand))
                a.fit_score = result["total"]
                a.fit_breakdown = result
                scored += 1
                print(f"  Scored app #{a.id} (Candidate: {cand.full_name}, Job: {job.title}) -> {a.fit_score}%")
        db.commit()
        print(f"Successfully scored {scored} applications.")
    except Exception as e:
        print(f"Error during rescore: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migration_and_rescore()

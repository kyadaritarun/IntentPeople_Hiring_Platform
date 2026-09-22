from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# AWS S3 Storage Enabled
from app.config import settings
from app.database import engine, Base
from app.api.router import api_router
from app.seed import seed
import app.models

# Initialize Database Schema & Seed Data
Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# CORS Setup with Vercel and local origins
cors_origins = [o.strip() for o in settings.CORS_ORIGINS if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Include Master API Router
app.include_router(api_router)

# Mount local uploads directory for static media access (fallback)
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Google OAuth 2.0 & Google Meet REST API v2 configured
@app.get("/")
def read_root():
    return {
        "message": f"{settings.PROJECT_NAME} is operational",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


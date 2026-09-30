from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback
# AWS S3 Storage Enabled
from app.config import settings
from app.database import engine, Base, init_db_extensions
from app.api.router import api_router
from app.seed import seed
import app.models

# Initialize Database Schema & Seed Data
Base.metadata.create_all(bind=engine)
try:
    init_db_extensions()
except Exception as e:
    print(f"[DB INIT WARNING] {e}")

try:
    seed()
except Exception as e:
    print(f"[STARTUP SEED WARNING] Seeding encountered an error: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# CORS Setup for IntentPeople, subdomains, and local dev
cors_origins = [
    "http://intentpeople.com",
    "https://intentpeople.com",
    "http://www.intentpeople.com",
    "https://www.intentpeople.com",
    "http://portal.intentpeople.com",
    "https://portal.intentpeople.com",
    "http://admin.intentpeople.com",
    "https://admin.intentpeople.com",
    "http://backend.intentpeople.com",
    "https://backend.intentpeople.com",
    "http://localhost:5173",
    "http://admin.localhost:5173",
    "http://portal.localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:8000"
]
extra_origins = [o.strip() for o in settings.CORS_ORIGINS if o.strip() and o.strip() != "*"]
for o in extra_origins:
    if o not in cors_origins:
        cors_origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?:\/\/([a-zA-Z0-9-]+\.)*(intentpeople\.com|vercel\.app|localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[UNHANDLED EXCEPTION] {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
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


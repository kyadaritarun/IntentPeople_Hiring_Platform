from fastapi import APIRouter

from app.api.endpoints import (
    auth,
    candidate,
    company,
    job,
    application,
    support,
    notification,
    interview,
    message,
    post,
    google_auth
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(google_auth.router)
api_router.include_router(candidate.router)
api_router.include_router(company.router)
api_router.include_router(job.router)
api_router.include_router(application.router)
api_router.include_router(support.router)
api_router.include_router(notification.router)
api_router.include_router(interview.router)
api_router.include_router(message.router)
api_router.include_router(post.router)

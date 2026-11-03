from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get(
    "/",
    tags=["Root"],
    summary="API Root Information",
    description="Returns high-level project metadata and active phase indicator.",
)
async def read_root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "phase": "Phase 1: Full-Stack Project Foundation",
        "description": "Real-Time UPI Fraud Detection & Financial Crime Intelligence",
        "documentation": "/docs",
        "status": "operational",
    }


@router.get(
    "/health",
    tags=["Health"],
    summary="Health Check",
    description="Returns system health, timestamp, and environment status.",
)
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "api_server": "online",
            "fastapi_core": "operational",
        },
    }


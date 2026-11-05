from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db, engine
from app.api.v1 import api_v1_router

router = APIRouter()

# Mount API v1 router
router.include_router(api_v1_router)


@router.get(
    "/",
    tags=["Root"],
    summary="API Root Information",
    description="Returns high-level project metadata, active phase indicator, and documentation links.",
)
async def read_root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "phase": "Phase 4: Backend + Database Foundation",
        "description": "Real-Time UPI Fraud Detection & Financial Crime Intelligence",
        "documentation": "/docs",
        "openapi_spec": "/openapi.json",
        "status": "operational",
        "api_v1_prefix": "/api/v1",
    }


@router.get(
    "/health",
    tags=["Health"],
    summary="System Health & Database Probe",
    description="Returns system health, database dialect connectivity, timestamp, and environment status.",
)
async def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    dialect_name = engine.dialect.name
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {exc}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "api_server": "online",
            "fastapi_core": "operational",
            "database": {
                "status": db_status,
                "dialect": dialect_name,
            },
        },
    }


# Register /api/v1/health alias for frontend clients prefixing all calls with /api/v1
api_v1_router.add_api_route(
    "/health",
    health_check,
    methods=["GET"],
    tags=["Health"],
    summary="System Health & Database Probe (v1 alias)",
)

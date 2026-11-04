import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api.routes import router

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("streamshield")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing StreamShield Backend & Database...")
    try:
        init_db()
        logger.info("Database schemas verified and demonstration fixtures populated.")
    except Exception as exc:
        logger.exception(f"Database initialization warning: {exc}")
    yield
    logger.info("StreamShield Backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "StreamShield: Real-Time UPI Fraud Detection & Financial Crime Intelligence API Engine. "
        "Provides streaming ingestion, graph intelligence telemetry, transaction monitoring, "
        "and statutory audit case dossier management."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Proper CORS configuration for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "detail": str(exc) if settings.DEBUG else "An internal server error occurred.",
            "path": request.url.path,
        },
    )


# Include API routes (both / and /health plus /api/v1)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

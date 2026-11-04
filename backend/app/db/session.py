import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base

logger = logging.getLogger("streamshield.db")

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DATABASE_ECHO,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
    # Quick probe
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info(f"Database engine successfully connected: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
except Exception as exc:
    if settings.DATABASE_URL.startswith("postgresql"):
        logger.warning(
            f"Could not connect to PostgreSQL ({exc}). "
            "Falling back to local SQLite database (sqlite:///./streamshield.db) "
            "for zero-infrastructure local execution."
        )
        engine = create_engine(
            "sqlite:///./streamshield.db",
            echo=settings.DATABASE_ECHO,
            connect_args={"check_same_thread": False},
        )
    else:
        raise exc

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database session lifecycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all schema tables and run initial synthetic demo seeding if empty."""
    # Import all models to ensure they are registered with Base.metadata
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    if settings.AUTO_SEED:
        from app.db.seed import seed_data_if_empty
        db = SessionLocal()
        try:
            seed_data_if_empty(db)
        finally:
            db.close()

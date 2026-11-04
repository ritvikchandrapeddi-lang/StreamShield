from sqlalchemy import Column, String, Boolean, DateTime, func
from app.db.base import Base


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    vpa = Column(String(128), index=True, nullable=False)
    time_label = Column(String(64), default="Just now", nullable=False)
    severity = Column(String(32), default="high", nullable=False, index=True)
    tx_id = Column(String(64), nullable=True, index=True)
    case_id = Column(String(64), nullable=True, index=True)
    read = Column(Boolean, default=False, nullable=False, index=True)
    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

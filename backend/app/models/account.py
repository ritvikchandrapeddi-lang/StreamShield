from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, func
from app.db.base import Base


class AccountModel(Base):
    __tablename__ = "accounts"

    id = Column(String(64), primary_key=True, index=True)
    vpa = Column(String(128), unique=True, index=True, nullable=False)
    owner_name = Column(String(128), nullable=False)
    role = Column(String(32), default="legitimate", nullable=False, index=True)
    risk_score = Column(Integer, default=0, nullable=False, index=True)
    bank_name = Column(String(128), nullable=False)
    ifsc = Column(String(32), nullable=True)
    city = Column(String(64), nullable=True)
    incoming_count = Column(Integer, default=0)
    outgoing_count = Column(Integer, default=0)
    total_incoming = Column(Float, default=0.0)
    total_outgoing = Column(Float, default=0.0)
    account_age_days = Column(Integer, default=0)
    status = Column(String(32), default="active", nullable=False, index=True)
    device_fingerprint = Column(String(64), nullable=True)
    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


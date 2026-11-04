from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, func
from app.db.base import Base


class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, index=True)
    sender_vpa = Column(String(128), index=True, nullable=False)
    sender_name = Column(String(128), nullable=False)
    sender_bank = Column(String(128), nullable=False)
    sender_city = Column(String(64), nullable=True)
    sender_device_id = Column(String(64), nullable=True)
    sender_ip = Column(String(64), nullable=True)
    sender_account_age_days = Column(Integer, default=0)

    receiver_vpa = Column(String(128), index=True, nullable=False)
    receiver_name = Column(String(128), nullable=False)
    receiver_bank = Column(String(128), nullable=False)

    amount = Column(Float, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)
    risk_score = Column(Integer, default=0, nullable=False, index=True)
    risk_level = Column(String(32), default="low", nullable=False, index=True)
    decision = Column(String(32), default="approved", nullable=False, index=True)
    risk_factors = Column(JSON, default=list, nullable=False)
    latency_ms = Column(Float, default=0.0)
    channel = Column(String(16), default="P2P", nullable=False)
    mule_probability = Column(Float, default=0.0)
    is_simulated = Column(Boolean, default=True, nullable=False)

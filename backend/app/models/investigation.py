from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    severity = Column(String(32), default="medium", nullable=False, index=True)
    status = Column(String(32), default="open", nullable=False, index=True)
    date_created = Column(String(64), nullable=False)
    primary_account = Column(String(128), index=True, nullable=False)
    primary_entity_name = Column(String(128), nullable=False)
    transaction_count = Column(Integer, default=0, nullable=False)
    total_disputed_amount = Column(Float, default=0.0, nullable=False)
    description = Column(Text, nullable=False)
    assigned_analyst = Column(String(128), nullable=False)
    risk_indicators = Column(JSON, default=list, nullable=False)
    associated_tx_ids = Column(JSON, default=list, nullable=False)
    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    notes = relationship(
        "CaseNoteModel",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="desc(CaseNoteModel.created_at)",
    )
    evidence = relationship(
        "CaseEvidenceModel",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="asc(CaseEvidenceModel.id)",
    )


class CaseNoteModel(Base):
    __tablename__ = "case_notes"

    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    author = Column(String(128), nullable=False)
    timestamp = Column(String(64), nullable=False)
    text = Column(Text, nullable=False)
    badge = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    case = relationship("CaseModel", back_populates="notes")


class CaseEvidenceModel(Base):
    __tablename__ = "case_evidence"

    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    time = Column(String(32), nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(32), nullable=False)
    severity = Column(String(32), default="medium", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    case = relationship("CaseModel", back_populates="evidence")

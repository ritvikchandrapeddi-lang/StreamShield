from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

CaseSeverity = Literal["low", "medium", "high", "critical"]
CaseStatus = Literal["open", "investigating", "escalated", "resolved"]
EvidenceCategory = Literal["telco", "banking", "device", "network", "rule"]


class CaseNoteCreate(BaseModel):
    author: str = Field(..., description="Investigating officer / analyst name")
    text: str = Field(..., description="Note observations or LEA case entry")
    badge: Optional[str] = Field("Analyst Entry", description="Category badge")


class CaseNoteUpdate(BaseModel):
    text: str = Field(..., description="Updated note text")


class CaseNoteResponse(BaseModel):
    id: str
    case_id: str
    author: str
    timestamp: str
    text: str
    badge: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseEvidenceCreate(BaseModel):
    id: Optional[str] = None
    time: str = Field(..., description="Audit event timestamp")
    title: str = Field(..., description="Evidence title")
    description: str = Field(..., description="Full forensic finding narrative")
    category: EvidenceCategory = Field(..., description="Evidence typology")
    severity: CaseSeverity = Field("medium", description="Risk tier")


class CaseEvidenceResponse(BaseModel):
    id: str
    case_id: str
    time: str
    title: str
    description: str
    category: str
    severity: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseStatusUpdate(BaseModel):
    status: CaseStatus = Field(..., description="Updated case docket lifecycle status")


class CaseBase(BaseModel):
    title: str = Field(..., description="Case docket title")
    severity: CaseSeverity = Field("high", description="Case priority level")
    status: CaseStatus = Field("open", description="Lifecycle status")
    date_created: str = Field(..., description="Creation date timestamp string")
    primary_account: str = Field(..., description="Primary suspect VPA / hub")
    primary_entity_name: str = Field(..., description="Suspect cluster legal name")
    transaction_count: int = Field(0, ge=0)
    total_disputed_amount: float = Field(0.0, ge=0.0)
    description: str = Field(..., description="Executive case summary")
    assigned_analyst: str = Field(..., description="Lead investigating officer")
    risk_indicators: List[str] = Field(default_factory=list)
    associated_tx_ids: List[str] = Field(default_factory=list)
    is_simulated: bool = Field(True, description="Demonstration docket flag")


class CaseCreate(CaseBase):
    id: Optional[str] = None


class CaseResponse(CaseBase):
    id: str
    created_at: datetime
    notes: List[CaseNoteResponse] = Field(default_factory=list)
    evidence: List[CaseEvidenceResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CaseListResponse(BaseModel):
    cases: List[CaseResponse]
    total: int


from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

AlertSeverity = Literal["low", "medium", "high", "critical"]


class AlertBase(BaseModel):
    title: str = Field(..., description="Alert headline summary")
    vpa: str = Field(..., description="Targeted or offending VPA identifier")
    time_label: str = Field("Just now", description="Human-readable relative time")
    severity: AlertSeverity = Field("high", description="Risk escalation level")
    tx_id: Optional[str] = Field(None, description="Linked transaction ID if available")
    case_id: Optional[str] = Field(None, description="Linked investigation dossier if available")
    read: bool = Field(False, description="Read/unread disposition status")
    is_simulated: bool = Field(True, description="Synthetic demonstration fixture")


class AlertCreate(AlertBase):
    id: Optional[str] = None


class AlertResponse(AlertBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    unread_count: int
    total: int


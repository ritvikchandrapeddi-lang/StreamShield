from typing import List, Dict, Any
from pydantic import BaseModel
from app.schemas.transaction import TransactionResponse
from app.schemas.alert import AlertResponse


class DashboardStatsResponse(BaseModel):
    monitored_volume_inr: float
    total_transactions: int
    flagged_transactions: int
    blocked_transactions: int
    review_transactions: int
    approved_transactions: int
    active_mule_accounts: int
    active_investigations: int
    average_risk_score: float
    system_status: str
    evaluated_window: str
    is_simulated: bool
    risk_distribution: Dict[str, int]
    recent_alerts: List[AlertResponse]
    recent_high_risk_transactions: List[TransactionResponse]
    stream_telemetry: Dict[str, Any]

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

RiskLevel = Literal["low", "medium", "high", "critical"]
Decision = Literal["approved", "review", "blocked"]
ChannelType = Literal["P2P", "P2M"]


class TransactionBase(BaseModel):
    sender_vpa: str = Field(..., description="Debited customer VPA")
    sender_name: str = Field(..., description="Debited account legal title")
    sender_bank: str = Field(..., description="Issuing bank")
    sender_city: Optional[str] = Field(None, description="Initiating geography")
    sender_device_id: Optional[str] = Field(None, description="Client device hardware hash")
    sender_ip: Optional[str] = Field(None, description="Ingress client IPv4/IPv6")
    sender_account_age_days: int = Field(0, ge=0)

    receiver_vpa: str = Field(..., description="Beneficiary VPA")
    receiver_name: str = Field(..., description="Beneficiary legal title")
    receiver_bank: str = Field(..., description="Acquiring/Remitter bank")

    amount: float = Field(..., gt=0, description="Transaction ticket size in INR (₹)")
    risk_score: int = Field(0, ge=0, le=100, description="Hybrid GNN composite risk score")
    risk_level: RiskLevel = Field("low", description="Discrete risk classification tier")
    decision: Decision = Field("approved", description="Automated clearing disposition")
    risk_factors: List[str] = Field(default_factory=list, description="Explainable SHAP feature tags")
    latency_ms: float = Field(0.0, ge=0, description="Pipeline scoring latency in milliseconds")
    channel: ChannelType = Field("P2P", description="UPI payment flow channel")
    mule_probability: float = Field(0.0, ge=0.0, le=1.0, description="Graph mule cluster probability")
    is_simulated: bool = Field(True, description="Demonstration flag")


class TransactionCreate(TransactionBase):
    id: Optional[str] = Field(None, description="Optional custom transaction ID (e.g. TXN-902418-UPI)")


class TransactionDecisionUpdate(BaseModel):
    decision: Decision = Field(..., description="Updated operational decision")
    reason: Optional[str] = Field(None, description="Analyst disposition justification")


class TransactionResponse(TransactionBase):
    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    limit: int
    skip: int


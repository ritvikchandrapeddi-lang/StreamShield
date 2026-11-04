from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

AccountRole = Literal["source", "first_mule", "intermediate", "downstream", "consolidation", "legitimate"]
AccountStatus = Literal["active", "frozen", "under_surveillance", "closed"]


class AccountBase(BaseModel):
    vpa: str = Field(..., description="Virtual Payment Address (e.g. user@bank)")
    owner_name: str = Field(..., description="Registered legal name or trade entity")
    role: AccountRole = Field("legitimate", description="Graph topology classification")
    risk_score: int = Field(0, ge=0, le=100, description="Risk indicator score 0-100")
    bank_name: str = Field(..., description="Primary settlement bank")
    ifsc: Optional[str] = Field(None, description="IFSC routing code")
    city: Optional[str] = Field(None, description="Registered geography / telecom circle")
    incoming_count: int = Field(0, ge=0)
    outgoing_count: int = Field(0, ge=0)
    total_incoming: float = Field(0.0, ge=0.0)
    total_outgoing: float = Field(0.0, ge=0.0)
    account_age_days: int = Field(0, ge=0)
    status: AccountStatus = Field("active", description="Account compliance state")
    device_fingerprint: Optional[str] = Field(None, description="Hardware IMEI/MAC fingerprint")
    is_simulated: bool = Field(True, description="Synthetic demonstration flag")


class AccountCreate(AccountBase):
    id: Optional[str] = None


class AccountResponse(AccountBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

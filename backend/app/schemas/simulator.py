"""
StreamShield Schemas — Fraud Attack Simulator & Scenario Sandbox
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.schemas.dna import ArchetypeMatchResultSchema


class SimulationScenarioMetaSchema(BaseModel):
    id: str = Field(..., description="Scenario identifier (e.g. funnel-attack)")
    name: str = Field(..., description="Human-readable title")
    description: str = Field(..., description="Scenario synopsis")
    complexity: str = Field(..., description="Complexity tier: Low, Medium, High, Extreme")
    default_volume: int = Field(..., description="Default transaction count")
    default_intermediaries: int = Field(..., description="Default number of intermediate mule accounts")
    default_amount_min: float = Field(..., description="Default minimum transfer sum (INR)")
    default_amount_max: float = Field(..., description="Default maximum transfer sum (INR)")
    typology_summary: str = Field(..., description="Typology mechanics and criminal objective")
    detection_explanation: str = Field(..., description="Explanation of how StreamShield detects this vector")
    key_rule_triggers: List[str] = Field(..., description="List of rule codes expected to fire")


class SimulationRunRequest(BaseModel):
    scenario_id: str = Field(..., description="Target scenario identifier (e.g. funnel-attack, smurfing-split, circular-transfers, layering-intermediates, coordinated-mule-network, unknown-adaptive)")
    volume: Optional[int] = Field(None, ge=10, le=1000, description="Override transaction volume")
    intermediaries: Optional[int] = Field(None, ge=2, le=30, description="Override number of intermediary nodes")
    amount_min: Optional[float] = Field(None, ge=100.0, description="Override minimum transfer amount")
    amount_max: Optional[float] = Field(None, description="Override maximum transfer amount")
    complexity: Optional[str] = Field(None, description="Complexity tier override")
    noise_ratio: Optional[float] = Field(0.20, ge=0.0, le=0.80, description="Ratio of benign noise transactions (default 0.20)")


class SimulatedEventSchema(BaseModel):
    id: str = Field(..., description="Simulated transaction ID")
    sender: str = Field(..., description="Sender VPA")
    receiver: str = Field(..., description="Receiver VPA")
    amount: float = Field(..., description="Transfer amount (INR)")
    risk_score: int = Field(..., description="Real-time ML risk score (0-100)")
    decision: str = Field(..., description="Pipeline decision: approved, review, blocked")
    flagged: bool = Field(..., description="Whether transaction was flagged as suspicious")
    time: str = Field(..., description="Timestamp of simulated event")
    rule_fired: Optional[str] = Field(None, description="Primary rule or typology trigger that fired")
    is_simulated: bool = Field(True, description="Simulation marker")


class SimulationMetricsSchema(BaseModel):
    total_generated_transactions: int = Field(..., description="Total synthetic transactions simulated")
    flagged_transactions_count: int = Field(..., description="Count of transactions flagged as high-risk or blocked")
    quarantined_accounts_count: int = Field(..., description="Count of intermediary mule accounts isolated")
    total_simulated_volume: float = Field(..., description="Total aggregate INR volume moved")
    detection_rate_percent: float = Field(..., description="Percentage of illicit transactions halted")
    mean_pipeline_latency_ms: float = Field(..., description="Mean transaction processing and scoring latency")
    mitigated_loss_amount: float = Field(..., description="Estimated loss prevented by automated quarantine")


class SimulationRunResponse(BaseModel):
    simulation_id: str = Field(..., description="Unique simulation execution identifier")
    scenario_id: str = Field(..., description="Executed scenario ID")
    scenario_name: str = Field(..., description="Executed scenario moniker")
    status: str = Field("completed", description="Execution status")
    metrics: SimulationMetricsSchema = Field(..., description="Empirical performance metrics of simulation run")
    simulated_stream: List[SimulatedEventSchema] = Field(..., description="Feed of simulated transactions scored by pipeline")
    detected_patterns: List[str] = Field(..., description="Typological patterns flagged during execution")
    suspicious_accounts: List[Dict[str, Any]] = Field(..., description="List of isolated mule / sink accounts with scores")
    fraud_dna_match: Optional[ArchetypeMatchResultSchema] = Field(None, description="Fraud DNA matching result")
    money_trail_summary: Optional[Dict[str, Any]] = Field(None, description="Downstream money trail discovered from source")
    cytoscape_elements: List[Dict[str, Any]] = Field(..., description="Cytoscape.js ready JSON graph elements")
    narrative_summary: str = Field(..., description="Executive debrief summarizing attack progression and defense response")
    is_simulated: bool = Field(True, description="Synthetic demo marker")
    disclaimer: str = Field(
        "SYNTHETIC / SIMULATED DATA — StreamShield Fraud Intelligence Lab simulation run. Results generated using procedural attack models.",
        description="Data integrity marker"
    )


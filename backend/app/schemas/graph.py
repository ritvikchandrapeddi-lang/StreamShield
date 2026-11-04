from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GraphNodeSchema(BaseModel):
    id: str = Field(..., description="Unique node / VPA identifier")
    vpa: str = Field(..., description="Virtual Payment Address")
    owner_name: str = Field(..., description="Account holder name")
    bank_name: str = Field(..., description="Issuing bank")
    role: str = Field("legitimate", description="Graph typology role: source, first_mule, intermediate, downstream, consolidation, legitimate")
    risk_score: int = Field(0, description="Base transaction risk score (0-100)")
    mule_score: float = Field(0.0, description="Calculated graph mule probability score (0-100)")
    in_degree: int = Field(0, description="Number of distinct incoming transaction sources")
    out_degree: int = Field(0, description="Number of distinct outgoing transaction destinations")
    total_incoming: float = Field(0.0, description="Aggregate incoming transaction volume in INR")
    total_outgoing: float = Field(0.0, description="Aggregate outgoing transaction volume in INR")
    city: Optional[str] = Field(None, description="Registered geography")
    status: str = Field("active", description="Account operating status (active, frozen, under_surveillance)")
    pagerank: float = Field(0.0, description="NetworkX PageRank centrality score")
    is_synthetic: bool = Field(True, description="Synthetic demo marker")


class GraphEdgeSchema(BaseModel):
    id: str = Field(..., description="Unique edge / transaction identifier")
    source: str = Field(..., description="Source node VPA")
    target: str = Field(..., description="Target node VPA")
    amount: float = Field(..., description="Transfer amount in INR")
    timestamp: str = Field(..., description="ISO 8601 or clock time of transaction")
    latency_ms: float = Field(0.0, description="Scoring latency in milliseconds")
    risk_score: int = Field(0, description="Transaction risk score")
    decision: str = Field("approved", description="Decision: approved, review, blocked")
    tx_ref: str = Field("", description="Transaction reference code")
    status: str = Field("completed", description="Execution status: completed, flagged, frozen")
    is_synthetic: bool = Field(True, description="Synthetic demo marker")


class CytoscapeElementSchema(BaseModel):
    group: str = Field(..., description="Cytoscape element group: 'nodes' or 'edges'")
    data: Dict[str, Any] = Field(..., description="Data payload for Cytoscape renderer")


class GraphOverviewSchema(BaseModel):
    total_nodes: int = Field(..., description="Total unique account nodes in the graph")
    total_edges: int = Field(..., description="Total transaction edges in the graph")
    graph_density: float = Field(..., description="Directed graph density")
    strongly_connected_components: int = Field(..., description="Number of strongly connected components")
    weakly_connected_components: int = Field(..., description="Number of weakly connected components")
    detected_rings_count: int = Field(..., description="Number of suspicious mule rings/clusters identified")
    flagged_mule_nodes_count: int = Field(..., description="Number of nodes with mule score >= 70")
    total_disputed_volume: float = Field(..., description="Total disputed amount in high-risk networks")
    avg_clustering_coefficient: float = Field(..., description="Average network clustering coefficient")
    top_mules: List[Dict[str, Any]] = Field(default_factory=list, description="Top ranked mule nodes")
    top_hubs: List[Dict[str, Any]] = Field(default_factory=list, description="Top high-centrality hub accounts")
    typology_distribution: Dict[str, int] = Field(default_factory=dict, description="Counts of detected fraud ring typologies")
    disclaimer: str = Field(
        "SYNTHETIC / DEMO DATA — StreamShield Graph Intelligence engine simulated metrics",
        description="Data integrity badge"
    )


class AccountNetworkSchema(BaseModel):
    center_vpa: str = Field(..., description="Target central VPA explored")
    center_node: GraphNodeSchema = Field(..., description="Central node details")
    depth: int = Field(..., description="Exploration ego-network depth hops")
    nodes: List[GraphNodeSchema] = Field(..., description="Neighborhood nodes")
    edges: List[GraphEdgeSchema] = Field(..., description="Connected edges")
    cytoscape_elements: List[Dict[str, Any]] = Field(..., description="Cytoscape.js ready JSON elements")
    neighborhood_factors: List[str] = Field(default_factory=list, description="Suspicious patterns detected in neighborhood")
    risk_summary: Dict[str, Any] = Field(default_factory=dict, description="Aggregated risk metrics for subgraph")
    disclaimer: str = Field(
        "SYNTHETIC / DEMO DATA — StreamShield Graph Intelligence ego-network simulation",
        description="Data integrity badge"
    )


class MuleDetectionSchema(BaseModel):
    vpa: str = Field(..., description="VPA identifier")
    owner_name: str = Field(..., description="Account holder name")
    bank_name: str = Field(..., description="Bank")
    role: str = Field(..., description="Assigned graph role")
    mule_score: float = Field(..., description="Composite mule risk score (0-100)")
    risk_level: str = Field(..., description="Risk tier: low, medium, high, critical")
    in_degree: int = Field(..., description="In-degree (incoming senders)")
    out_degree: int = Field(..., description="Out-degree (outgoing recipients)")
    pass_through_ratio: float = Field(..., description="Velocity flow ratio: min(in, out) / max(in, out)")
    incoming_volume: float = Field(..., description="Total incoming volume (INR)")
    outgoing_volume: float = Field(..., description="Total outgoing volume (INR)")
    flagged_neighbors_ratio: float = Field(..., description="Percentage of immediate neighbors flagged high-risk")
    reasons: List[str] = Field(default_factory=list, description="Explainability reasons for mule flag")
    status: str = Field("active", description="Operational status")


class MulesListResponse(BaseModel):
    total_flagged: int = Field(..., description="Total accounts identified as mules (mule_score >= 60)")
    high_risk_count: int = Field(..., description="Total accounts with mule_score >= 80")
    mules: List[MuleDetectionSchema] = Field(..., description="Ranked list of detected mule accounts")
    disclaimer: str = Field(
        "SYNTHETIC / DEMO DATA — Simulated mule detection scores based on graph heuristics",
        description="Data integrity badge"
    )


class SuspiciousRingSchema(BaseModel):
    ring_id: str = Field(..., description="Unique fraud ring identifier")
    name: str = Field(..., description="Human-readable syndicate moniker")
    typology: str = Field(..., description="Typology classification: Funnel Layering, Smurfing Dispersal, Circular Wash, Multi-Hop Transit")
    risk_score: int = Field(..., description="Aggregated ring threat score (0-100)")
    risk_level: str = Field(..., description="Ring severity level")
    total_volume: float = Field(..., description="Total funds circulating in ring (INR)")
    hop_count: int = Field(..., description="Maximum path depth within ring")
    node_count: int = Field(..., description="Number of distinct member accounts")
    edge_count: int = Field(..., description="Number of transactions linking ring members")
    member_vpas: List[str] = Field(..., description="List of participant VPAs")
    orchestrator_vpas: List[str] = Field(default_factory=list, description="Identified orchestrator or origin accounts")
    sink_vpas: List[str] = Field(default_factory=list, description="Identified consolidation or cashout sinks")
    nodes: List[GraphNodeSchema] = Field(..., description="Detailed node objects for ring")
    edges: List[GraphEdgeSchema] = Field(..., description="Detailed edge transactions for ring")
    cytoscape_elements: List[Dict[str, Any]] = Field(..., description="Cytoscape.js ready JSON elements")
    pattern_explanation: str = Field(..., description="Detailed narrative explanation of the syndicate scheme")
    key_indicators: List[str] = Field(default_factory=list, description="Structural indicators flagged by NetworkX")
    disclaimer: str = Field(
        "SYNTHETIC / DEMO DATA — Synthetic mule ring cluster generated for demonstration",
        description="Data integrity badge"
    )


class RingsListResponse(BaseModel):
    total_rings: int = Field(..., description="Total detected rings")
    highest_risk_score: int = Field(..., description="Peak risk score among active rings")
    rings: List[SuspiciousRingSchema] = Field(..., description="List of detected suspicious rings")
    disclaimer: str = Field(
        "SYNTHETIC / DEMO DATA — StreamShield syndicate clustering demo",
        description="Data integrity badge"
    )


class MoneyTrailHopSchema(BaseModel):
    hop_index: int = Field(..., description="Hop depth (1, 2, 3...)")
    from_vpa: str = Field(..., description="Sender VPA")
    to_vpa: str = Field(..., description="Receiver VPA")
    amount: float = Field(..., description="Transferred sum")
    timestamp: str = Field(..., description="Timestamp")
    tx_id: str = Field(..., description="Transaction reference ID")


class MoneyTrailTraceRequest(BaseModel):
    source_vpa: str = Field(..., description="Originating account VPA to trace from")
    max_hops: int = Field(4, ge=1, le=8, description="Maximum traversal depth (default: 4)")
    min_amount: Optional[float] = Field(None, description="Optional minimum transaction amount threshold")


class MoneyTrailTraceResponse(BaseModel):
    source_vpa: str = Field(..., description="Initiating root VPA")
    source_name: str = Field(..., description="Initiating account holder name")
    total_disputed_amount: float = Field(..., description="Total initial drained funds")
    max_hops_reached: int = Field(..., description="Deepest hop reached in traversal")
    visited_nodes_count: int = Field(..., description="Total accounts in downstream tree")
    visited_edges_count: int = Field(..., description="Total transactions in downstream tree")
    destination_sinks: List[Dict[str, Any]] = Field(..., description="Identified terminal destination / cashout accounts")
    hops_breakdown: List[MoneyTrailHopSchema] = Field(..., description="Sequential hop ledger")
    nodes: List[GraphNodeSchema] = Field(..., description="Nodes in the traced money trail")
    edges: List[GraphEdgeSchema] = Field(..., description="Edges in the traced money trail")
    cytoscape_elements: List[Dict[str, Any]] = Field(..., description="Cytoscape.js ready JSON elements")
    detection_narrative: str = Field(..., description="Intelligence summary explaining how the funds moved")
    explainability_flags: List[str] = Field(default_factory=list, description="Specific forensic heuristics triggered")
    disclaimer: str = Field(
        "SYNTHETIC / DEMO DATA — Downstream money-trail path tracing simulation",
        description="Data integrity badge"
    )


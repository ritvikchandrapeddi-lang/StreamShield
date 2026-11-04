"""
StreamShield Graph Intelligence & Mule-Ring Detection API Endpoints

Provides REST APIs for:
- Directed transaction graph statistics & topology overview
- Ego-network exploration around an account
- Mule account scoring with explainability reasons
- Suspicious fraud ring / syndicate detection
- Multi-hop downstream money-trail tracing
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, Body, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.graph.service import graph_service
from app.schemas.graph import (
    GraphOverviewSchema,
    AccountNetworkSchema,
    MulesListResponse,
    RingsListResponse,
    MoneyTrailTraceRequest,
    MoneyTrailTraceResponse,
)

router = APIRouter(prefix="/graph", tags=["Graph Intelligence"])


@router.get(
    "/overview",
    response_model=GraphOverviewSchema,
    summary="Get Transaction Graph Overview & Network Statistics",
    description="Returns global NetworkX topology metrics, density, component counts, top mule nodes, and detected ring counts.",
)
def get_graph_overview(db: Session = Depends(get_db)):
    """Fetch global graph intelligence summary."""
    # Ensure graph is synced
    graph_service.sync_from_db(db)
    return graph_service.get_overview()


@router.get(
    "/account/{vpa:path}",
    response_model=AccountNetworkSchema,
    summary="Explore Account Ego-Network Subgraph",
    description="Returns the localized subgraph of accounts and directed transactions surrounding the target VPA up to N hops.",
)
def explore_account_network(
    vpa: str = Path(..., description="Virtual Payment Address or Account ID to explore"),
    depth: int = Query(2, ge=1, le=4, description="Ego-network hop radius (1 to 4)"),
    db: Session = Depends(get_db),
):
    """Retrieve ego-network around target account."""
    graph_service.sync_from_db(db)
    result = graph_service.explore_account(vpa, depth=depth)
    return result


@router.get(
    "/explore",
    response_model=AccountNetworkSchema,
    summary="Explore Account Network (Query Param alias)",
    description="Alternative endpoint for account exploration taking account_id or vpa as a query parameter.",
)
def explore_account_query(
    account_id: str = Query(..., description="VPA or Node ID"),
    depth: int = Query(2, ge=1, le=4, description="Hop depth"),
    db: Session = Depends(get_db),
):
    """Query parameter alias for account network exploration."""
    graph_service.sync_from_db(db)
    return graph_service.explore_account(account_id, depth=depth)


@router.get(
    "/mules",
    response_model=MulesListResponse,
    summary="Detect & Rank Suspicious Mule Accounts",
    description="Ranks accounts using composite graph heuristics (degree disparity, velocity pass-through ratio, neighbor contamination).",
)
def get_detected_mules(
    min_score: float = Query(60.0, ge=0.0, le=100.0, description="Minimum mule risk score threshold (default 60)"),
    db: Session = Depends(get_db),
):
    """List detected mule accounts with forensic explainability."""
    graph_service.sync_from_db(db)
    return graph_service.get_mules(min_mule_score=min_score)


@router.get(
    "/rings",
    response_model=RingsListResponse,
    summary="Detect Suspicious Mule Rings & Fraud Syndicates",
    description="Identifies organized clusters (Funnel Layering, Smurfing Dispersal, Circular Wash Loops, Multi-Hop Transits) and returns threat scores and Cytoscape elements.",
)
def get_fraud_rings(db: Session = Depends(get_db)):
    """Detect and classify organized crime rings."""
    graph_service.sync_from_db(db)
    return graph_service.get_rings()


@router.post(
    "/trace",
    response_model=MoneyTrailTraceResponse,
    summary="Trace Multi-Hop Downstream Money Trail",
    description="Explores downstream fund flows from an originating account across multiple hops, identifying terminal consolidation vaults.",
)
def trace_downstream_post(
    payload: MoneyTrailTraceRequest = Body(...),
    db: Session = Depends(get_db),
):
    """Downstream money trail tracing (POST payload)."""
    graph_service.sync_from_db(db)
    return graph_service.trace_trail(
        source_vpa=payload.source_vpa,
        max_hops=payload.max_hops,
        min_amount=payload.min_amount,
    )


@router.get(
    "/trace",
    response_model=MoneyTrailTraceResponse,
    summary="Trace Downstream Money Trail (GET)",
    description="Convenience GET endpoint for tracing funds downstream from an originating account.",
)
def trace_downstream_get(
    source_vpa: str = Query(..., description="Originating account VPA"),
    max_hops: int = Query(4, ge=1, le=6, description="Maximum traversal depth (default: 4)"),
    min_amount: Optional[float] = Query(None, description="Optional minimum transaction amount filter"),
    db: Session = Depends(get_db),
):
    """Downstream money trail tracing (GET query parameters)."""
    graph_service.sync_from_db(db)
    return graph_service.trace_trail(
        source_vpa=source_vpa,
        max_hops=max_hops,
        min_amount=min_amount,
    )


@router.post(
    "/sync",
    summary="Synchronize Graph From Database",
    description="Forces a complete reload of the NetworkX transaction graph from the current database state.",
)
def sync_graph_endpoint(db: Session = Depends(get_db)):
    """Trigger manual re-synchronization with DB."""
    graph_service.sync_from_db(db)
    overview = graph_service.get_overview()
    return {
        "status": "synchronized",
        "total_nodes": overview["total_nodes"],
        "total_edges": overview["total_edges"],
        "detected_rings_count": overview["detected_rings_count"],
    }

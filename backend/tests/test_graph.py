"""
StreamShield Phase 6 — Graph Intelligence & Mule Ring Detection Test Suite

Validates:
1. NetworkX directed transaction graph construction
2. Graph algorithms: Cycle detection, Fan-in, Fan-out, Layering chains
3. Mule-account risk scoring and explainability factors
4. Downstream multi-hop money-trail path tracing & sink discovery
5. Fraud ring / syndicate clustering and threat scoring
6. REST API endpoints for graph intelligence
"""

import os
import sys
import pytest
import httpx

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.graph.builder import TransactionGraphBuilder
from app.graph.analytics import GraphAnalyticsEngine
from app.graph.tracer import MoneyTrailTracer
from app.graph.rings import FraudRingDetector
from app.graph.service import graph_service


# -----------------------------------------------------------------------------
# UNIT TESTS: GRAPH ENGINE & ALGORITHMS
# -----------------------------------------------------------------------------

def test_graph_builder_initialization():
    """Verify NetworkX graph builds with accounts and edges."""
    builder = TransactionGraphBuilder()
    graph = builder.graph

    assert graph.number_of_nodes() >= 15
    assert graph.number_of_edges() >= 15
    assert graph.has_node("amit.verma91@okhdfcbank")
    assert graph.has_node("offshore_settle_node@indus")
    assert graph.has_node("swiggy.order@icici")

    # Check node attributes
    victim = graph.nodes["amit.verma91@okhdfcbank"]
    assert victim["role"] == "source"
    assert victim["risk_score"] >= 80

    # Check simple DiGraph conversion
    simple_g = builder.get_simple_digraph()
    assert simple_g.number_of_nodes() == graph.number_of_nodes()


def test_cytoscape_elements_conversion():
    """Verify conversion to Cytoscape.js ElementDefinition array."""
    builder = TransactionGraphBuilder()
    nodes = [
        {"id": "n1", "vpa": "acc1@upi", "owner_name": "Test One", "role": "source", "risk_score": 90, "total_incoming": 1000},
        {"id": "n2", "vpa": "acc2@upi", "owner_name": "Test Two", "role": "consolidation", "risk_score": 95, "total_incoming": 1000},
    ]
    edges = [
        {"id": "e1", "source": "acc1@upi", "target": "acc2@upi", "amount": 1000, "risk_score": 90}
    ]

    elements = builder.to_cytoscape_elements(nodes, edges)
    assert len(elements) == 3
    node_elements = [el for el in elements if el["group"] == "nodes"]
    edge_elements = [el for el in elements if el["group"] == "edges"]

    assert len(node_elements) == 2
    assert len(edge_elements) == 1
    assert "bgColor" in node_elements[0]["data"]
    assert node_elements[0]["data"]["vpa"] == "acc1@upi"


def test_cycle_detection():
    """Verify detection of circular money movement (Zero-Sum Wash Cycle)."""
    builder = TransactionGraphBuilder()
    analytics = GraphAnalyticsEngine(builder)

    cycles = analytics.detect_cycles(max_cycle_len=6)
    assert len(cycles) >= 1

    # Check that circular wash loop was detected
    wash_cycle = next(
        (c for c in cycles if "ring_shell_a@okicici" in c["nodes"]), None
    )
    assert wash_cycle is not None
    assert wash_cycle["cycle_length"] == 4
    assert wash_cycle["total_volume"] >= 200000.0


def test_fan_in_detection():
    """Verify detection of fan-in funneling into terminal aggregator."""
    builder = TransactionGraphBuilder()
    analytics = GraphAnalyticsEngine(builder)

    fan_in_nodes = analytics.detect_fan_in(min_senders=3)
    assert len(fan_in_nodes) >= 1

    sink_node = next(
        (f for f in fan_in_nodes if f["vpa"] == "offshore_settle_node@indus"), None
    )
    assert sink_node is not None
    assert sink_node["in_degree"] >= 3
    assert sink_node["total_funneled_amount"] > 400000.0


def test_fan_out_detection():
    """Verify detection of fan-out micro-splitting smurfing."""
    builder = TransactionGraphBuilder()
    analytics = GraphAnalyticsEngine(builder)

    fan_out_nodes = analytics.detect_fan_out(min_recipients=3)
    assert len(fan_out_nodes) >= 1

    smurf_origin = next(
        (f for f in fan_out_nodes if f["vpa"] == "target_enterprise@okaxis"), None
    )
    assert smurf_origin is not None
    assert smurf_origin["out_degree"] >= 5
    assert smurf_origin["total_dispersed_amount"] >= 200000.0


def test_layering_chains_detection():
    """Verify detection of multi-hop layering paths."""
    builder = TransactionGraphBuilder()
    analytics = GraphAnalyticsEngine(builder)

    chains = analytics.detect_layering_chains(min_hops=3)
    assert len(chains) >= 1

    falcon_chain = next(
        (c for c in chains if c["source"] == "amit.verma91@okhdfcbank" and c["terminal_sink"] == "offshore_settle_node@indus"),
        None,
    )
    assert falcon_chain is not None
    assert falcon_chain["hops"] >= 3


def test_mule_account_scoring():
    """Verify mule risk scoring differentiates high-risk mules from legitimate entities."""
    builder = TransactionGraphBuilder()
    analytics = GraphAnalyticsEngine(builder)

    # 1. Tier-1 primary mule
    mule_res = analytics.score_mule_account("fastpay_drop88@paytm")
    assert mule_res["mule_score"] >= 75.0
    assert mule_res["risk_level"] in ("high", "critical")
    assert len(mule_res["reasons"]) > 0
    assert any("mule drop" in r.lower() or "pass-through" in r.lower() for r in mule_res["reasons"])

    # 2. Legitimate merchant
    legit_res = analytics.score_mule_account("swiggy.order@icici")
    assert legit_res["mule_score"] <= 35.0
    assert legit_res["risk_level"] == "low"


def test_downstream_money_trail_tracing():
    """Verify downstream tracing follows funds across hops to terminal sinks."""
    builder = TransactionGraphBuilder()
    tracer = MoneyTrailTracer(builder)

    trace = tracer.trace_money_trail(
        source_vpa="amit.verma91@okhdfcbank",
        max_hops=4,
    )

    assert trace["source_vpa"] == "amit.verma91@okhdfcbank"
    assert trace["total_disputed_amount"] == 485000.0
    assert trace["max_hops_reached"] >= 3
    assert trace["visited_nodes_count"] >= 8
    assert trace["visited_edges_count"] >= 10
    assert len(trace["destination_sinks"]) >= 1

    sink_vpas = [s["vpa"] for s in trace["destination_sinks"]]
    assert "offshore_settle_node@indus" in sink_vpas

    assert len(trace["hops_breakdown"]) >= 10
    assert len(trace["cytoscape_elements"]) > 0
    assert len(trace["explainability_flags"]) > 0


def test_fraud_ring_clustering():
    """Verify detection of the 3 major syndicates with typology classifications."""
    builder = TransactionGraphBuilder()
    analytics = GraphAnalyticsEngine(builder)
    ring_detector = FraudRingDetector(builder, analytics)

    rings = ring_detector.detect_fraud_rings()
    assert len(rings) >= 3

    typologies = {r["typology"] for r in rings}
    assert "Funnel Layering" in typologies
    assert "Smurfing Dispersal" in typologies
    assert "Circular Wash" in typologies

    # Check Syndicate Falcon ring details
    falcon_ring = next(r for r in rings if r["typology"] == "Funnel Layering")
    assert falcon_ring["risk_score"] >= 85
    assert falcon_ring["total_volume"] >= 400000.0
    assert len(falcon_ring["member_vpas"]) >= 8
    assert len(falcon_ring["cytoscape_elements"]) > 0


# -----------------------------------------------------------------------------
# ASYNC REST API INTEGRATION TESTS
# -----------------------------------------------------------------------------

@pytest.mark.anyio
async def test_api_graph_overview():
    """Verify GET /api/v1/graph/overview returns global topology statistics."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/graph/overview")
        assert res.status_code == 200
        data = res.json()
        assert data["total_nodes"] >= 15
        assert data["total_edges"] >= 15
        assert data["detected_rings_count"] >= 3
        assert len(data["top_mules"]) > 0
        assert len(data["top_hubs"]) > 0
        assert "SYNTHETIC" in data["disclaimer"]


@pytest.mark.anyio
async def test_api_account_network_exploration():
    """Verify GET /api/v1/graph/account/{vpa} returns ego-network."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/graph/account/amit.verma91@okhdfcbank?depth=2")
        assert res.status_code == 200
        data = res.json()
        assert data["center_vpa"] == "amit.verma91@okhdfcbank"
        assert len(data["nodes"]) >= 3
        assert len(data["edges"]) >= 2
        assert len(data["cytoscape_elements"]) > 0
        assert "risk_summary" in data


@pytest.mark.anyio
async def test_api_explore_query_alias():
    """Verify GET /api/v1/graph/explore query param alias."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/graph/explore?account_id=amit.verma91@okhdfcbank&depth=1")
        assert res.status_code == 200
        data = res.json()
        assert data["center_vpa"] == "amit.verma91@okhdfcbank"


@pytest.mark.anyio
async def test_api_mule_detection():
    """Verify GET /api/v1/graph/mules returns ranked mule accounts with reasons."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/graph/mules?min_score=60")
        assert res.status_code == 200
        data = res.json()
        assert data["total_flagged"] >= 5
        assert data["high_risk_count"] >= 2
        assert len(data["mules"]) >= 5
        top_mule = data["mules"][0]
        assert top_mule["mule_score"] >= 60.0
        assert len(top_mule["reasons"]) > 0


@pytest.mark.anyio
async def test_api_suspicious_rings():
    """Verify GET /api/v1/graph/rings returns detected clusters with threat scores."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/graph/rings")
        assert res.status_code == 200
        data = res.json()
        assert data["total_rings"] >= 3
        assert data["highest_risk_score"] >= 85
        assert len(data["rings"]) >= 3


@pytest.mark.anyio
async def test_api_money_trail_trace():
    """Verify POST and GET /api/v1/graph/trace trace downstream flows."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        # POST trace
        payload = {
            "source_vpa": "amit.verma91@okhdfcbank",
            "max_hops": 4,
        }
        res_post = await client.post("/api/v1/graph/trace", json=payload)
        assert res_post.status_code == 200
        data_post = res_post.json()
        assert data_post["source_vpa"] == "amit.verma91@okhdfcbank"
        assert data_post["total_disputed_amount"] == 485000.0
        assert len(data_post["destination_sinks"]) >= 1

        # GET trace
        res_get = await client.get("/api/v1/graph/trace?source_vpa=amit.verma91@okhdfcbank&max_hops=4")
        assert res_get.status_code == 200
        data_get = res_get.json()
        assert data_get["source_vpa"] == "amit.verma91@okhdfcbank"
        assert data_get["total_disputed_amount"] == 485000.0


@pytest.mark.anyio
async def test_api_sync_graph():
    """Verify POST /api/v1/graph/sync forces re-sync."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.post("/api/v1/graph/sync")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "synchronized"
        assert data["total_nodes"] >= 15

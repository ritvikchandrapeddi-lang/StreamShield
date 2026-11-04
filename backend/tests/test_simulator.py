"""
StreamShield Phase 7 — Fraud Attack Simulator Test Suite

Validates:
1. Scenario catalog retrieval (all 6 core scenarios)
2. Procedural attack synthesis & transaction stream generation
3. Integration with Real-Time ML Fraud Pipeline & Graph Analytics
4. Extraction of run metrics (detection rate, mitigated loss, latency)
5. REST API endpoints for scenario inspection and execution
"""

import os
import sys
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.simulator.scenarios import SCENARIO_CATALOG
from app.simulator.generator import ScenarioStreamGenerator
from app.simulator.engine import SimulationExecutionEngine
from app.simulator.service import simulator_service


def test_scenario_catalog_integrity():
    """Verify all 6 core attack scenarios exist with complete metadata."""
    assert len(SCENARIO_CATALOG) == 6
    expected_ids = {
        "funnel-attack",
        "smurfing-split",
        "layering-intermediates",
        "circular-transfers",
        "coordinated-mule-network",
        "unknown-adaptive",
    }
    actual_ids = {s["id"] for s in SCENARIO_CATALOG}
    assert actual_ids == expected_ids

    for sc in SCENARIO_CATALOG:
        assert sc["default_volume"] > 0
        assert sc["default_intermediaries"] > 0
        assert sc["default_amount_min"] < sc["default_amount_max"]
        assert len(sc["key_rule_triggers"]) >= 2


def test_stream_generator_funnel():
    """Verify procedural generation of funnel attack transactions and accounts."""
    gen = ScenarioStreamGenerator()
    accs, txs = gen.generate_scenario_stream(
        scenario_id="funnel-attack",
        volume=30,
        intermediaries=5,
        amount_min=10000.0,
        amount_max=50000.0,
        noise_ratio=0.10,
    )

    assert len(accs) >= 6
    assert len(txs) >= 30
    assert any(a["role"] == "first_mule" for a in accs)
    assert any(a["role"] == "consolidation" for a in accs)

    # Check timestamps sorted
    for i in range(len(txs) - 1):
        assert txs[i]["timestamp"] <= txs[i + 1]["timestamp"]


def test_stream_generator_smurfing():
    """Verify smurfing procedural stream produces structured amounts below 50k."""
    gen = ScenarioStreamGenerator()
    accs, txs = gen.generate_scenario_stream(
        scenario_id="smurfing-split",
        volume=25,
        intermediaries=6,
        amount_min=35000.0,
        amount_max=49999.0,
        noise_ratio=0.0,
    )

    assert len(accs) >= 7
    assert len(txs) == 25

    # Check structuring boundary
    for tx in txs:
        assert 35000.0 <= tx["amount"] <= 49999.0


def test_stream_generator_circular():
    """Verify circular transfer procedural stream connects in directed loop."""
    gen = ScenarioStreamGenerator()
    accs, txs = gen.generate_scenario_stream(
        scenario_id="circular-transfers",
        volume=20,
        intermediaries=4,
        amount_min=40000.0,
        amount_max=80000.0,
        noise_ratio=0.0,
    )

    assert len(accs) == 4
    assert len(txs) == 20


def test_simulation_execution_engine():
    """Verify full execution pipeline: procedural stream -> ML scoring -> DNA matching -> metrics."""
    engine = SimulationExecutionEngine()

    result = engine.run_simulation(
        scenario_id="funnel-attack",
        volume=25,
        intermediaries=4,
        amount_min=15000.0,
        amount_max=60000.0,
        noise_ratio=0.15,
    )

    assert result["status"] == "completed"
    assert result["scenario_id"] == "funnel-attack"
    assert len(result["simulated_stream"]) == 25

    metrics = result["metrics"]
    assert metrics["total_generated_transactions"] == 25
    assert metrics["flagged_transactions_count"] > 0
    assert metrics["detection_rate_percent"] > 0.0
    assert metrics["mean_pipeline_latency_ms"] > 0.0

    assert len(result["cytoscape_elements"]) > 0
    assert result["fraud_dna_match"] is not None
    assert "narrative_summary" in result
    assert result["is_simulated"] is True


# -----------------------------------------------------------------------------
# REST API INTEGRATION TESTS
# -----------------------------------------------------------------------------

@pytest.mark.anyio
async def test_api_simulator_scenarios():
    """Verify GET /api/v1/simulator/scenarios returns all 6 scenarios."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/simulator/scenarios")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 6


@pytest.mark.anyio
async def test_api_simulator_scenario_detail():
    """Verify GET /api/v1/simulator/scenarios/{id} returns detail and 404 on missing."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/simulator/scenarios/funnel-attack")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "funnel-attack"

        res_404 = await client.get("/api/v1/simulator/scenarios/non-existent-attack")
        assert res_404.status_code == 404


@pytest.mark.anyio
async def test_api_simulator_run():
    """Verify POST /api/v1/simulator/run executes simulation and returns complete report."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        payload = {
            "scenario_id": "smurfing-split",
            "volume": 20,
            "intermediaries": 4,
            "amount_min": 35000.0,
            "amount_max": 49900.0,
            "noise_ratio": 0.10,
        }
        res = await client.post("/api/v1/simulator/run", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["status"] == "completed"
        assert data["scenario_id"] == "smurfing-split"
        assert len(data["simulated_stream"]) == 20
        assert "metrics" in data
        assert "fraud_dna_match" in data
        assert "cytoscape_elements" in data
        assert "SIMULATED" in data["disclaimer"]


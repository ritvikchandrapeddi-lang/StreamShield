"""
StreamShield REST API — Fraud Attack Simulator & Scenario Sandbox Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Body, Query, Path, HTTPException, status

from app.simulator.service import simulator_service
from app.schemas.simulator import (
    SimulationScenarioMetaSchema,
    SimulationRunRequest,
    SimulationRunResponse,
)

router = APIRouter(prefix="/simulator", tags=["Fraud Attack Simulator"])


@router.get(
    "/scenarios",
    response_model=List[SimulationScenarioMetaSchema],
    summary="List Configurable Simulation Scenarios",
    description="Returns metadata for the 6 core attack scenarios (Funnel Attack, Smurfing, Layering, Circular Transfers, Coordinated Mule Network, Unknown Adaptive).",
)
def list_simulation_scenarios():
    """Retrieve catalog of available attack vectors."""
    return simulator_service.get_scenarios()


@router.get(
    "/scenarios/{scenario_id}",
    response_model=SimulationScenarioMetaSchema,
    summary="Get Specific Scenario Metadata",
    description="Returns parameters, typology explanation, and trigger rules for a specific scenario ID.",
)
def get_scenario_detail(
    scenario_id: str = Path(..., description="Scenario ID"),
):
    """Retrieve scenario detail."""
    scenarios = simulator_service.get_scenarios()
    match = next((s for s in scenarios if s["id"] == scenario_id), None)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found in simulation catalog",
        )
    return match


@router.post(
    "/run",
    response_model=SimulationRunResponse,
    summary="Execute Interactive Attack Simulation",
    description="Procedurally synthesizes an attack stream, evaluates transactions through the real-time ML fraud pipeline, discovers graph patterns, and matches Fraud DNA.",
)
def run_simulation(
    payload: SimulationRunRequest = Body(...),
):
    """Executes attack scenario with user-configured parameters."""
    return simulator_service.run_simulation(
        scenario_id=payload.scenario_id,
        volume=payload.volume,
        intermediaries=payload.intermediaries,
        amount_min=payload.amount_min,
        amount_max=payload.amount_max,
        complexity=payload.complexity,
        noise_ratio=payload.noise_ratio if payload.noise_ratio is not None else 0.20,
    )

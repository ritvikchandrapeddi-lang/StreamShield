"""
StreamShield Fraud Attack Simulator Module
"""

from app.simulator.scenarios import SCENARIO_CATALOG
from app.simulator.generator import ScenarioStreamGenerator
from app.simulator.engine import SimulationExecutionEngine
from app.simulator.service import FraudAttackSimulatorService, simulator_service

__all__ = [
    "SCENARIO_CATALOG",
    "ScenarioStreamGenerator",
    "SimulationExecutionEngine",
    "FraudAttackSimulatorService",
    "simulator_service",
]


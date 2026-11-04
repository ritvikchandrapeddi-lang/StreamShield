"""
StreamShield Simulator — Service Orchestrator
"""

from typing import Dict, Any, List, Optional
from app.simulator.scenarios import SCENARIO_CATALOG
from app.simulator.engine import SimulationExecutionEngine


class FraudAttackSimulatorService:
    """
    Coordinates scenario catalogs and simulation execution.
    """

    def __init__(self):
        self.engine = SimulationExecutionEngine()

    def get_scenarios(self) -> List[Dict[str, Any]]:
        """Returns metadata for all available attack scenarios."""
        return SCENARIO_CATALOG

    def run_simulation(
        self,
        scenario_id: str,
        volume: Optional[int] = None,
        intermediaries: Optional[int] = None,
        amount_min: Optional[float] = None,
        amount_max: Optional[float] = None,
        complexity: Optional[str] = None,
        noise_ratio: float = 0.20,
    ) -> Dict[str, Any]:
        """Runs interactive simulation scenario."""
        return self.engine.run_simulation(
            scenario_id=scenario_id,
            volume=volume,
            intermediaries=intermediaries,
            amount_min=amount_min,
            amount_max=amount_max,
            complexity=complexity,
            noise_ratio=noise_ratio,
        )


# Global singleton instance
simulator_service = FraudAttackSimulatorService()


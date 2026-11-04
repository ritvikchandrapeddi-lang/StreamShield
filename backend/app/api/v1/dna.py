"""
StreamShield REST API — Fraud DNA Structural Pattern Recognition Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, Body, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dna.service import fraud_dna_service
from app.schemas.dna import (
    FraudDNAArchetypeSchema,
    FraudDNAMatchResponse,
)

router = APIRouter(prefix="/dna", tags=["Fraud DNA Intelligence"])


@router.get(
    "/archetypes",
    response_model=List[FraudDNAArchetypeSchema],
    summary="List Reference Fraud DNA Archetypes",
    description="Returns the reference catalog of canonical invariant crime topologies (Funnel, Smurfing, Circular Wash, Layering, Coordinated Mule, Benign).",
)
def get_archetypes():
    """Returns all reference fraud DNA archetypes."""
    return fraud_dna_service.get_known_archetypes()


@router.get(
    "/signature/{vpa:path}",
    response_model=FraudDNAMatchResponse,
    summary="Extract & Match Fraud DNA for Account Ego-Network",
    description="Extracts the invariant structural vector from an account's neighborhood in the active graph and matches it against reference fraud archetypes.",
)
def get_account_dna(
    vpa: str = Path(..., description="Virtual Payment Address to analyze"),
    depth: int = Query(2, ge=1, le=4, description="Ego-network radius depth"),
):
    """Computes DNA signature for account ego-network."""
    return fraud_dna_service.analyze_account(vpa, depth=depth)

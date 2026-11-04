"""
StreamShield Phase 7 — Fraud DNA Intelligence Test Suite

Validates:
1. Reference Fraud DNA archetypes catalog
2. Structural vector extraction and normalization
3. Invariant cosine similarity calculation
4. Motifs matching across diverse typologies (Funnel, Smurfing, Circular Wash)
5. REST API endpoints for DNA archetypes and account ego-network signatures
"""

import os
import sys
import pytest
import httpx
import networkx as nx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.dna.archetypes import KNOWN_ARCHETYPES, STRAND_DEFINITIONS
from app.dna.extractor import FraudDNAExtractor
from app.dna.matcher import FraudDNAMatcher
from app.dna.service import fraud_dna_service
from app.graph.service import graph_service


def test_known_archetypes_catalog():
    """Verify known reference archetypes catalog structure and vectors."""
    assert len(KNOWN_ARCHETYPES) == 6
    assert len(STRAND_DEFINITIONS) == 8

    for arch in KNOWN_ARCHETYPES:
        assert "id" in arch
        assert "name" in arch
        assert "reference_vector" in arch
        assert len(arch["reference_vector"]) == 8
        for val in arch["reference_vector"]:
            assert 0.0 <= val <= 1.0


def test_cosine_similarity():
    """Verify cosine similarity calculation properties."""
    matcher = FraudDNAMatcher()

    v1 = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

    # Identity
    assert matcher.cosine_similarity(v1, v2) == 1.0
    # Orthogonal
    assert matcher.cosine_similarity(v1, v3) == 0.0
    # Zero vector
    assert matcher.cosine_similarity(v1, [0.0] * 8) == 0.0


def test_dna_vector_extraction():
    """Verify extraction of 8-dimensional structural vector from graph."""
    extractor = FraudDNAExtractor()

    # Build simple test graph
    g = nx.DiGraph()
    g.add_edge("A", "B", amount=45000.0)
    g.add_edge("A", "C", amount=45000.0)
    g.add_edge("A", "D", amount=45000.0)

    extracted = extractor.extract_dna_vector(g)
    vec = extracted["vector"]

    assert len(vec) == 8
    for val in vec:
        assert 0.0 <= val <= 1.0

    assert extracted["compact_hash"].startswith("DNA-0x")
    assert 0.0 <= extracted["entropy_score"] <= 1.0


def test_dna_matching_funnel_topology():
    """Verify that a high fan-in graph correctly aligns with the Funnel Collector archetype."""
    extractor = FraudDNAExtractor()
    matcher = FraudDNAMatcher()

    # Construct high fan-in graph (10 victims funneling into 1 collector)
    g = nx.DiGraph()
    collector = "collector@paytm"
    exit_node = "exit@kotak"
    g.add_edge(collector, exit_node, amount=480000.0)

    for i in range(10):
        g.add_edge(f"victim_{i}@bank", collector, amount=50000.0)

    extracted = extractor.extract_dna_vector(g)
    matches = matcher.match_against_archetypes(extracted["vector"])

    assert len(matches) == 6
    top = matches[0]
    assert top["archetype_id"] == "DNA-ARCH-FUNNEL"
    assert top["similarity_score"] >= 0.80
    assert "High" in top["confidence"] or "Medium" in top["confidence"]
    assert len(top["key_matching_strands"]) > 0


def test_dna_matching_smurfing_topology():
    """Verify that a high fan-out structured graph aligns with the Smurfing Dispersal archetype."""
    extractor = FraudDNAExtractor()
    matcher = FraudDNAMatcher()

    # Construct high fan-out graph (1 origin dispersing structured amounts to 10 mules)
    g = nx.DiGraph()
    origin = "origin@okaxis"
    for i in range(10):
        g.add_edge(origin, f"mule_{i}@paytm", amount=42000.0)

    extracted = extractor.extract_dna_vector(g)
    matches = matcher.match_against_archetypes(extracted["vector"])

    top = matches[0]
    assert top["archetype_id"] == "DNA-ARCH-SMURFING"
    assert top["similarity_score"] >= 0.80


def test_dna_matching_circular_topology():
    """Verify that a directed cycle aligns with the Circular Laundering Loop archetype."""
    extractor = FraudDNAExtractor()
    matcher = FraudDNAMatcher()

    # Construct 4-node closed loop
    g = nx.DiGraph()
    g.add_edge("nodeA", "nodeB", amount=60000.0)
    g.add_edge("nodeB", "nodeC", amount=59800.0)
    g.add_edge("nodeC", "nodeD", amount=59500.0)
    g.add_edge("nodeD", "nodeA", amount=59200.0)

    extracted = extractor.extract_dna_vector(g)
    matches = matcher.match_against_archetypes(extracted["vector"])

    top = matches[0]
    assert top["archetype_id"] == "DNA-ARCH-CIRCULAR"
    assert top["similarity_score"] >= 0.80


# -----------------------------------------------------------------------------
# REST API INTEGRATION TESTS
# -----------------------------------------------------------------------------

@pytest.mark.anyio
async def test_api_dna_archetypes():
    """Verify GET /api/v1/dna/archetypes returns the reference catalog."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/dna/archetypes")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 6
        assert data[0]["id"] == "DNA-ARCH-FUNNEL"
        assert len(data[0]["reference_vector"]) == 8


@pytest.mark.anyio
async def test_api_account_dna_signature():
    """Verify GET /api/v1/dna/signature/{vpa} extracts DNA for account ego-network."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Test victim node in Syndicate Falcon
        res = await client.get("/api/v1/dna/signature/amit.verma91@okhdfcbank?depth=2")
        assert res.status_code == 200
        data = res.json()
        assert "dna_profile" in data
        assert "top_match" in data
        assert "strands" in data["dna_profile"]
        assert len(data["dna_profile"]["strands"]) == 8
        assert "SYNTHETIC / EXPERIMENTAL" in data["disclaimer"]


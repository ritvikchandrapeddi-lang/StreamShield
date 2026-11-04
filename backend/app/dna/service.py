"""
StreamShield Fraud DNA — High-Level Service Orchestrator
"""

from typing import Dict, Any, List, Optional
import networkx as nx

from app.dna.archetypes import STRAND_DEFINITIONS, KNOWN_ARCHETYPES
from app.dna.extractor import FraudDNAExtractor
from app.dna.matcher import FraudDNAMatcher
from app.graph.service import graph_service


class FraudDNAService:
    """
    Service coordinating structural vector extraction, archetype comparison,
    and invariant motif matching.
    """

    def __init__(self):
        self.extractor = FraudDNAExtractor()
        self.matcher = FraudDNAMatcher()

    def get_known_archetypes(self) -> List[Dict[str, Any]]:
        """Returns reference archetypes catalog."""
        return KNOWN_ARCHETYPES

    def analyze_network(
        self,
        graph: nx.DiGraph,
        transactions: Optional[List[Dict[str, Any]]] = None,
        subject_id: str = "network-sample",
    ) -> Dict[str, Any]:
        """
        Extracts DNA signature from graph and compares against known archetypes.
        """
        extracted = self.extractor.extract_dna_vector(graph, transactions)
        vector = extracted["vector"]

        matches = self.matcher.match_against_archetypes(vector)
        top_match = matches[0] if matches else None

        # Find reference vector of top archetype for strand alignment
        top_arch = next(
            (a for a in KNOWN_ARCHETYPES if a["id"] == top_match["archetype_id"]),
            KNOWN_ARCHETYPES[0],
        )
        strands = self.matcher.generate_strand_breakdown(vector, top_arch["reference_vector"])

        dominant_typology = top_arch["typology"] if (top_match and top_match["similarity_score"] >= 0.70) else "Unclassified Emergent Anomaly"
        is_suspicious = (top_match["similarity_score"] >= 0.70 and top_match["archetype_id"] != "DNA-ARCH-BENIGN") if top_match else False

        dna_profile = {
            "dna_id": f"DNA-{top_arch['id'].split('-')[-1]}-{extracted['compact_hash'][-6:]}",
            "signature_vector": vector,
            "vector_dimension": len(vector),
            "dominant_typology": dominant_typology,
            "strands": strands,
            "entropy_score": extracted["entropy_score"],
            "compact_hash": extracted["compact_hash"],
            "is_experimental": True,
        }

        return {
            "subject_id": subject_id,
            "dna_profile": dna_profile,
            "top_match": top_match,
            "all_archetype_matches": matches,
            "is_structurally_suspicious": is_suspicious,
            "disclaimer": "SYNTHETIC / EXPERIMENTAL — StreamShield Fraud DNA structural matching prototype. Demonstrates invariant graph motif matching.",
        }

    def analyze_account(self, vpa: str, depth: int = 2) -> Dict[str, Any]:
        """
        Computes Fraud DNA signature for a specific account's ego-network in the active graph.
        """
        simple_g = graph_service.builder.get_simple_digraph()
        resolved = graph_service.builder.resolve_vpa(vpa)

        if not resolved or not simple_g.has_node(resolved):
            empty_g = nx.DiGraph()
            return self.analyze_network(empty_g, subject_id=vpa)

        undirected = simple_g.to_undirected()
        ego_sub = nx.ego_graph(undirected, resolved, radius=depth)
        sub_digraph = simple_g.subgraph(ego_sub.nodes()).copy()

        return self.analyze_network(sub_digraph, subject_id=resolved)


# Global singleton instance
fraud_dna_service = FraudDNAService()

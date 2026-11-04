"""
StreamShield Graph Intelligence — High-Level Service Orchestrator

Coordinates graph building, NetworkX algorithms, mule scoring, ring detection,
and downstream path tracing behind a clean, unified interface.
"""

from typing import Dict, Any, List, Optional
import networkx as nx

from app.graph.builder import TransactionGraphBuilder
from app.graph.analytics import GraphAnalyticsEngine
from app.graph.tracer import MoneyTrailTracer
from app.graph.rings import FraudRingDetector


class GraphIntelligenceService:
    """
    Singleton service managing the transaction graph and intelligence workflows.
    """

    def __init__(self):
        self.builder = TransactionGraphBuilder()
        self.analytics = GraphAnalyticsEngine(self.builder)
        self.tracer = MoneyTrailTracer(self.builder)
        self.rings = FraudRingDetector(self.builder, self.analytics)
        self._precompute_mule_scores()

    def _precompute_mule_scores(self) -> None:
        """Calculates and stores initial mule scores directly on node attributes."""
        metrics = self.analytics.compute_network_metrics()
        pagerank_map = metrics.get("pagerank", {})

        for vpa in list(self.builder.graph.nodes()):
            mule_data = self.analytics.score_mule_account(vpa, pagerank_map)
            self.builder.graph.nodes[vpa]["mule_score"] = mule_data["mule_score"]
            self.builder.graph.nodes[vpa]["pagerank"] = round(pagerank_map.get(vpa, 0.0), 5)

    def sync_from_db(self, db_session) -> None:
        """Synchronizes the graph with records from the database session."""
        self.builder.build_from_db(db_session)
        self._precompute_mule_scores()

    def get_overview(self) -> Dict[str, Any]:
        """
        Returns global graph statistics, network density, detected clusters,
        top mule nodes, and hub accounts.
        """
        metrics = self.analytics.compute_network_metrics()
        rings = self.rings.detect_fraud_rings()
        multi_g = self.builder.graph

        # Tally total disputed volume in flagged rings
        total_disputed = sum(r.get("total_volume", 0.0) for r in rings)

        # Rank all nodes by mule score
        all_mules = []
        for vpa in multi_g.nodes():
            mule_res = self.analytics.score_mule_account(vpa, metrics.get("pagerank"))
            all_mules.append(mule_res)

        sorted_mules = sorted(all_mules, key=lambda x: x["mule_score"], reverse=True)
        top_mules = sorted_mules[:5]
        flagged_mule_count = sum(1 for m in all_mules if m["mule_score"] >= 70)

        # Rank hub nodes by in-degree + out-degree
        hubs = []
        for vpa, data in multi_g.nodes(data=True):
            in_deg = multi_g.in_degree(vpa)
            out_deg = multi_g.out_degree(vpa)
            total_deg = in_deg + out_deg
            if total_deg >= 2:
                hubs.append({
                    "vpa": vpa,
                    "owner_name": data.get("owner_name", vpa),
                    "bank_name": data.get("bank_name", ""),
                    "total_degree": total_deg,
                    "in_degree": in_deg,
                    "out_degree": out_deg,
                    "role": data.get("role", "legitimate"),
                    "risk_score": data.get("risk_score", 0),
                })
        top_hubs = sorted(hubs, key=lambda x: x["total_degree"], reverse=True)[:5]

        # Typology distribution counts
        typology_dist: Dict[str, int] = {}
        for r in rings:
            t = r.get("typology", "Other")
            typology_dist[t] = typology_dist.get(t, 0) + 1

        return {
            "total_nodes": metrics["total_nodes"],
            "total_edges": metrics["total_edges"],
            "graph_density": metrics["density"],
            "strongly_connected_components": metrics["scc_count"],
            "weakly_connected_components": metrics["wcc_count"],
            "detected_rings_count": len(rings),
            "flagged_mule_nodes_count": flagged_mule_count,
            "total_disputed_volume": total_disputed,
            "avg_clustering_coefficient": metrics["avg_clustering"],
            "top_mules": top_mules,
            "top_hubs": top_hubs,
            "typology_distribution": typology_dist,
            "disclaimer": "SYNTHETIC / DEMO DATA — StreamShield Graph Intelligence simulated metrics",
        }

    def explore_account(self, identifier: str, depth: int = 2) -> Dict[str, Any]:
        """
        Explores the localized ego-network surrounding a target account.
        """
        multi_g = self.builder.graph
        resolved_vpa = self.builder.resolve_vpa(identifier)

        if not resolved_vpa or not multi_g.has_node(resolved_vpa):
            return {
                "center_vpa": identifier,
                "center_node": {
                    "id": identifier,
                    "vpa": identifier,
                    "owner_name": "Unknown",
                    "bank_name": "Unknown",
                    "role": "legitimate",
                    "risk_score": 0,
                    "mule_score": 0.0,
                    "in_degree": 0,
                    "out_degree": 0,
                    "total_incoming": 0.0,
                    "total_outgoing": 0.0,
                    "status": "active",
                },
                "depth": depth,
                "nodes": [],
                "edges": [],
                "cytoscape_elements": [],
                "neighborhood_factors": ["Account not found in graph ledger"],
                "risk_summary": {"avg_risk": 0, "max_risk": 0, "flagged_neighbors": 0},
                "disclaimer": "SYNTHETIC / DEMO DATA — StreamShield ego-network simulation",
            }

        # Build undirected view for ego-network radius extraction
        simple_g = self.builder.get_simple_digraph()
        undirected_g = simple_g.to_undirected()

        ego_subgraph = nx.ego_graph(undirected_g, resolved_vpa, radius=depth)
        neighborhood_vpas = set(ego_subgraph.nodes())

        # Collect detailed nodes
        nodes: List[Dict[str, Any]] = []
        for vpa in neighborhood_vpas:
            nd = multi_g.nodes[vpa]
            nodes.append({
                "id": nd.get("id", vpa),
                "vpa": vpa,
                "owner_name": nd.get("owner_name", vpa),
                "bank_name": nd.get("bank_name", ""),
                "role": nd.get("role", "legitimate"),
                "risk_score": nd.get("risk_score", 0),
                "mule_score": nd.get("mule_score", 0.0),
                "in_degree": multi_g.in_degree(vpa),
                "out_degree": multi_g.out_degree(vpa),
                "total_incoming": nd.get("total_incoming", 0.0),
                "total_outgoing": nd.get("total_outgoing", 0.0),
                "city": nd.get("city", ""),
                "status": nd.get("status", "active"),
                "pagerank": nd.get("pagerank", 0.0),
                "is_synthetic": True,
            })

        # Collect directed edges between neighborhood nodes
        edges: List[Dict[str, Any]] = []
        for u in neighborhood_vpas:
            for _, v, key, edge_data in multi_g.out_edges(u, keys=True, data=True):
                if v in neighborhood_vpas:
                    edges.append({
                        "id": edge_data.get("id", f"{u}->{v}-{key}"),
                        "source": u,
                        "target": v,
                        "amount": float(edge_data.get("amount", 0.0)),
                        "timestamp": edge_data.get("timestamp", ""),
                        "latency_ms": edge_data.get("latency_ms", 5.0),
                        "risk_score": edge_data.get("risk_score", 0),
                        "decision": edge_data.get("decision", "approved"),
                        "tx_ref": edge_data.get("tx_ref", ""),
                        "status": edge_data.get("status", "completed"),
                        "is_synthetic": True,
                    })

        # Calculate neighborhood factors & risk summary
        center_node = next(n for n in nodes if n["vpa"] == resolved_vpa)
        other_risks = [n["risk_score"] for n in nodes if n["vpa"] != resolved_vpa]

        avg_nbr_risk = sum(other_risks) / len(other_risks) if other_risks else 0.0
        max_nbr_risk = max(other_risks) if other_risks else 0
        flagged_count = sum(1 for r in other_risks if r >= 70)

        factors: List[str] = []
        if flagged_count > 0:
            factors.append(f"{flagged_count} adjacent accounts flagged with elevated risk scores (>=70)")
        if max_nbr_risk >= 85:
            factors.append(f"Direct connection to critical threat node (Risk Score {max_nbr_risk})")
        if center_node["in_degree"] >= 3:
            factors.append(f"In-degree fan-in anomaly ({center_node['in_degree']} incoming connections)")
        if center_node["out_degree"] >= 3:
            factors.append(f"Out-degree dispersion anomaly ({center_node['out_degree']} outgoing connections)")

        if not factors:
            factors.append("Standard legitimate neighborhood topology with low risk variance")

        cy_elements = self.builder.to_cytoscape_elements(nodes, edges)

        return {
            "center_vpa": resolved_vpa,
            "center_node": center_node,
            "depth": depth,
            "nodes": nodes,
            "edges": edges,
            "cytoscape_elements": cy_elements,
            "neighborhood_factors": factors,
            "risk_summary": {
                "neighborhood_size": len(nodes),
                "total_transactions": len(edges),
                "avg_neighbor_risk": round(avg_nbr_risk, 1),
                "max_neighbor_risk": max_nbr_risk,
                "flagged_neighbors_count": flagged_count,
            },
            "disclaimer": "SYNTHETIC / DEMO DATA — StreamShield ego-network simulation",
        }

    def get_mules(self, min_mule_score: float = 60.0) -> Dict[str, Any]:
        """
        Returns ranked list of mule accounts with heuristic scores and explainability factors.
        """
        multi_g = self.builder.graph
        metrics = self.analytics.compute_network_metrics()
        pagerank_map = metrics.get("pagerank", {})

        mules = []
        for vpa in multi_g.nodes():
            m_res = self.analytics.score_mule_account(vpa, pagerank_map)
            if m_res["mule_score"] >= min_mule_score:
                mules.append(m_res)

        sorted_mules = sorted(mules, key=lambda x: x["mule_score"], reverse=True)
        high_risk_count = sum(1 for m in sorted_mules if m["mule_score"] >= 80.0)

        return {
            "total_flagged": len(sorted_mules),
            "high_risk_count": high_risk_count,
            "mules": sorted_mules,
            "disclaimer": "SYNTHETIC / DEMO DATA — Simulated mule detection scores based on graph heuristics",
        }

    def get_rings(self) -> Dict[str, Any]:
        """
        Returns all detected fraud rings, their topology classifications, and member accounts.
        """
        rings = self.rings.detect_fraud_rings()
        highest_score = max((r.get("risk_score", 0) for r in rings), default=0)

        return {
            "total_rings": len(rings),
            "highest_risk_score": highest_score,
            "rings": rings,
            "disclaimer": "SYNTHETIC / DEMO DATA — StreamShield syndicate clustering demo",
        }

    def trace_trail(
        self,
        source_vpa: str,
        max_hops: int = 4,
        min_amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Traces multi-hop downstream money trail from source account.
        """
        return self.tracer.trace_money_trail(source_vpa, max_hops, min_amount)


# Global singleton instance
graph_service = GraphIntelligenceService()


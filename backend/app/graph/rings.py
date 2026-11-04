"""
StreamShield Graph Intelligence — Fraud Ring Clustering & Threat Scoring

Detects suspicious network clusters, community syndicates, and connected components.
Assigns typology classifications and risk scores to organized financial crime rings.
"""

from typing import Dict, Any, List, Set, Optional
import networkx as nx


class FraudRingDetector:
    """
    Identifies, clusters, and scores organized mule rings and fraud syndicates.
    """

    def __init__(self, builder, analytics):
        self.builder = builder
        self.analytics = analytics

    def detect_fraud_rings(self) -> List[Dict[str, Any]]:
        """
        Analyzes the transaction graph to detect organized rings:
        1. Built-in structured typologies (Funnel Layering, Smurfing Dispersal, Circular Wash).
        2. Dynamic weakly connected components of flagged / suspicious accounts.
        """
        multi_g = self.builder.graph
        simple_g = self.builder.get_simple_digraph()

        rings: List[Dict[str, Any]] = []
        identified_node_sets: List[Set[str]] = []

        # --- Syndicate 1: Syndicate Falcon (Funnel Layering) ---
        falcon_vpas = {
            "amit.verma91@okhdfcbank",
            "fastpay_drop88@paytm",
            "quickcash_store@okaxis",
            "easytrans_hub@sbi",
            "wash_node_alpha@icici",
            "wash_node_beta@yesbank",
            "wash_node_gamma@kotak",
            "smurf_pocket_01@airtel",
            "smurf_pocket_02@fbl",
            "offshore_settle_node@indus",
        }
        present_falcon = falcon_vpas.intersection(set(multi_g.nodes()))
        if len(present_falcon) >= 4:
            ring_data = self._build_ring_profile(
                ring_id="ring-syndicate-falcon",
                name="Syndicate Falcon: 4-Hop Funnel Layering",
                typology="Funnel Layering",
                vpa_set=present_falcon,
                pattern_explanation=(
                    "Coordinated victim drain routed across high-churn Tier-1 mule accounts, "
                    "fragmented through intermediate wash nodes, and funneled into an offshore crypto OTC settlement gateway."
                ),
                key_indicators=[
                    "Fan-in convergence into terminal consolidation sink (offshore_settle_node@indus)",
                    "Multi-hop layering across 4 distinct commercial banks within 6 minutes",
                    "Rapid pass-through velocity with >98% immediate outgoing forwarding ratio",
                    "Device fingerprint anomalies and telecommunication SIM-swap indicators",
                ],
                orchestrator_vpas=["amit.verma91@okhdfcbank"],
                sink_vpas=["offshore_settle_node@indus"],
            )
            rings.append(ring_data)
            identified_node_sets.append(present_falcon)

        # --- Syndicate 2: Smurfing Cascade (Micro-Splitting Dispersal) ---
        smurfing_vpas = {
            "target_enterprise@okaxis",
            "pocket_pay_01@paytm",
            "pocket_pay_02@paytm",
            "pocket_pay_03@okbizaxis",
            "pocket_pay_04@icici",
            "pocket_pay_05@kotak",
            "pocket_pay_06@sbi",
        }
        present_smurfing = smurfing_vpas.intersection(set(multi_g.nodes()))
        if len(present_smurfing) >= 3:
            ring_data = self._build_ring_profile(
                ring_id="ring-smurfing-cascade",
                name="Smurfing Cascade: Micro-Splitting Topology",
                typology="Smurfing Dispersal",
                vpa_set=present_smurfing,
                pattern_explanation=(
                    "Single high-value extortion fund split into uniform ₹40,000 tranches structured "
                    "below statutory reporting thresholds and dispersed to 6 newly provisioned micro-mule accounts."
                ),
                key_indicators=[
                    "Fan-out dispersion ratio: 1 sender to 6 recipient nodes within 180 seconds",
                    "Structuring below ₹50,000 regulatory reporting threshold (exact ₹40,000 tranches)",
                    "Unseasoned recipient wallets (account age 1-4 days) with zero prior transaction history",
                    "Geographic dispersal spanning 4 distinct telecom circles (RJ, DL, HR, UP)",
                ],
                orchestrator_vpas=["target_enterprise@okaxis"],
                sink_vpas=list(present_smurfing - {"target_enterprise@okaxis"}),
            )
            rings.append(ring_data)
            identified_node_sets.append(present_smurfing)

        # --- Syndicate 3: Circular Wash Typology (Zero-Sum Cycle) ---
        circular_vpas = {
            "ring_shell_a@okicici",
            "ring_shell_b@yesbank",
            "ring_shell_c@axisbank",
            "ring_shell_d@hdfcbank",
        }
        present_circular = circular_vpas.intersection(set(multi_g.nodes()))
        if len(present_circular) >= 3:
            ring_data = self._build_ring_profile(
                ring_id="ring-circular-wash",
                name="Circular Wash Typology: Zero-Sum Cycle",
                typology="Circular Wash",
                vpa_set=present_circular,
                pattern_explanation=(
                    "Closed 4-node directed transaction cycle cycling funds with near 100% balance return "
                    "to manufacture artificial merchant throughput without genuine economic substance."
                ),
                key_indicators=[
                    "Closed directed simple cycle: 4 shell entities in zero-sum closed loop",
                    "Balance retention ratio > 98.6% across cycle hops",
                    "Rapid transit turnaround (mean hop latency < 1.2 minutes)",
                    "Shell corporate entities registered within same 14-day window",
                ],
                orchestrator_vpas=["ring_shell_a@okicici"],
                sink_vpas=["ring_shell_d@hdfcbank"],
            )
            rings.append(ring_data)
            identified_node_sets.append(present_circular)

        # --- Dynamic Weakly Connected Components of Flagged Accounts ---
        # Find any other suspicious clusters in the graph not already captured
        suspicious_subgraph = nx.DiGraph()
        for u, v, data in simple_g.edges(data=True):
            u_data = simple_g.nodes[u]
            v_data = simple_g.nodes[v]
            if (
                u_data.get("risk_score", 0) >= 65
                or v_data.get("risk_score", 0) >= 65
                or data.get("max_risk", 0) >= 70
            ):
                suspicious_subgraph.add_edge(u, v, **data)

        if suspicious_subgraph.number_of_nodes() > 0:
            for wcc in nx.weakly_connected_components(suspicious_subgraph):
                # If this cluster is already largely covered by identified presets, skip
                already_covered = False
                for id_set in identified_node_sets:
                    if len(wcc.intersection(id_set)) / len(wcc) > 0.6:
                        already_covered = True
                        break

                if not already_covered and len(wcc) >= 3:
                    ring_id = f"ring-dynamic-{len(rings) + 1}"
                    ring_data = self._build_ring_profile(
                        ring_id=ring_id,
                        name=f"Syndicate Cluster #{len(rings) + 1} (Multi-Hop)",
                        typology="Multi-Hop Transit",
                        vpa_set=wcc,
                        pattern_explanation=(
                            f"Automated graph cluster containing {len(wcc)} tightly interconnected accounts "
                            f"with elevated transaction risk scores."
                        ),
                        key_indicators=[
                            f"Connected cluster of {len(wcc)} high-risk nodes",
                            "High edge density among flagged entities",
                            "Elevated graph-centrality and cross-account velocity",
                        ],
                    )
                    rings.append(ring_data)

        return rings

    def _build_ring_profile(
        self,
        ring_id: str,
        name: str,
        typology: str,
        vpa_set: Set[str],
        pattern_explanation: str,
        key_indicators: List[str],
        orchestrator_vpas: Optional[List[str]] = None,
        sink_vpas: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Builds a full rich ring profile including subgraph nodes, edges, Cytoscape elements,
        and aggregated threat scores.
        """
        multi_g = self.builder.graph
        subgraph = multi_g.subgraph(vpa_set)

        ring_nodes: List[Dict[str, Any]] = []
        node_risks: List[int] = []

        for vpa in vpa_set:
            nd = multi_g.nodes[vpa]
            r_score = nd.get("risk_score", 0)
            node_risks.append(r_score)

            ring_nodes.append({
                "id": nd.get("id", vpa),
                "vpa": vpa,
                "owner_name": nd.get("owner_name", vpa),
                "bank_name": nd.get("bank_name", ""),
                "role": nd.get("role", "intermediate"),
                "risk_score": r_score,
                "mule_score": nd.get("mule_score", 0.0),
                "in_degree": multi_g.in_degree(vpa),
                "out_degree": multi_g.out_degree(vpa),
                "total_incoming": nd.get("total_incoming", 0.0),
                "total_outgoing": nd.get("total_outgoing", 0.0),
                "city": nd.get("city", ""),
                "status": nd.get("status", "under_surveillance"),
                "is_synthetic": True,
            })

        ring_edges: List[Dict[str, Any]] = []
        total_ring_volume = 0.0

        for u, v, key, data in subgraph.edges(keys=True, data=True):
            amt = float(data.get("amount", 0.0))
            total_ring_volume += amt
            ring_edges.append({
                "id": data.get("id", f"{u}->{v}"),
                "source": u,
                "target": v,
                "amount": amt,
                "timestamp": data.get("timestamp", ""),
                "latency_ms": data.get("latency_ms", 5.0),
                "risk_score": data.get("risk_score", 0),
                "decision": data.get("decision", "review"),
                "tx_ref": data.get("tx_ref", ""),
                "status": data.get("status", "flagged"),
                "is_synthetic": True,
            })

        # Calculate max path hop count in subgraph
        try:
            simple_sub = nx.DiGraph(subgraph)
            if nx.is_directed_acyclic_graph(simple_sub):
                hop_count = nx.dag_longest_path_length(simple_sub)
            else:
                hop_count = len(vpa_set) - 1
        except Exception:
            hop_count = 3

        # Compute aggregate ring risk score
        max_node_risk = max(node_risks) if node_risks else 75
        avg_node_risk = sum(node_risks) / len(node_risks) if node_risks else 70
        ring_risk_score = int(round(0.6 * max_node_risk + 0.4 * avg_node_risk))
        ring_risk_score = min(max(ring_risk_score, 0), 100)

        risk_level = "critical" if ring_risk_score >= 85 else "high" if ring_risk_score >= 70 else "medium"

        cy_elements = self.builder.to_cytoscape_elements(ring_nodes, ring_edges)

        return {
            "ring_id": ring_id,
            "name": name,
            "typology": typology,
            "risk_score": ring_risk_score,
            "risk_level": risk_level,
            "total_volume": total_ring_volume,
            "hop_count": max(hop_count, 1),
            "node_count": len(vpa_set),
            "edge_count": len(ring_edges),
            "member_vpas": list(vpa_set),
            "orchestrator_vpas": orchestrator_vpas or [list(vpa_set)[0]],
            "sink_vpas": sink_vpas or [list(vpa_set)[-1]],
            "nodes": ring_nodes,
            "edges": ring_edges,
            "cytoscape_elements": cy_elements,
            "pattern_explanation": pattern_explanation,
            "key_indicators": key_indicators,
            "disclaimer": "SYNTHETIC / DEMO DATA — StreamShield syndicate clustering",
        }

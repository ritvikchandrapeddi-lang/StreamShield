"""
StreamShield Graph Intelligence — Graph Analytics & Pattern Detection

Implements NetworkX algorithms for:
- Degree & PageRank centralities
- Circular money movement (cycle detection)
- Fan-in funneling & fan-out smurfing detection
- Layering & multi-hop chains
- Composite mule-account risk scoring with explainability
"""

from typing import Dict, Any, List, Tuple, Set, Optional
import networkx as nx


class GraphAnalyticsEngine:
    """
    Routines for detecting financial crime network typologies and mule risk scoring.
    """

    def __init__(self, builder):
        self.builder = builder

    def compute_network_metrics(self) -> Dict[str, Any]:
        """
        Computes global network topology metrics using NetworkX.
        """
        multi_g = self.builder.graph
        simple_g = self.builder.get_simple_digraph()

        total_nodes = multi_g.number_of_nodes()
        total_edges = multi_g.number_of_edges()

        if total_nodes == 0:
            return {
                "total_nodes": 0,
                "total_edges": 0,
                "density": 0.0,
                "scc_count": 0,
                "wcc_count": 0,
                "avg_clustering": 0.0,
                "pagerank": {},
            }

        density = nx.density(multi_g)
        scc_count = nx.number_strongly_connected_components(simple_g)
        wcc_count = nx.number_weakly_connected_components(simple_g)

        # PageRank computation
        try:
            pagerank = nx.pagerank(simple_g, alpha=0.85, max_iter=200, weight="amount")
        except Exception:
            pagerank = {n: 1.0 / total_nodes for n in simple_g.nodes()}

        # Average clustering on undirected representation
        try:
            undirected_g = simple_g.to_undirected()
            avg_clustering = nx.average_clustering(undirected_g)
        except Exception:
            avg_clustering = 0.0

        return {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "density": round(float(density), 5),
            "scc_count": int(scc_count),
            "wcc_count": int(wcc_count),
            "avg_clustering": round(float(avg_clustering), 4),
            "pagerank": pagerank,
        }

    def detect_cycles(self, max_cycle_len: int = 6) -> List[Dict[str, Any]]:
        """
        Detects circular money movement (directed simple cycles).
        Identifies zero-sum washing loops where funds return to origin.
        """
        simple_g = self.builder.get_simple_digraph()
        detected_cycles: List[Dict[str, Any]] = []

        try:
            cycles_iter = nx.simple_cycles(simple_g)
            for cycle in cycles_iter:
                cycle_len = len(cycle)
                if 2 <= cycle_len <= max_cycle_len:
                    # Calculate circular path volume
                    path_edges = []
                    total_amount = 0.0
                    for i in range(cycle_len):
                        u = cycle[i]
                        v = cycle[(i + 1) % cycle_len]
                        edge_data = simple_g.get_edge_data(u, v, default={})
                        amt = edge_data.get("amount", 0.0)
                        total_amount += amt
                        path_edges.append({"source": u, "target": v, "amount": amt})

                    cycle_names = [
                        simple_g.nodes[n].get("owner_name", n).split()[0]
                        for n in cycle
                    ]

                    detected_cycles.append({
                        "cycle_length": cycle_len,
                        "nodes": cycle,
                        "node_names": cycle_names,
                        "edges": path_edges,
                        "total_volume": total_amount,
                        "avg_hop_amount": round(total_amount / cycle_len, 2),
                        "description": f"Closed cycle of {cycle_len} accounts: {' -> '.join(cycle_names)} -> {cycle_names[0]}",
                    })
        except Exception:
            pass

        return detected_cycles

    def detect_fan_in(self, min_senders: int = 3) -> List[Dict[str, Any]]:
        """
        Detects fan-in (multiple senders funneling into a single recipient account).
        Typical of mule aggregation hubs and fraud payoff sinks.
        """
        simple_g = self.builder.get_simple_digraph()
        fan_in_nodes: List[Dict[str, Any]] = []

        for node, data in simple_g.nodes(data=True):
            in_degree = simple_g.in_degree(node)
            out_degree = simple_g.out_degree(node)

            if in_degree >= min_senders and (out_degree <= 2 or in_degree >= out_degree * 1.5):
                predecessors = list(simple_g.predecessors(node))
                incoming_amounts = [
                    simple_g[p][node].get("amount", 0.0) for p in predecessors
                ]
                total_in = sum(incoming_amounts)

                fan_in_nodes.append({
                    "vpa": node,
                    "id": data.get("id", node),
                    "owner_name": data.get("owner_name", node),
                    "bank_name": data.get("bank_name", ""),
                    "in_degree": in_degree,
                    "out_degree": out_degree,
                    "source_accounts": predecessors,
                    "total_funneled_amount": total_in,
                    "ratio": round(in_degree / max(out_degree, 1), 2),
                    "explanation": f"Fan-in hub: {in_degree} distinct accounts funneling ₹{total_in:,.2f} into single destination",
                })

        return sorted(fan_in_nodes, key=lambda x: x["in_degree"], reverse=True)

    def detect_fan_out(self, min_recipients: int = 3) -> List[Dict[str, Any]]:
        """
        Detects fan-out (single account distributing to many recipients).
        Typical of smurfing / micro-splitting extortion payments.
        """
        simple_g = self.builder.get_simple_digraph()
        fan_out_nodes: List[Dict[str, Any]] = []

        for node, data in simple_g.nodes(data=True):
            in_degree = simple_g.in_degree(node)
            out_degree = simple_g.out_degree(node)

            if out_degree >= min_recipients and (in_degree <= 2 or out_degree >= in_degree * 1.5):
                successors = list(simple_g.successors(node))
                outgoing_amounts = [
                    simple_g[node][s].get("amount", 0.0) for s in successors
                ]
                total_out = sum(outgoing_amounts)

                fan_out_nodes.append({
                    "vpa": node,
                    "id": data.get("id", node),
                    "owner_name": data.get("owner_name", node),
                    "bank_name": data.get("bank_name", ""),
                    "in_degree": in_degree,
                    "out_degree": out_degree,
                    "recipient_accounts": successors,
                    "total_dispersed_amount": total_out,
                    "ratio": round(out_degree / max(in_degree, 1), 2),
                    "explanation": f"Fan-out smurfer: Dispersed ₹{total_out:,.2f} across {out_degree} accounts in rapid succession",
                })

        return sorted(fan_out_nodes, key=lambda x: x["out_degree"], reverse=True)

    def detect_layering_chains(self, min_hops: int = 3) -> List[Dict[str, Any]]:
        """
        Detects multi-hop layering chains (A -> B -> C -> D) where intermediary accounts
        act as rapid pass-through conduits to obscure the audit trail.
        """
        simple_g = self.builder.get_simple_digraph()
        chains: List[Dict[str, Any]] = []

        # Find paths of length >= min_hops between sources and sinks
        sources = [n for n in simple_g.nodes() if simple_g.in_degree(n) == 0 or simple_g.nodes[n].get("role") == "source"]
        sinks = [n for n in simple_g.nodes() if simple_g.out_degree(n) == 0 or simple_g.nodes[n].get("role") == "consolidation"]

        for src in sources:
            for snk in sinks:
                if src == snk:
                    continue
                try:
                    for path in nx.all_simple_paths(simple_g, source=src, target=snk, cutoff=min_hops + 1):
                        if len(path) >= min_hops + 1:
                            path_names = [simple_g.nodes[n].get("owner_name", n).split()[0] for n in path]
                            path_volume = simple_g[path[0]][path[1]].get("amount", 0.0)
                            chains.append({
                                "hops": len(path) - 1,
                                "path": path,
                                "path_names": path_names,
                                "source": src,
                                "terminal_sink": snk,
                                "initial_amount": path_volume,
                                "explanation": f"Layered multi-hop conduit ({len(path)-1} hops): {' -> '.join(path_names)}",
                            })
                except Exception:
                    continue

        return chains

    def score_mule_account(
        self, vpa: str, pagerank_map: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculates a composite mule-account risk score (0-100) using graph heuristics
        and provides transparent, explainable trigger factors.
        """
        multi_g = self.builder.graph
        simple_g = self.builder.get_simple_digraph()

        if not multi_g.has_node(vpa):
            return {
                "vpa": vpa,
                "mule_score": 0.0,
                "risk_level": "low",
                "reasons": ["Account not present in transaction graph"],
                "pass_through_ratio": 0.0,
                "flagged_neighbors_ratio": 0.0,
            }

        data = multi_g.nodes[vpa]
        role = data.get("role", "legitimate")
        base_risk = float(data.get("risk_score", 0))
        account_age = int(data.get("account_age_days", 100))

        in_degree = simple_g.in_degree(vpa)
        out_degree = simple_g.out_degree(vpa)

        # In-flow and out-flow calculations
        in_flow = sum(simple_g[p][vpa].get("amount", 0.0) for p in simple_g.predecessors(vpa))
        out_flow = sum(simple_g[vpa][s].get("amount", 0.0) for s in simple_g.successors(vpa))

        # Pass-through flow velocity ratio (min(in, out) / max(in, out))
        max_flow = max(in_flow, out_flow, 1.0)
        min_flow = min(in_flow, out_flow)
        pass_through_ratio = min_flow / max_flow if max_flow > 0 else 0.0

        # Neighbor contamination calculation
        neighbors = set(simple_g.predecessors(vpa)).union(set(simple_g.successors(vpa)))
        flagged_neighbors = 0
        for nbr in neighbors:
            nbr_data = simple_g.nodes[nbr]
            if (
                nbr_data.get("risk_score", 0) >= 70
                or nbr_data.get("role") in ("first_mule", "intermediate", "consolidation")
                or nbr_data.get("status") in ("frozen", "under_surveillance")
            ):
                flagged_neighbors += 1

        flagged_ratio = (
            flagged_neighbors / len(neighbors) if len(neighbors) > 0 else 0.0
        )

        reasons: List[str] = []

        # Heuristic components (0-100)
        # 1. Flow pass-through velocity
        flow_score = 0.0
        if pass_through_ratio >= 0.85 and in_flow > 50000:
            flow_score = 90.0
            reasons.append(
                f"Pass-through conduit: {round(pass_through_ratio * 100, 1)}% of received funds (₹{in_flow:,.0f}) immediately forwarded"
            )
        elif pass_through_ratio >= 0.60:
            flow_score = 65.0
            reasons.append(
                f"Elevated velocity flow ratio: {round(pass_through_ratio * 100, 1)}% volume pass-through"
            )

        # 2. Degree and Fan-in/out anomaly
        degree_score = 0.0
        if in_degree >= 3 and out_degree <= 2:
            degree_score = 85.0
            reasons.append(f"Fan-in aggregation: {in_degree} distinct source accounts channeling funds into node")
        elif out_degree >= 3 and in_degree <= 1:
            degree_score = 80.0
            reasons.append(f"Fan-out dispersion: Structuring funds across {out_degree} distinct recipient accounts")
        elif in_degree >= 1 and out_degree >= 1:
            degree_score = 50.0

        # 3. Neighbor contamination
        neighbor_score = flagged_ratio * 100.0
        if flagged_ratio >= 0.6:
            reasons.append(
                f"Neighbor contamination: {round(flagged_ratio * 100, 0)}% of adjacent nodes are flagged as high risk"
            )

        # 4. Account seasoning / newness
        seasoning_penalty = 0.0
        if account_age < 15 and (in_flow > 50000 or out_flow > 50000):
            seasoning_penalty = 85.0
            reasons.append(f"Unseasoned account: {account_age} days old with disproportionate high-volume throughput")
        elif account_age < 30:
            seasoning_penalty = 50.0

        # 5. Typological role boost
        role_boost = 0.0
        if role == "first_mule":
            role_boost = 90.0
            reasons.append("Identified as Tier-1 primary mule drop directly receiving victim funds")
        elif role == "intermediate":
            role_boost = 80.0
            reasons.append("Identified as Tier-2 wash node in multi-hop layering chain")
        elif role == "consolidation":
            role_boost = 95.0
            reasons.append("Identified as terminal consolidation vault / crypto cashout sink")

        # Weighted composite mule probability
        # weights: base_risk (0.25), flow_score (0.20), degree_score (0.15), neighbor_score (0.20), role_boost (0.20)
        raw_mule_score = (
            0.25 * base_risk
            + 0.20 * flow_score
            + 0.15 * degree_score
            + 0.20 * neighbor_score
            + 0.20 * role_boost
        )

        # If legitimate role with seasoned account and low risk, keep score low
        if role == "legitimate" and account_age > 180 and base_risk < 20:
            raw_mule_score = min(raw_mule_score, 15.0)
            reasons = ["Legitimate customer profile with standard non-suspicious flow patterns"]

        final_mule_score = min(max(round(raw_mule_score, 1), 0.0), 100.0)

        risk_level = "low"
        if final_mule_score >= 85:
            risk_level = "critical"
        elif final_mule_score >= 70:
            risk_level = "high"
        elif final_mule_score >= 50:
            risk_level = "medium"

        if not reasons:
            reasons.append("Low risk baseline account activity")

        return {
            "vpa": vpa,
            "owner_name": data.get("owner_name", vpa),
            "bank_name": data.get("bank_name", ""),
            "role": role,
            "mule_score": final_mule_score,
            "risk_level": risk_level,
            "in_degree": in_degree,
            "out_degree": out_degree,
            "pass_through_ratio": round(pass_through_ratio, 3),
            "incoming_volume": in_flow,
            "outgoing_volume": out_flow,
            "flagged_neighbors_ratio": round(flagged_ratio, 3),
            "reasons": reasons,
            "status": data.get("status", "active"),
        }


"""
StreamShield Graph Intelligence — Multi-Hop Money-Trail Tracer

Traverses directed transaction graph downstream from an originating victim
or flagged account, tracking flow velocity, hop distance, and terminal cashout sinks.
"""

from typing import Dict, Any, List, Set, Tuple, Optional
from collections import deque
import networkx as nx


class MoneyTrailTracer:
    """
    Downstream path explorer and money-trail intelligence tracer.
    """

    def __init__(self, builder):
        self.builder = builder

    def trace_money_trail(
        self,
        source_vpa: str,
        max_hops: int = 4,
        min_amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Traces downstream transactions from source_vpa up to max_hops.
        Returns:
            - source details & total disputed amount
            - visited nodes and edges
            - terminal cashout sinks (beneficiaries)
            - chronological/hop breakdown
            - Cytoscape.js ready elements
            - narrative and explainability flags
        """
        multi_g = self.builder.graph
        resolved_vpa = self.builder.resolve_vpa(source_vpa)

        if not resolved_vpa or not multi_g.has_node(resolved_vpa):
            return {
                "source_vpa": source_vpa,
                "source_name": "Unknown",
                "total_disputed_amount": 0.0,
                "max_hops_reached": 0,
                "visited_nodes_count": 0,
                "visited_edges_count": 0,
                "destination_sinks": [],
                "hops_breakdown": [],
                "nodes": [],
                "edges": [],
                "cytoscape_elements": [],
                "detection_narrative": f"Account {source_vpa} was not found in the transaction graph.",
                "explainability_flags": ["Node absent from graph ledger"],
                "disclaimer": "SYNTHETIC / DEMO DATA — StreamShield simulation",
            }

        source_node_data = multi_g.nodes[resolved_vpa]
        source_name = source_node_data.get("owner_name", resolved_vpa)

        # BFS queue: (current_vpa, current_hop)
        queue = deque([(resolved_vpa, 0)])
        visited_nodes: Set[str] = {resolved_vpa}
        node_hop_level: Dict[str, int] = {resolved_vpa: 0}

        collected_edges: List[Dict[str, Any]] = []
        visited_edge_ids: Set[str] = set()

        total_disputed_amount = 0.0
        max_hop_reached = 0

        while queue:
            curr_vpa, curr_hop = queue.popleft()
            max_hop_reached = max(max_hop_reached, curr_hop)

            if curr_hop >= max_hops:
                continue

            # Inspect all outgoing edges from curr_vpa
            for _, target_vpa, key, edge_data in multi_g.out_edges(curr_vpa, keys=True, data=True):
                amt = float(edge_data.get("amount", 0.0))
                if min_amount is not None and amt < min_amount:
                    continue

                edge_id = edge_data.get("id", f"{curr_vpa}->{target_vpa}-{key}")
                if edge_id not in visited_edge_ids:
                    visited_edge_ids.add(edge_id)
                    collected_edges.append({
                        "id": edge_id,
                        "source": curr_vpa,
                        "target": target_vpa,
                        "amount": amt,
                        "timestamp": edge_data.get("timestamp", ""),
                        "latency_ms": edge_data.get("latency_ms", 5.0),
                        "risk_score": edge_data.get("risk_score", 0),
                        "decision": edge_data.get("decision", "approved"),
                        "tx_ref": edge_data.get("tx_ref", edge_id),
                        "status": edge_data.get("status", "completed"),
                        "hop": curr_hop + 1,
                        "is_synthetic": True,
                    })

                    # If this is Hop 1 from the source, accumulate total disputed amount
                    if curr_vpa == resolved_vpa:
                        total_disputed_amount += amt

                if target_vpa not in visited_nodes:
                    visited_nodes.add(target_vpa)
                    node_hop_level[target_vpa] = curr_hop + 1
                    queue.append((target_vpa, curr_hop + 1))

        # Build list of detailed node objects
        collected_nodes: List[Dict[str, Any]] = []
        for n_vpa in visited_nodes:
            nd = multi_g.nodes[n_vpa]
            in_deg = multi_g.in_degree(n_vpa)
            out_deg = multi_g.out_degree(n_vpa)
            collected_nodes.append({
                "id": nd.get("id", n_vpa),
                "vpa": n_vpa,
                "owner_name": nd.get("owner_name", n_vpa),
                "bank_name": nd.get("bank_name", ""),
                "role": nd.get("role", "legitimate"),
                "risk_score": nd.get("risk_score", 0),
                "mule_score": nd.get("mule_score", 0.0),
                "in_degree": in_deg,
                "out_degree": out_deg,
                "total_incoming": nd.get("total_incoming", 0.0),
                "total_outgoing": nd.get("total_outgoing", 0.0),
                "city": nd.get("city", ""),
                "status": nd.get("status", "active"),
                "hop_level": node_hop_level.get(n_vpa, 0),
                "is_synthetic": True,
            })

        # Identify terminal destination sinks
        # Sinks: nodes reached in the trace where outgoing degree within collected_edges is 0,
        # or role == 'consolidation'
        outgoing_in_trace: Dict[str, int] = {n: 0 for n in visited_nodes}
        incoming_in_trace: Dict[str, float] = {n: 0.0 for n in visited_nodes}

        for e in collected_edges:
            outgoing_in_trace[e["source"]] = outgoing_in_trace.get(e["source"], 0) + 1
            incoming_in_trace[e["target"]] = incoming_in_trace.get(e["target"], 0.0) + e["amount"]

        sinks: List[Dict[str, Any]] = []
        for n_vpa in visited_nodes:
            if n_vpa == resolved_vpa:
                continue

            nd = multi_g.nodes[n_vpa]
            is_terminal = outgoing_in_trace[n_vpa] == 0 or nd.get("role") == "consolidation"

            if is_terminal:
                sinks.append({
                    "vpa": n_vpa,
                    "id": nd.get("id", n_vpa),
                    "owner_name": nd.get("owner_name", n_vpa),
                    "bank_name": nd.get("bank_name", ""),
                    "city": nd.get("city", ""),
                    "role": nd.get("role", "consolidation"),
                    "amount_received": incoming_in_trace[n_vpa],
                    "hop_distance": node_hop_level[n_vpa],
                    "status": nd.get("status", "active"),
                })

        # Hops breakdown list
        hops_breakdown: List[Dict[str, Any]] = []
        for e in sorted(collected_edges, key=lambda x: (x["hop"], x["timestamp"])):
            hops_breakdown.append({
                "hop_index": e["hop"],
                "from_vpa": e["source"],
                "to_vpa": e["target"],
                "amount": e["amount"],
                "timestamp": e["timestamp"],
                "tx_id": e["id"],
            })

        # Generate forensic narrative & explainability flags
        narrative_parts = [
            f"Funds totaling ₹{total_disputed_amount:,.2f} originated from {source_name} ({resolved_vpa}).",
            f"The trail traversed {len(visited_nodes) - 1} downstream entities across {max_hop_reached} hops.",
        ]

        flags: List[str] = []
        if len(sinks) > 0:
            sink_names = [f"{s['owner_name']} (₹{s['amount_received']:,.0f})" for s in sinks]
            narrative_parts.append(
                f"Funds consolidated into {len(sinks)} terminal endpoint(s): {', '.join(sink_names)}."
            )
            flags.append(f"Identified {len(sinks)} cashout / consolidation endpoint(s)")

        if max_hop_reached >= 3:
            flags.append(f"Multi-hop layering detected across {max_hop_reached} distinct banking layers")

        mule_hops = [
            n for n in collected_nodes
            if n["role"] in ("first_mule", "intermediate") and n["vpa"] != resolved_vpa
        ]
        if mule_hops:
            flags.append(f"Transited through {len(mule_hops)} identified mule / wash accounts")

        # Cytoscape elements
        cy_elements = self.builder.to_cytoscape_elements(collected_nodes, collected_edges)

        return {
            "source_vpa": resolved_vpa,
            "source_name": source_name,
            "total_disputed_amount": total_disputed_amount,
            "max_hops_reached": max_hop_reached,
            "visited_nodes_count": len(visited_nodes),
            "visited_edges_count": len(collected_edges),
            "destination_sinks": sinks,
            "hops_breakdown": hops_breakdown,
            "nodes": collected_nodes,
            "edges": collected_edges,
            "cytoscape_elements": cy_elements,
            "detection_narrative": " ".join(narrative_parts),
            "explainability_flags": flags,
            "disclaimer": "SYNTHETIC / DEMO DATA — StreamShield multi-hop traversal",
        }

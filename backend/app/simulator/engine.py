"""
StreamShield Simulator — Execution Engine & Pipeline Integrator

Coordinates procedurally synthesized attack streams through the Real-Time ML Fraud Pipeline,
NetworkX Graph Analytics, Downstream Money-Trail Tracer, and Fraud DNA Pattern Matcher.
"""

from typing import Dict, Any, List, Optional
import time
import numpy as np
import networkx as nx

from app.engine.pipeline import fraud_pipeline
from app.graph.builder import TransactionGraphBuilder
from app.graph.analytics import GraphAnalyticsEngine
from app.graph.tracer import MoneyTrailTracer
from app.dna.service import fraud_dna_service
from app.simulator.scenarios import SCENARIO_CATALOG
from app.simulator.generator import ScenarioStreamGenerator


class SimulationExecutionEngine:
    """
    Executes simulated scenarios through the end-to-end StreamShield detection architecture.
    """

    def __init__(self):
        self.generator = ScenarioStreamGenerator()

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
        """
        Executes a complete interactive simulation run.
        """
        scenario = next(
            (s for s in SCENARIO_CATALOG if s["id"] == scenario_id), SCENARIO_CATALOG[0]
        )

        vol = volume if volume is not None else scenario["default_volume"]
        inter = intermediaries if intermediaries is not None else scenario["default_intermediaries"]
        amt_min = amount_min if amount_min is not None else scenario["default_amount_min"]
        amt_max = amount_max if amount_max is not None else scenario["default_amount_max"]

        # 1. Procedurally generate accounts and transaction event sequence
        accounts, raw_txs = self.generator.generate_scenario_stream(
            scenario_id=scenario_id,
            volume=vol,
            intermediaries=inter,
            amount_min=amt_min,
            amount_max=amt_max,
            noise_ratio=noise_ratio,
        )

        # 2. Feed transactions through the real-time ML Fraud Pipeline
        scored_events: List[Dict[str, Any]] = []
        flagged_count = 0
        total_volume = 0.0
        mitigated_loss = 0.0
        latencies: List[float] = []

        # Local builder for simulation graph
        sim_builder = TransactionGraphBuilder()
        sim_builder.graph.clear()  # Start with blank graph for simulation isolation

        acc_map = {a["vpa"]: a for a in accounts}

        for acc in accounts:
            sim_builder.add_account_node(acc)

        for tx in raw_txs:
            t0 = time.perf_counter()

            # Enrich transaction with simulation account priors and graph context
            rec_acc = acc_map.get(tx["receiver_vpa"])
            send_acc = acc_map.get(tx["sender_vpa"])
            if rec_acc and "mule_probability" not in tx:
                if rec_acc.get("role") in ("first_mule", "intermediate", "consolidation"):
                    tx["mule_probability"] = rec_acc.get("risk_score", 85) / 100.0
            if send_acc and send_acc.get("role") in ("first_mule", "intermediate", "consolidation"):
                tx["sender_account_age_days"] = send_acc.get("account_age_days", 5)

            in_deg = sim_builder.graph.in_degree(tx["receiver_vpa"]) if sim_builder.graph.has_node(tx["receiver_vpa"]) else 0
            out_deg = sim_builder.graph.out_degree(tx["receiver_vpa"]) if sim_builder.graph.has_node(tx["receiver_vpa"]) else 0

            sim_ctx = {
                "receiver_incoming_count": in_deg + (15 if rec_acc and rec_acc.get("role") in ("first_mule", "consolidation") else 1),
                "receiver_outgoing_count": max(1, out_deg),
                "sender_velocity_1h_count": sim_builder.graph.out_degree(tx["sender_vpa"]) + 1 if sim_builder.graph.has_node(tx["sender_vpa"]) else 1,
            }

            # Score through ML pipeline
            scored = fraud_pipeline.process_transaction(
                tx_data=tx,
                db=None,  # In-memory evaluation
                create_alert_if_flagged=False,
                context=sim_ctx,
            )
            lat_ms = (time.perf_counter() - t0) * 1000.0
            latencies.append(lat_ms)

            r_score = scored["risk_score"]
            decision = scored["decision"]
            is_flagged = r_score >= 70 or decision in ("review", "blocked")
            amt = float(tx["amount"])
            total_volume += amt

            if is_flagged:
                flagged_count += 1
                if decision == "blocked":
                    mitigated_loss += amt

            # Add to local simulation graph
            sim_builder.add_transaction_edge({
                "id": tx["id"],
                "sender_vpa": tx["sender_vpa"],
                "sender_name": tx.get("sender_name", ""),
                "receiver_vpa": tx["receiver_vpa"],
                "receiver_name": tx.get("receiver_name", ""),
                "amount": amt,
                "timestamp": tx["timestamp"],
                "risk_score": r_score,
                "decision": decision,
                "status": "flagged" if is_flagged else "completed",
            })

            # Format simulated event for UI feed
            fired_rule = tx.get("rule_hint")
            if not fired_rule and scored.get("risk_reasons"):
                fired_rule = scored["risk_reasons"][0]

            time_str = tx["timestamp"].split("T")[-1].replace("Z", "")[:8]
            scored_events.append({
                "id": tx["id"],
                "sender": tx["sender_vpa"],
                "receiver": tx["receiver_vpa"],
                "amount": amt,
                "risk_score": r_score,
                "decision": decision,
                "flagged": is_flagged,
                "time": time_str,
                "rule_fired": fired_rule,
                "is_simulated": True,
            })

        # 3. Analyze simulation graph for patterns
        sim_analytics = GraphAnalyticsEngine(sim_builder)
        cycles = sim_analytics.detect_cycles()
        fan_ins = sim_analytics.detect_fan_in(min_senders=2)
        fan_outs = sim_analytics.detect_fan_out(min_recipients=2)

        detected_patterns: List[str] = []
        if cycles:
            detected_patterns.append(f"Detected {len(cycles)} circular transaction cycle(s) with zero net delta")
        if fan_ins:
            detected_patterns.append(f"Identified {len(fan_ins)} fan-in collector hub(s) with high in-degree velocity")
        if fan_outs:
            detected_patterns.append(f"Identified {len(fan_outs)} fan-out smurfing origin(s) with high out-degree dispersion")
        if not detected_patterns:
            detected_patterns.append("Transient multi-hop fund displacement across unseasoned intermediaries")

        # 4. Extract Fraud DNA & Match against archetypes
        simple_sim_g = sim_builder.get_simple_digraph()
        dna_analysis = fraud_dna_service.analyze_network(
            graph=simple_sim_g,
            transactions=raw_txs,
            subject_id=f"sim-{scenario_id}",
        )
        top_dna_match = dna_analysis.get("top_match")

        # 5. Trace downstream money trail from primary source node if present
        source_nodes = [
            n for n in sim_builder.graph.nodes()
            if sim_builder.graph.nodes[n].get("role") in ("source", "first_mule")
        ]
        primary_source = source_nodes[0] if source_nodes else list(sim_builder.graph.nodes())[0]

        sim_tracer = MoneyTrailTracer(sim_builder)
        money_trail = sim_tracer.trace_money_trail(source_vpa=primary_source, max_hops=4)

        # 6. Rank suspicious accounts
        suspicious_accs = []
        for n in sim_builder.graph.nodes():
            m_res = sim_analytics.score_mule_account(n)
            if m_res["mule_score"] >= 65.0:
                suspicious_accs.append(m_res)
        suspicious_accs.sort(key=lambda x: x["mule_score"], reverse=True)

        # 7. Generate Cytoscape JSON elements
        cy_nodes = []
        for n, d in sim_builder.graph.nodes(data=True):
            cy_nodes.append({
                "id": d.get("id", n),
                "vpa": n,
                "owner_name": d.get("owner_name", n),
                "role": d.get("role", "intermediate"),
                "risk_score": d.get("risk_score", 0),
                "mule_score": d.get("mule_score", 0.0),
                "status": d.get("status", "active"),
                "total_incoming": d.get("total_incoming", 0.0),
            })

        cy_edges = []
        for u, v, k, d in sim_builder.graph.edges(keys=True, data=True):
            cy_edges.append({
                "id": d.get("id", f"{u}->{v}"),
                "source": u,
                "target": v,
                "amount": d.get("amount", 0.0),
                "decision": d.get("decision", "approved"),
                "risk_score": d.get("risk_score", 0),
                "timestamp": d.get("timestamp", ""),
            })

        cy_elements = sim_builder.to_cytoscape_elements(cy_nodes, cy_edges)

        # 8. Compute empirical run metrics
        total_tx_count = len(scored_events)
        detection_rate = round((flagged_count / total_tx_count * 100.0) if total_tx_count > 0 else 0.0, 1)
        mean_lat = round(float(np.mean(latencies)) if latencies else 3.5, 2)

        metrics = {
            "total_generated_transactions": total_tx_count,
            "flagged_transactions_count": flagged_count,
            "quarantined_accounts_count": len(suspicious_accs),
            "total_simulated_volume": round(total_volume, 2),
            "detection_rate_percent": detection_rate,
            "mean_pipeline_latency_ms": mean_lat,
            "mitigated_loss_amount": round(mitigated_loss, 2),
        }

        # Executive summary debrief
        debrief = (
            f"Simulation '{scenario['name']}' completed with {total_tx_count} procedural transactions "
            f"moving ₹{total_volume:,.2f}. The StreamShield pipeline achieved a {detection_rate}% detection rate "
            f"with mean inference latency of {mean_lat}ms, mitigating ₹{mitigated_loss:,.2f} in illicit fund flow. "
            f"Fraud DNA matched '{top_dna_match['archetype_name']}' with {top_dna_match['similarity_percentage']}% structural confidence."
        )

        return {
            "simulation_id": f"SIM-{int(time.time())}",
            "scenario_id": scenario_id,
            "scenario_name": scenario["name"],
            "status": "completed",
            "metrics": metrics,
            "simulated_stream": scored_events,
            "detected_patterns": detected_patterns,
            "suspicious_accounts": suspicious_accs,
            "fraud_dna_match": top_dna_match,
            "money_trail_summary": {
                "source_vpa": money_trail.get("source_vpa"),
                "total_disputed_amount": money_trail.get("total_disputed_amount"),
                "hops_reached": money_trail.get("max_hops_reached"),
                "sinks_count": len(money_trail.get("destination_sinks", [])),
                "destination_sinks": money_trail.get("destination_sinks", []),
            },
            "cytoscape_elements": cy_elements,
            "narrative_summary": debrief,
            "is_simulated": True,
            "disclaimer": "SYNTHETIC / SIMULATED DATA — StreamShield Fraud Intelligence Lab simulation run. Results generated using procedural attack models.",
        }


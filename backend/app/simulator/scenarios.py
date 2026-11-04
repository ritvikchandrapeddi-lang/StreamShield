"""
StreamShield Simulator — Scenario Definitions & Attack Motifs

Defines the 6 core procedural attack vectors for the StreamShield Fraud Intelligence Lab.
"""

from typing import List, Dict, Any

SCENARIO_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "funnel-attack",
        "name": "1. Funnel Attack (High Fan-In Aggregation)",
        "description": (
            "Multiple victim accounts coerced into transferring varying amounts toward a single "
            "high-velocity collector node, followed by an immediate emergency drain."
        ),
        "complexity": "High",
        "default_volume": 120,
        "default_intermediaries": 6,
        "default_amount_min": 15000.0,
        "default_amount_max": 120000.0,
        "typology_summary": (
            "Demonstrates social-engineering collect campaign or investment scam funneling funds "
            "into an aggregator wallet before rapid cross-border conversion."
        ),
        "detection_explanation": (
            "StreamShield evaluates sliding-window in-degree velocity. When incoming unique senders "
            "spike 800% above normal baseline within 120s, collector is quarantined."
        ),
        "key_rule_triggers": [
            "RULE_FAN_IN_VELOCITY_SPIKE",
            "RULE_IMMEDIATE_BALANCE_DRAIN",
            "RULE_SYNTHETIC_KYC_BURST",
        ],
    },
    {
        "id": "smurfing-split",
        "name": "2. Smurfing / Transaction Splitting",
        "description": (
            "Single large illicit sum chopped into sub-reporting thresholds (e.g. ₹49,900) "
            "across dozens of micro-mule accounts to evade manual compliance triggers."
        ),
        "complexity": "Medium",
        "default_volume": 80,
        "default_intermediaries": 8,
        "default_amount_min": 35000.0,
        "default_amount_max": 49999.0,
        "typology_summary": (
            "Classic structuring maneuver designed to circumvent mandatory AML threshold reporting "
            "while maintaining rapid payout throughput."
        ),
        "detection_explanation": (
            "Detected via entropy-based dispersion scoring and mathematical clustering around "
            "standard regulatory boundaries (₹50,000 threshold)."
        ),
        "key_rule_triggers": [
            "RULE_STRUCTURING_BOUNDARY_AFFINITY",
            "RULE_RAPID_FAN_OUT_DISPERSION",
            "RULE_NEW_VPA_CHURN_HIGH",
        ],
    },
    {
        "id": "layering-intermediates",
        "name": "3. Layering Through Intermediaries",
        "description": (
            "Multi-tier cascading money trails spanning 4 to 6 hops to sever the evidentiary "
            "link between victim and ultimate beneficiary cashout."
        ),
        "complexity": "High",
        "default_volume": 140,
        "default_intermediaries": 10,
        "default_amount_min": 20000.0,
        "default_amount_max": 180000.0,
        "typology_summary": (
            "Simulates professional laundering rings utilizing intermediate retail front accounts, "
            "shell kirana stores, and digital wallet hops."
        ),
        "detection_explanation": (
            "Graph traversal calculates transit turnaround. Pass-through nodes with dwell times "
            "under 3 minutes and high ratio of inflow-to-outflow are flagged."
        ),
        "key_rule_triggers": [
            "RULE_ZERO_RETENTION_PASS_THROUGH",
            "RULE_MULTI_HOP_AFFINITY_GRAPH",
            "RULE_OFFSHORE_TERMINAL_CONVERGENCE",
        ],
    },
    {
        "id": "circular-transfers",
        "name": "4. Circular Money Transfers",
        "description": (
            "Closed-loop fund circulation (A -> B -> C -> D -> A) creating illusion of high "
            "transactional volume, legitimate liquidity, or fake merchant revenue."
        ),
        "complexity": "Medium",
        "default_volume": 60,
        "default_intermediaries": 4,
        "default_amount_min": 40000.0,
        "default_amount_max": 95000.0,
        "typology_summary": (
            "Used by fraudulent merchants to fake UPI sales history, qualify for unsecured "
            "merchant loans, or manipulate credit card reward point arbitrage."
        ),
        "detection_explanation": (
            "Simple cycle finding algorithms execute on streaming graph adjacencies to detect "
            "closed-loop paths with near-zero net economic delta."
        ),
        "key_rule_triggers": [
            "RULE_DIRECTED_CYCLE_DETECTED",
            "RULE_ZERO_NET_ECONOMIC_DELTA",
            "RULE_REPETITIVE_PAIR_COORDINATION",
        ],
    },
    {
        "id": "coordinated-mule-network",
        "name": "5. Coordinated Mule Network",
        "description": (
            "Centrally orchestrated mule network with coordinated check-in times, shared "
            "device signatures, and synchronized cashouts."
        ),
        "complexity": "Extreme",
        "default_volume": 160,
        "default_intermediaries": 12,
        "default_amount_min": 10000.0,
        "default_amount_max": 250000.0,
        "typology_summary": (
            "Organized crime syndicates managing hundreds of rented bank accounts through "
            "automated bot-nets and synchronized cashout scripts."
        ),
        "detection_explanation": (
            "Network community detection coupled with device fingerprint clustering isolates "
            "dense subgraphs with synchronized transactional bursts."
        ),
        "key_rule_triggers": [
            "RULE_SHARED_DEVICE_CLUSTER_MAC",
            "RULE_SYNCHRONIZED_OUTBOUND_BURST",
            "RULE_COMMUNITY_DENSITY_ANOMALY",
        ],
    },
    {
        "id": "unknown-adaptive",
        "name": "6. Unknown / Adaptive Fraud Pattern",
        "description": (
            "Emergent, adversarial attack vector attempting dynamic evasion by alternating "
            "amounts, randomized wait times, and mixed P2P/P2M payment channels."
        ),
        "complexity": "Extreme",
        "default_volume": 100,
        "default_intermediaries": 8,
        "default_amount_min": 5000.0,
        "default_amount_max": 150000.0,
        "typology_summary": (
            "Tests zero-day fraud typology resilience by introducing stochastic jitter in amounts, "
            "channels, and delay times."
        ),
        "detection_explanation": (
            "Unsupervised isolation and topological feature embedding trigger anomaly score "
            "exceeding threshold without relying on static rule heuristics."
        ),
        "key_rule_triggers": [
            "RULE_UNSUPERVISED_EMBEDDING_OUTLIER",
            "RULE_STOCHASTIC_JITTER_ANOMALY",
            "RULE_CROSS_CHANNEL_MORPHING",
        ],
    },
]


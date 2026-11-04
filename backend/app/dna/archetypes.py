"""
StreamShield Fraud DNA — Reference Archetype Signatures Catalog

Defines baseline structural invariant vectors for canonical financial crime topologies.
"""

from typing import List, Dict, Any

STRAND_DEFINITIONS = [
    {
        "code": "STRAND_FAN_IN",
        "name": "Fan-In Aggregation Ratio",
        "weight": 0.16,
        "description": "Degree of convergence from multiple distinct sources into narrow recipient hubs",
    },
    {
        "code": "STRAND_FAN_OUT",
        "name": "Fan-Out Dispersal Ratio",
        "weight": 0.16,
        "description": "Degree of divergence from single source across multiple fragmented recipients",
    },
    {
        "code": "STRAND_CYCLE_RECIPROCITY",
        "name": "Circular Cycle Participation",
        "weight": 0.15,
        "description": "Fraction of network volume circulating in closed zero-sum directed cycles",
    },
    {
        "code": "STRAND_PASS_THROUGH",
        "name": "Rapid Pass-Through Velocity",
        "weight": 0.15,
        "description": "Ratio of immediate outgoing funds to incoming funds with minimal account dwell time",
    },
    {
        "code": "STRAND_BOUNDARY_STRUCTURING",
        "name": "Regulatory Threshold Structuring",
        "weight": 0.13,
        "description": "Clustering of transaction values just below statutory reporting limits (₹50k / ₹2L)",
    },
    {
        "code": "STRAND_HOP_DEPTH",
        "name": "Multi-Hop Cascading Depth",
        "weight": 0.10,
        "description": "Maximum directed traversal length and banking intermediary layering distance",
    },
    {
        "code": "STRAND_SINK_CONCENTRATION",
        "name": "Terminal Sink Convergence Index",
        "weight": 0.08,
        "description": "Proportion of total network funds terminating in low-out-degree consolidation vaults",
    },
    {
        "code": "STRAND_TEMPORAL_COMPRESSION",
        "name": "Temporal Burst Compression",
        "weight": 0.07,
        "description": "Inter-transaction temporal clustering indicating automated or bot-driven execution",
    },
]

KNOWN_ARCHETYPES: List[Dict[str, Any]] = [
    {
        "id": "DNA-ARCH-FUNNEL",
        "name": "Funnel Collector Syndicate",
        "typology": "Funnel Attack",
        "description": (
            "Multi-victim social engineering or extortion campaign funneling funds from disparate "
            "accounts into an aggregator wallet before rapid cross-border conversion or cash withdrawal."
        ),
        # [fan_in, fan_out, cycle, pass_through, boundary, hop_depth, sink_conc, temporal_comp]
        "reference_vector": [0.92, 0.15, 0.04, 0.88, 0.35, 0.45, 0.95, 0.85],
        "typical_indicators": [
            "In-degree to out-degree ratio exceeding 4:1",
            "Immediate balance liquidation within 180 seconds of aggregate receipt",
            "Disparate geographic origin circles converging on a single telecom circle",
        ],
        "recommended_interventions": [
            "Immediate debit freeze on aggregator collector account",
            "Place upstream source accounts under automated security verification",
            "Dispatch suspicious activity notification to destination bank",
        ],
    },
    {
        "id": "DNA-ARCH-SMURFING",
        "name": "Smurfing Dispersal Matrix",
        "typology": "Smurfing / Structuring",
        "description": (
            "Deliberate fragmentation of large illicit capital into uniform sub-reporting amounts "
            "fanned out across numerous newly created micro-mule accounts."
        ),
        "reference_vector": [0.10, 0.96, 0.02, 0.22, 0.95, 0.20, 0.15, 0.92],
        "typical_indicators": [
            "Out-degree to in-degree ratio exceeding 5:1",
            "Transfer sums tightly clustered in the ₹40,000–₹49,999 band",
            "High entropy of recipient bank handles with zero prior relationship",
        ],
        "recommended_interventions": [
            "Trigger automated SAR filing for structuring violation",
            "Quarantine all downstream recipient accounts opened within 7 days",
            "Halt further outbound transfers from originating entity",
        ],
    },
    {
        "id": "DNA-ARCH-CIRCULAR",
        "name": "Circular Laundering Loop",
        "typology": "Circular Money Movement",
        "description": (
            "Closed-loop transaction cycles rotating capital through colluding shell entities "
            "to artificially manufacture turnover or obscure origin without economic displacement."
        ),
        "reference_vector": [0.42, 0.42, 0.98, 0.95, 0.20, 0.60, 0.05, 0.72],
        "typical_indicators": [
            "Closed directed simple cycle of length 3 to 6 nodes",
            "Net economic delta across loop is less than 3% (gas/fee loss only)",
            "Turnaround time between receipt and next hop is under 2 minutes",
        ],
        "recommended_interventions": [
            "Simultaneous multi-entity freeze across all cycle participants",
            "Revoke merchant acquiring privileges for involved entities",
            "Audit commercial tax filings against claimed digital turnover",
        ],
    },
    {
        "id": "DNA-ARCH-LAYERING",
        "name": "Multi-Hop Layering Conduit",
        "typology": "Layering Through Intermediaries",
        "description": (
            "Deep multi-tier cascading money trails spanning 4 to 6 hops across distinct banks "
            "designed to sever audit trails before final OTC settlement."
        ),
        "reference_vector": [0.48, 0.48, 0.06, 0.94, 0.40, 0.92, 0.88, 0.82],
        "typical_indicators": [
            "Directed path depth of 4 or more hops",
            "Transit nodes forward >90% of received funds within minutes",
            "Funds cross 3 or more distinct commercial or payment bank rails",
        ],
        "recommended_interventions": [
            "Activate multi-bank Section 91 CrPC coordination alert",
            "Freeze terminal cashout sink node to prevent capital flight",
            "Flag all intermediate hops as Tier-2 wash conduits",
        ],
    },
    {
        "id": "DNA-ARCH-COORDINATED",
        "name": "Coordinated Mule Network",
        "typology": "Organized Mule Ring",
        "description": (
            "Centrally orchestrated network of rented or synthetic mule accounts acting in "
            "synchronized bursts with coordinated check-ins and shared infrastructure."
        ),
        "reference_vector": [0.82, 0.78, 0.12, 0.86, 0.52, 0.68, 0.72, 0.94],
        "typical_indicators": [
            "Synchronized transaction bursts across separate accounts within seconds",
            "Shared device fingerprints or IP subnets across distinct account holders",
            "High internal network community density and low external connectivity",
        ],
        "recommended_interventions": [
            "Blacklist shared device IDs and IP ranges at UPI gateway level",
            "Batch-freeze all accounts in identified community cluster",
            "Refer cluster dossier to Cyber Crime Coordination Centre (I4C)",
        ],
    },
    {
        "id": "DNA-ARCH-BENIGN",
        "name": "Legitimate Commercial Flow",
        "typology": "Benign Retail / Consumer",
        "description": (
            "Standard consumer and retail merchant payment behavior characterized by "
            "seasoned accounts, normal business hours, and un-correlated flow ratios."
        ),
        "reference_vector": [0.22, 0.25, 0.01, 0.32, 0.05, 0.15, 0.20, 0.18],
        "typical_indicators": [
            "Seasoned accounts with continuous credit/debit history > 180 days",
            "Absence of circular cycles or structured boundary clustering",
            "Transactions align with diurnal business operating hours",
        ],
        "recommended_interventions": [
            "Standard transaction approval with normal telemetry recording",
        ],
    },
]


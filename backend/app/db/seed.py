import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.account import AccountModel
from app.models.transaction import TransactionModel
from app.models.alert import AlertModel
from app.models.investigation import CaseModel, CaseNoteModel, CaseEvidenceModel

logger = logging.getLogger("streamshield.seed")


# -----------------------------------------------------------------------------
# REALISTIC SYNTHETIC DEMONSTRATION FIXTURES
# All accounts, VPAs, devices, and transactions are synthetic test fixtures.
# -----------------------------------------------------------------------------

INITIAL_ACCOUNTS = [
    {
        "id": "acc-mule-source",
        "vpa": "fastpay_drop88@paytm",
        "owner_name": "Apex Mobile Express (Primary Mule Drop)",
        "role": "first_mule",
        "risk_score": 96,
        "bank_name": "Paytm Payments Bank",
        "ifsc": "PYTM0123456",
        "city": "Mewat, HR",
        "incoming_count": 4,
        "outgoing_count": 8,
        "total_incoming": 485000.0,
        "total_outgoing": 482000.0,
        "account_age_days": 6,
        "status": "frozen",
        "device_fingerprint": "DEV-A984-X99",
        "is_simulated": True,
    },
    {
        "id": "acc-victim-source",
        "vpa": "ramesh.k@okhdfcbank",
        "owner_name": "Ramesh Kumar (HDFC HNW Customer)",
        "role": "source",
        "risk_score": 15,
        "bank_name": "HDFC Bank",
        "ifsc": "HDFC0000128",
        "city": "Bengaluru, KA",
        "incoming_count": 12,
        "outgoing_count": 2,
        "total_incoming": 850000.0,
        "total_outgoing": 185000.0,
        "account_age_days": 1420,
        "status": "active",
        "device_fingerprint": "DEV-HDFC-9912",
        "is_simulated": True,
    },
    {
        "id": "acc-mule-wash-1",
        "vpa": "wash_node_alpha@icici",
        "owner_name": "Silverline Traders (Wash Node)",
        "role": "intermediate",
        "risk_score": 78,
        "bank_name": "ICICI Bank",
        "ifsc": "ICIC0001889",
        "city": "Surat, GJ",
        "incoming_count": 2,
        "outgoing_count": 1,
        "total_incoming": 160000.0,
        "total_outgoing": 159000.0,
        "account_age_days": 22,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-N112-X44",
        "is_simulated": True,
    },
    {
        "id": "acc-crypto-sink",
        "vpa": "crypto_vault_quick@kotak",
        "owner_name": "Kuber Digital Assets (Downstream Cashout)",
        "role": "consolidation",
        "risk_score": 94,
        "bank_name": "Kotak Mahindra Bank",
        "ifsc": "KKBK0000921",
        "city": "Delhi, DL",
        "incoming_count": 14,
        "outgoing_count": 2,
        "total_incoming": 1450000.0,
        "total_outgoing": 1420000.0,
        "account_age_days": 8,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-CRYPTO-OTC",
        "is_simulated": True,
    },
    {
        "id": "acc-legit-merchant",
        "vpa": "swiggy.order@icici",
        "owner_name": "Bundl Technologies Swiggy",
        "role": "legitimate",
        "risk_score": 2,
        "bank_name": "ICICI Bank",
        "ifsc": "ICIC0000002",
        "city": "Bengaluru, KA",
        "incoming_count": 85000,
        "outgoing_count": 420,
        "total_incoming": 9500000.0,
        "total_outgoing": 8900000.0,
        "account_age_days": 2100,
        "status": "active",
        "device_fingerprint": "DEV-SWIGGY-AGG",
        "is_simulated": True,
    },
]

INITIAL_TRANSACTIONS = [
    {
        "id": "TXN-902418-UPI",
        "sender_vpa": "ramesh.k@okhdfcbank",
        "sender_name": "Ramesh Kumar",
        "sender_bank": "HDFC Bank",
        "sender_city": "Bengaluru, KA",
        "sender_device_id": "DEV-A984-X99",
        "sender_ip": "49.207.181.22",
        "sender_account_age_days": 1420,
        "receiver_vpa": "fastpay_drop88@paytm",
        "receiver_name": "Apex Mobile Express",
        "receiver_bank": "Paytm Payments Bank",
        "amount": 185000.0,
        "timestamp": datetime(2026, 11, 3, 16, 42, 10, tzinfo=timezone.utc),
        "risk_score": 96,
        "risk_level": "critical",
        "decision": "blocked",
        "risk_factors": [
            "SIM-swap signal received from telecom webhook 12m prior",
            "Device fingerprint changed 3 minutes before transfer",
            "Immediate fan-out transfer initiated to flagged mule account",
        ],
        "latency_ms": 7.4,
        "channel": "P2P",
        "mule_probability": 0.96,
        "is_simulated": True,
    },
    {
        "id": "TXN-902417-UPI",
        "sender_vpa": "priya.sharma@sbi",
        "sender_name": "Priya Sharma",
        "sender_bank": "State Bank of India",
        "sender_city": "Pune, MH",
        "sender_device_id": "DEV-B112-Q44",
        "sender_ip": "115.112.44.18",
        "sender_account_age_days": 650,
        "receiver_vpa": "swiggy.order@icici",
        "receiver_name": "Swiggy Food Delivery",
        "receiver_bank": "ICICI Bank",
        "amount": 420.0,
        "timestamp": datetime(2026, 11, 3, 16, 41, 55, tzinfo=timezone.utc),
        "risk_score": 3,
        "risk_level": "low",
        "decision": "approved",
        "risk_factors": ["Standard micro-merchant payment pattern"],
        "latency_ms": 2.8,
        "channel": "P2M",
        "mule_probability": 0.01,
        "is_simulated": True,
    },
    {
        "id": "TXN-902416-UPI",
        "sender_vpa": "ananya.verma@axisbank",
        "sender_name": "Ananya Verma",
        "sender_bank": "Axis Bank",
        "sender_city": "Noida, UP",
        "sender_device_id": "DEV-C339-L02",
        "sender_ip": "103.211.55.90",
        "sender_account_age_days": 890,
        "receiver_vpa": "crypto_vault_quick@kotak",
        "receiver_name": "Kuber Digital Assets",
        "receiver_bank": "Kotak Mahindra Bank",
        "amount": 49999.0,
        "timestamp": datetime(2026, 11, 3, 16, 39, 12, tzinfo=timezone.utc),
        "risk_score": 88,
        "risk_level": "high",
        "decision": "review",
        "risk_factors": [
            "Amount structured just below ₹50,000 statutory reporting threshold",
            "High velocity outbound: 4th high-value transfer in 10 minutes",
            "Beneficiary identified in cyber crime intelligence bulletin",
        ],
        "latency_ms": 11.2,
        "channel": "P2P",
        "mule_probability": 0.89,
        "is_simulated": True,
    },
    {
        "id": "TXN-902415-UPI",
        "sender_vpa": "rajesh_groceries@icici",
        "sender_name": "Rajesh General Store",
        "sender_bank": "ICICI Bank",
        "sender_city": "Mumbai, MH",
        "sender_device_id": "DEV-D441-K88",
        "sender_ip": "182.73.19.102",
        "sender_account_age_days": 540,
        "receiver_vpa": "amul_distributors@hdfcbank",
        "receiver_name": "Amul Dairy Supply",
        "receiver_bank": "HDFC Bank",
        "amount": 18250.0,
        "timestamp": datetime(2026, 11, 3, 16, 38, 0, tzinfo=timezone.utc),
        "risk_score": 12,
        "risk_level": "low",
        "decision": "approved",
        "risk_factors": ["Normal merchant-supplier inventory settlement"],
        "latency_ms": 4.1,
        "channel": "P2M",
        "mule_probability": 0.04,
        "is_simulated": True,
    },
    {
        "id": "TXN-902414-UPI",
        "sender_vpa": "sunil.kumar88@kotak",
        "sender_name": "Sunil Kumar",
        "sender_bank": "Kotak Mahindra Bank",
        "sender_city": "Jaipur, RJ",
        "sender_device_id": "DEV-E552-Z31",
        "sender_ip": "14.139.241.8",
        "sender_account_age_days": 12,
        "receiver_vpa": "quick_remit_mule@idbi",
        "receiver_name": "Apex Remit Transit",
        "receiver_bank": "IDBI Bank",
        "amount": 95000.0,
        "timestamp": datetime(2026, 11, 3, 16, 35, 42, tzinfo=timezone.utc),
        "risk_score": 94,
        "risk_level": "critical",
        "decision": "blocked",
        "risk_factors": [
            "Account age < 14 days with zero prior credit history",
            "Rooted Android device with mock location framework detected",
            "Mule ring high-in-degree graph node recipient",
        ],
        "latency_ms": 6.8,
        "channel": "P2P",
        "mule_probability": 0.98,
        "is_simulated": True,
    },
    {
        "id": "TXN-902412-UPI",
        "sender_vpa": "target_enterprise@okaxis",
        "sender_name": "Targeted Merchant Account",
        "sender_bank": "Axis Bank",
        "sender_city": "Mumbai, MH",
        "sender_device_id": "DEV-TX-SMURF",
        "sender_ip": "115.110.204.18",
        "sender_account_age_days": 600,
        "receiver_vpa": "smurf_pocket_03@okbizaxis",
        "receiver_name": "Synthetic Profile C (Smurfing Tier-1)",
        "receiver_bank": "Axis Bank",
        "amount": 40000.0,
        "timestamp": datetime(2026, 11, 3, 15, 12, 0, tzinfo=timezone.utc),
        "risk_score": 84,
        "risk_level": "high",
        "decision": "review",
        "risk_factors": [
            "Part of 6-split structuring burst (₹40,000 x 6)",
            "Identical Android build fingerprint across recipient nodes",
        ],
        "latency_ms": 7.1,
        "channel": "P2P",
        "mule_probability": 0.88,
        "is_simulated": True,
    },
]

INITIAL_ALERTS = [
    {
        "id": "alt-1",
        "title": "High Fan-In Triggered",
        "vpa": "fastpay_drop88@paytm",
        "time_label": "2m ago",
        "severity": "critical",
        "tx_id": "TXN-902418-UPI",
        "case_id": "CASE-2026-0841",
        "read": False,
        "is_simulated": True,
    },
    {
        "id": "alt-2",
        "title": "Structuring Flag ₹49,999",
        "vpa": "crypto_vault_quick@kotak",
        "time_label": "8m ago",
        "severity": "high",
        "tx_id": "TXN-902416-UPI",
        "case_id": "CASE-2026-0841",
        "read": False,
        "is_simulated": True,
    },
    {
        "id": "alt-3",
        "title": "Mule Ring Quarantined",
        "vpa": "Syndicate Falcon",
        "time_label": "14m ago",
        "severity": "medium",
        "tx_id": "TXN-902414-UPI",
        "case_id": "CASE-2026-0841",
        "read": False,
        "is_simulated": True,
    },
]

INITIAL_CASES = [
    {
        "id": "CASE-2026-0841",
        "title": "Syndicate Falcon SIM-Swap & Multi-Hop Wash",
        "severity": "critical",
        "status": "investigating",
        "date_created": "2026-11-03 16:45",
        "primary_account": "fastpay_drop88@paytm",
        "primary_entity_name": "Apex Mobile Express (L1 Mule Cluster)",
        "transaction_count": 12,
        "total_disputed_amount": 485000.0,
        "description": "Coordinated SIM-swap cyber heist targeting HDFC high-net-worth customer. Rapid egress across three mule intermediaries with downstream crypto OTC cashout attempt.",
        "assigned_analyst": "Inspector S. Roy (Cyber Cell)",
        "risk_indicators": [
            "SIM-swap webhook alert within 15 mins of transaction",
            "Velocity spike: 3 outbound transfers in 52 seconds",
            "Known syndicate topology motif detected",
            "Paytm mule accounts flagged under 72h quarantine",
        ],
        "associated_tx_ids": ["TXN-902418-UPI", "TXN-902414-UPI"],
        "is_simulated": True,
        "evidence": [
            {
                "id": "ev-1",
                "time": "16:30:12",
                "title": "Telco SIM-Swap Event Alert",
                "description": "Airtel API webhook received: IMSI changed on linked mobile +91-98450-XXXXX.",
                "category": "telco",
                "severity": "critical",
            },
            {
                "id": "ev-2",
                "time": "16:42:10",
                "title": "Outbound High-Value Collect Request Triggered",
                "description": "First high-value debit of ₹1,80,000 to fastpay_drop88@paytm from unrecognized device.",
                "category": "banking",
                "severity": "critical",
            },
            {
                "id": "ev-3",
                "time": "16:43:05",
                "title": "Automated Account Freeze Invoked",
                "description": "StreamShield automated rule RULE-UPI-MULE-CASCADE halted 3 downstream wash transfers.",
                "category": "rule",
                "severity": "high",
            },
            {
                "id": "ev-4",
                "time": "16:45:00",
                "title": "LEAs Notice Generated (Section 91 CrPC)",
                "description": "Audit bundle packaged with device hashes and IP geolocations for nodal cyber police.",
                "category": "network",
                "severity": "medium",
            },
        ],
        "notes": [
            {
                "id": "note-1",
                "author": "S. Roy (Senior Analyst)",
                "timestamp": "Nov 3, 2026 • 16:50",
                "text": "Paytm nodal officer contacted. Primary mule wallet frozen with ₹1,78,000 intact. Awaiting KYC submission proof.",
                "badge": "Freezing Action Taken",
            },
            {
                "id": "note-2",
                "author": "V. Nair (Risk Specialist)",
                "timestamp": "Nov 3, 2026 • 17:15",
                "text": "Secondary layer accounts in Surat and Bharatpur identified. Cross-referenced device fingerprint DEV-A984-X99 with existing FIR 204/26.",
                "badge": "Forensic Linkage",
            },
        ],
    },
    {
        "id": "CASE-2026-0839",
        "title": "Smurfing Micro-Dispersion: Kirana Cluster",
        "severity": "high",
        "status": "open",
        "date_created": "2026-11-03 15:15",
        "primary_account": "smurf_pocket_03@okbizaxis",
        "primary_entity_name": "Local Kirana Micro-Cluster",
        "transaction_count": 8,
        "total_disputed_amount": 240000.0,
        "description": "Synthetic merchant accounts receiving recurring structured ₹40,000 deposits to evade PAN reporting limits.",
        "assigned_analyst": "P. Sengupta (Fraud Ops)",
        "risk_indicators": [
            "Amounts set just below statutory reporting thresholds",
            "All merchant VPAs registered on identical device MAC address",
            "No physical business footprint verified during geo-tag check",
        ],
        "associated_tx_ids": ["TXN-902412-UPI"],
        "is_simulated": True,
        "evidence": [
            {
                "id": "ev-201",
                "time": "15:10:02",
                "title": "Structuring Burst Initiated",
                "description": "6 transfers of identical ₹40,000 values initiated within 120 seconds.",
                "category": "banking",
                "severity": "high",
            },
            {
                "id": "ev-202",
                "time": "15:12:40",
                "title": "Shared Hardware Fingerprint Match",
                "description": "All 6 accounts shared Android Build ID fingerprint DEV-SM-1..6 on same subnet.",
                "category": "device",
                "severity": "critical",
            },
        ],
        "notes": [
            {
                "id": "note-201",
                "author": "P. Sengupta",
                "timestamp": "Nov 3, 2026 • 15:30",
                "text": "Originating merchant contacted; claims account was rented out for commission. Escalated to legal compliance.",
                "badge": "Analyst Entry",
            },
        ],
    },
    {
        "id": "CASE-2026-0832",
        "title": "Circular Ledger Inflation Ring: Gujarat Textiles",
        "severity": "medium",
        "status": "escalated",
        "date_created": "2026-11-02 18:20",
        "primary_account": "ring_shell_a@okicici",
        "primary_entity_name": "Alpha Logistics & Colluding Partners",
        "transaction_count": 48,
        "total_disputed_amount": 1150000.0,
        "description": "Continuous circular fund recycling between four corporate entities to artificially inflate turnover for credit limit enhancements.",
        "assigned_analyst": "A. Kulkarni (AML Intelligence)",
        "risk_indicators": [
            "Closed graph directed cycle detected with near 100% balance return",
            "GST invoice triangulation mismatch",
            "Negligible net tax payment relative to declared ₹1.2 Cr monthly UPI flow",
        ],
        "associated_tx_ids": [],
        "is_simulated": True,
        "evidence": [
            {
                "id": "ev-301",
                "time": "14:20:00",
                "title": "Graph Topology Cycle Detected",
                "description": "Cycle detector algorithm flagged repetitive directed 4-hop ring.",
                "category": "network",
                "severity": "high",
            },
        ],
        "notes": [
            {
                "id": "note-301",
                "author": "A. Kulkarni",
                "timestamp": "Nov 2, 2026 • 19:10",
                "text": "Report compiled for FIU-IND (Financial Intelligence Unit). Suspicious Transaction Report (STR) drafted.",
                "badge": "STR Drafted",
            },
        ],
    },
    {
        "id": "CASE-2026-0820",
        "title": "Phishing Collect Request Spoofing Campaign",
        "severity": "critical",
        "status": "resolved",
        "date_created": "2026-11-01 11:00",
        "primary_account": "unknown_burner_vpa@airtel",
        "primary_entity_name": "Manoj Digital Hub (Burner Entity)",
        "transaction_count": 29,
        "total_disputed_amount": 640000.0,
        "description": "Bulk reverse collect requests disguised as electricity bill refund notifications. Victims tricked into entering UPI PINs.",
        "assigned_analyst": "T. Deshmukh",
        "risk_indicators": [
            "VPA brand spoofing ('ebill-refund-desk@...')",
            "Collect request conversion rate > 35% across elderly demographic",
            "Immediate ATM cashout within 8 minutes of credit",
        ],
        "associated_tx_ids": [],
        "is_simulated": True,
        "evidence": [
            {
                "id": "ev-401",
                "time": "10:45:00",
                "title": "Brand Impersonation Domain Flagged",
                "description": "VPA handle matched known government utility brand pattern.",
                "category": "rule",
                "severity": "critical",
            },
        ],
        "notes": [
            {
                "id": "note-401",
                "author": "T. Deshmukh",
                "timestamp": "Nov 1, 2026 • 12:30",
                "text": "Beneficiary accounts seized across two regional payment aggregators. Recovery rate 78%.",
                "badge": "Freezing Action Taken",
            },
        ],
    },
]


def seed_data_if_empty(db: Session) -> bool:
    """Populate initial synthetic demonstration records if tables are empty."""
    tx_count = db.query(TransactionModel).count()
    if tx_count > 0:
        logger.info("Database already seeded with synthetic transaction records. Skipping auto-seed.")
        return False

    logger.info("Seeding database with realistic synthetic demonstration data...")

    # 1. Accounts
    for acc in INITIAL_ACCOUNTS:
        db.add(AccountModel(**acc))

    # 2. Transactions
    for tx in INITIAL_TRANSACTIONS:
        db.add(TransactionModel(**tx))

    # 3. Alerts
    for alt in INITIAL_ALERTS:
        db.add(AlertModel(**alt))

    # 4. Investigation Cases
    for case_data in INITIAL_CASES:
        evidence_list = case_data.pop("evidence", [])
        notes_list = case_data.pop("notes", [])

        case_obj = CaseModel(**case_data)
        db.add(case_obj)
        db.flush()

        for ev in evidence_list:
            db.add(CaseEvidenceModel(case_id=case_obj.id, **ev))

        for nt in notes_list:
            db.add(CaseNoteModel(case_id=case_obj.id, **nt))

    db.commit()
    logger.info("Successfully seeded synthetic transactions, accounts, alerts, and investigation cases.")
    return True


def force_reseed(db: Session) -> None:
    """Clear and reseed all demonstration records."""
    db.query(CaseEvidenceModel).delete()
    db.query(CaseNoteModel).delete()
    db.query(CaseModel).delete()
    db.query(AlertModel).delete()
    db.query(TransactionModel).delete()
    db.query(AccountModel).delete()
    db.commit()
    seed_data_if_empty(db)


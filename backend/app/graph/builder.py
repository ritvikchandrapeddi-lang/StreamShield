"""
StreamShield Graph Intelligence — NetworkX Transaction Graph Builder

Constructs directed, weighted, timestamped transaction graphs from the database
or synthetic demonstration topologies.
"""

from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone
import networkx as nx

# -----------------------------------------------------------------------------
# REALISTIC SYNTHETIC GRAPH FIXTURES
# Parity with StreamShield Frontend Presets (Syndicate Falcon, Smurfing, Circular Wash)
# -----------------------------------------------------------------------------

SYNTHETIC_ACCOUNTS: List[Dict[str, Any]] = [
    # --- Syndicate Falcon (4-Hop Funnel Layering) ---
    {
        "id": "node-source",
        "vpa": "amit.verma91@okhdfcbank",
        "owner_name": "Amit Verma (Compromised Victim)",
        "role": "source",
        "risk_score": 94,
        "bank_name": "HDFC Bank",
        "ifsc": "HDFC0000128",
        "city": "Bengaluru, KA",
        "incoming_count": 2,
        "outgoing_count": 3,
        "total_incoming": 500000.0,
        "total_outgoing": 485000.0,
        "account_age_days": 480,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-A984-X99",
    },
    {
        "id": "node-mule-1",
        "vpa": "fastpay_drop88@paytm",
        "owner_name": "Apex Mobile Express (Tier-1 Mule)",
        "role": "first_mule",
        "risk_score": 92,
        "bank_name": "Paytm Payments Bank",
        "ifsc": "PYTM0123456",
        "city": "Noida, UP",
        "incoming_count": 1,
        "outgoing_count": 2,
        "total_incoming": 180000.0,
        "total_outgoing": 178000.0,
        "account_age_days": 8,
        "status": "frozen",
        "device_fingerprint": "DEV-K992-M33",
    },
    {
        "id": "node-mule-2",
        "vpa": "quickcash_store@okaxis",
        "owner_name": "Gaurav Telecomm (Tier-1 Mule)",
        "role": "first_mule",
        "risk_score": 89,
        "bank_name": "Axis Bank",
        "ifsc": "UTIB0002441",
        "city": "Bharatpur, RJ",
        "incoming_count": 1,
        "outgoing_count": 2,
        "total_incoming": 155000.0,
        "total_outgoing": 154000.0,
        "account_age_days": 14,
        "status": "frozen",
        "device_fingerprint": "DEV-L881-J22",
    },
    {
        "id": "node-mule-3",
        "vpa": "easytrans_hub@sbi",
        "owner_name": "EasyTransfer Logistics (Tier-1 Mule)",
        "role": "first_mule",
        "risk_score": 88,
        "bank_name": "State Bank of India",
        "ifsc": "SBIN0004921",
        "city": "Mathura, UP",
        "incoming_count": 1,
        "outgoing_count": 2,
        "total_incoming": 150000.0,
        "total_outgoing": 148500.0,
        "account_age_days": 11,
        "status": "frozen",
        "device_fingerprint": "DEV-M441-Z77",
    },
    {
        "id": "node-inter-1",
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
    },
    {
        "id": "node-inter-2",
        "vpa": "wash_node_beta@yesbank",
        "owner_name": "Kuber Hardware Agency (Wash Node)",
        "role": "intermediate",
        "risk_score": 82,
        "bank_name": "Yes Bank",
        "ifsc": "YESB0000431",
        "city": "Indore, MP",
        "incoming_count": 2,
        "outgoing_count": 1,
        "total_incoming": 170000.0,
        "total_outgoing": 168500.0,
        "account_age_days": 19,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-P663-Y88",
    },
    {
        "id": "node-inter-3",
        "vpa": "wash_node_gamma@kotak",
        "owner_name": "Vikas Digital Prints (Wash Node)",
        "role": "intermediate",
        "risk_score": 80,
        "bank_name": "Kotak Mahindra Bank",
        "ifsc": "KKBK0008812",
        "city": "Ahmedabad, GJ",
        "incoming_count": 2,
        "outgoing_count": 1,
        "total_incoming": 150000.0,
        "total_outgoing": 149000.0,
        "account_age_days": 27,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-Q774-R11",
    },
    {
        "id": "node-downstream-1",
        "vpa": "smurf_pocket_01@airtel",
        "owner_name": "Karan Prepaid Pay",
        "role": "downstream",
        "risk_score": 65,
        "bank_name": "Airtel Payments Bank",
        "ifsc": "AIRP0000001",
        "city": "Nuh, HR",
        "incoming_count": 1,
        "outgoing_count": 1,
        "total_incoming": 78000.0,
        "total_outgoing": 77500.0,
        "account_age_days": 6,
        "status": "frozen",
        "device_fingerprint": "DEV-R221-B99",
    },
    {
        "id": "node-downstream-2",
        "vpa": "smurf_pocket_02@fbl",
        "owner_name": "Lalit Micro Services",
        "role": "downstream",
        "risk_score": 68,
        "bank_name": "Federal Bank",
        "ifsc": "FDRL0001429",
        "city": "Alwar, RJ",
        "incoming_count": 1,
        "outgoing_count": 1,
        "total_incoming": 82000.0,
        "total_outgoing": 81000.0,
        "account_age_days": 9,
        "status": "frozen",
        "device_fingerprint": "DEV-S332-C11",
    },
    {
        "id": "node-consolidation",
        "vpa": "offshore_settle_node@indus",
        "owner_name": "Global OTC Commodity Gate (Terminal Vault)",
        "role": "consolidation",
        "risk_score": 98,
        "bank_name": "IndusInd Bank",
        "ifsc": "INDB0000999",
        "city": "Mumbai, MH",
        "incoming_count": 5,
        "outgoing_count": 1,
        "total_incoming": 476500.0,
        "total_outgoing": 470000.0,
        "account_age_days": 45,
        "status": "frozen",
        "device_fingerprint": "DEV-Z999-ULTRA",
    },

    # --- Smurfing Cascade (Micro-Splitting Dispersal) ---
    {
        "id": "smurf-origin",
        "vpa": "target_enterprise@okaxis",
        "owner_name": "Targeted Merchant Account",
        "role": "source",
        "risk_score": 91,
        "bank_name": "Axis Bank",
        "ifsc": "UTIB0001920",
        "city": "Mumbai, MH",
        "incoming_count": 4,
        "outgoing_count": 6,
        "total_incoming": 350000.0,
        "total_outgoing": 240000.0,
        "account_age_days": 600,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-TX-SMURF",
    },
    {
        "id": "smurf-mule-a",
        "vpa": "pocket_pay_01@paytm",
        "owner_name": "Synthetic Profile A",
        "role": "first_mule",
        "risk_score": 76,
        "bank_name": "Paytm Payments Bank",
        "ifsc": "PYTM0123456",
        "city": "Jaipur, RJ",
        "incoming_count": 1,
        "outgoing_count": 0,
        "total_incoming": 40000.0,
        "total_outgoing": 0.0,
        "account_age_days": 2,
        "status": "frozen",
        "device_fingerprint": "DEV-SM-1",
    },
    {
        "id": "smurf-mule-b",
        "vpa": "pocket_pay_02@paytm",
        "owner_name": "Synthetic Profile B",
        "role": "first_mule",
        "risk_score": 76,
        "bank_name": "Paytm Payments Bank",
        "ifsc": "PYTM0123456",
        "city": "Kota, RJ",
        "incoming_count": 1,
        "outgoing_count": 0,
        "total_incoming": 40000.0,
        "total_outgoing": 0.0,
        "account_age_days": 2,
        "status": "frozen",
        "device_fingerprint": "DEV-SM-2",
    },
    {
        "id": "smurf-mule-c",
        "vpa": "pocket_pay_03@okbizaxis",
        "owner_name": "Synthetic Profile C",
        "role": "first_mule",
        "risk_score": 74,
        "bank_name": "Axis Bank",
        "ifsc": "UTIB0002100",
        "city": "Ajmer, RJ",
        "incoming_count": 1,
        "outgoing_count": 0,
        "total_incoming": 40000.0,
        "total_outgoing": 0.0,
        "account_age_days": 3,
        "status": "frozen",
        "device_fingerprint": "DEV-SM-3",
    },
    {
        "id": "smurf-mule-d",
        "vpa": "pocket_pay_04@icici",
        "owner_name": "Synthetic Profile D",
        "role": "first_mule",
        "risk_score": 75,
        "bank_name": "ICICI Bank",
        "ifsc": "ICIC0000982",
        "city": "Delhi, DL",
        "incoming_count": 1,
        "outgoing_count": 0,
        "total_incoming": 40000.0,
        "total_outgoing": 0.0,
        "account_age_days": 1,
        "status": "frozen",
        "device_fingerprint": "DEV-SM-4",
    },
    {
        "id": "smurf-mule-e",
        "vpa": "pocket_pay_05@kotak",
        "owner_name": "Synthetic Profile E",
        "role": "first_mule",
        "risk_score": 78,
        "bank_name": "Kotak Mahindra Bank",
        "ifsc": "KKBK0001099",
        "city": "Gurugram, HR",
        "incoming_count": 1,
        "outgoing_count": 0,
        "total_incoming": 40000.0,
        "total_outgoing": 0.0,
        "account_age_days": 4,
        "status": "frozen",
        "device_fingerprint": "DEV-SM-5",
    },
    {
        "id": "smurf-mule-f",
        "vpa": "pocket_pay_06@sbi",
        "owner_name": "Synthetic Profile F",
        "role": "first_mule",
        "risk_score": 79,
        "bank_name": "State Bank of India",
        "ifsc": "SBIN0001140",
        "city": "Noida, UP",
        "incoming_count": 1,
        "outgoing_count": 0,
        "total_incoming": 40000.0,
        "total_outgoing": 0.0,
        "account_age_days": 1,
        "status": "frozen",
        "device_fingerprint": "DEV-SM-6",
    },

    # --- Circular Wash Typology (Zero-Sum Closed Cycle) ---
    {
        "id": "circ-a",
        "vpa": "ring_shell_a@okicici",
        "owner_name": "Alpha Logistics LLP",
        "role": "source",
        "risk_score": 86,
        "bank_name": "ICICI Bank",
        "ifsc": "ICIC0002011",
        "city": "Surat, GJ",
        "incoming_count": 12,
        "outgoing_count": 12,
        "total_incoming": 240000.0,
        "total_outgoing": 240000.0,
        "account_age_days": 15,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-CR-1",
    },
    {
        "id": "circ-b",
        "vpa": "ring_shell_b@yesbank",
        "owner_name": "Bravo Textiles",
        "role": "intermediate",
        "risk_score": 84,
        "bank_name": "Yes Bank",
        "ifsc": "YESB0000109",
        "city": "Surat, GJ",
        "incoming_count": 12,
        "outgoing_count": 12,
        "total_incoming": 240000.0,
        "total_outgoing": 240000.0,
        "account_age_days": 14,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-CR-2",
    },
    {
        "id": "circ-c",
        "vpa": "ring_shell_c@axisbank",
        "owner_name": "Charlie Exports",
        "role": "intermediate",
        "risk_score": 85,
        "bank_name": "Axis Bank",
        "ifsc": "UTIB0003011",
        "city": "Ahmedabad, GJ",
        "incoming_count": 12,
        "outgoing_count": 12,
        "total_incoming": 240000.0,
        "total_outgoing": 240000.0,
        "account_age_days": 14,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-CR-3",
    },
    {
        "id": "circ-d",
        "vpa": "ring_shell_d@hdfcbank",
        "owner_name": "Delta Consulting Group",
        "role": "consolidation",
        "risk_score": 87,
        "bank_name": "HDFC Bank",
        "ifsc": "HDFC0001402",
        "city": "Vadodara, GJ",
        "incoming_count": 12,
        "outgoing_count": 12,
        "total_incoming": 240000.0,
        "total_outgoing": 240000.0,
        "account_age_days": 13,
        "status": "under_surveillance",
        "device_fingerprint": "DEV-CR-4",
    },

    # --- Legitimate Consumer / Merchant Benchmark Nodes ---
    {
        "id": "legit-swiggy",
        "vpa": "swiggy.order@icici",
        "owner_name": "Bundl Technologies (Swiggy)",
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
    },
    {
        "id": "legit-priya",
        "vpa": "priya.sharma@sbi",
        "owner_name": "Priya Sharma",
        "role": "legitimate",
        "risk_score": 3,
        "bank_name": "State Bank of India",
        "ifsc": "SBIN0000111",
        "city": "Pune, MH",
        "incoming_count": 4,
        "outgoing_count": 28,
        "total_incoming": 45000.0,
        "total_outgoing": 42100.0,
        "account_age_days": 650,
        "status": "active",
        "device_fingerprint": "DEV-B112-Q44",
    },
    {
        "id": "legit-amul",
        "vpa": "amul_distributors@hdfcbank",
        "owner_name": "Amul Dairy Supply",
        "role": "legitimate",
        "risk_score": 5,
        "bank_name": "HDFC Bank",
        "ifsc": "HDFC0000210",
        "city": "Anand, GJ",
        "incoming_count": 1200,
        "outgoing_count": 140,
        "total_incoming": 4500000.0,
        "total_outgoing": 4200000.0,
        "account_age_days": 1800,
        "status": "active",
        "device_fingerprint": "DEV-AMUL-CORP",
    },
    {
        "id": "legit-rajesh",
        "vpa": "rajesh_groceries@icici",
        "owner_name": "Rajesh General Store",
        "role": "legitimate",
        "risk_score": 8,
        "bank_name": "ICICI Bank",
        "ifsc": "ICIC0000105",
        "city": "Mumbai, MH",
        "incoming_count": 850,
        "outgoing_count": 45,
        "total_incoming": 620000.0,
        "total_outgoing": 580000.0,
        "account_age_days": 540,
        "status": "active",
        "device_fingerprint": "DEV-D441-K88",
    },
]

SYNTHETIC_TRANSACTIONS: List[Dict[str, Any]] = [
    # --- Syndicate Falcon Edges ---
    {
        "id": "e-src-m1",
        "sender_vpa": "amit.verma91@okhdfcbank",
        "receiver_vpa": "fastpay_drop88@paytm",
        "amount": 180000.0,
        "timestamp": "2026-11-03T16:42:10Z",
        "latency_ms": 7.4,
        "risk_score": 92,
        "decision": "blocked",
        "tx_ref": "UPI-REF-0101",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-src-m2",
        "sender_vpa": "amit.verma91@okhdfcbank",
        "receiver_vpa": "quickcash_store@okaxis",
        "amount": 155000.0,
        "timestamp": "2026-11-03T16:42:35Z",
        "latency_ms": 8.1,
        "risk_score": 89,
        "decision": "blocked",
        "tx_ref": "UPI-REF-0102",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-src-m3",
        "sender_vpa": "amit.verma91@okhdfcbank",
        "receiver_vpa": "easytrans_hub@sbi",
        "amount": 150000.0,
        "timestamp": "2026-11-03T16:43:02Z",
        "latency_ms": 7.8,
        "risk_score": 88,
        "decision": "blocked",
        "tx_ref": "UPI-REF-0103",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-m1-i1",
        "sender_vpa": "fastpay_drop88@paytm",
        "receiver_vpa": "wash_node_alpha@icici",
        "amount": 95000.0,
        "timestamp": "2026-11-03T16:44:15Z",
        "latency_ms": 6.9,
        "risk_score": 86,
        "decision": "review",
        "tx_ref": "UPI-REF-0201",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-m1-i2",
        "sender_vpa": "fastpay_drop88@paytm",
        "receiver_vpa": "wash_node_beta@yesbank",
        "amount": 83000.0,
        "timestamp": "2026-11-03T16:44:40Z",
        "latency_ms": 7.2,
        "risk_score": 84,
        "decision": "review",
        "tx_ref": "UPI-REF-0202",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-m2-i2",
        "sender_vpa": "quickcash_store@okaxis",
        "receiver_vpa": "wash_node_beta@yesbank",
        "amount": 87000.0,
        "timestamp": "2026-11-03T16:45:05Z",
        "latency_ms": 8.0,
        "risk_score": 85,
        "decision": "review",
        "tx_ref": "UPI-REF-0203",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-m2-i3",
        "sender_vpa": "quickcash_store@okaxis",
        "receiver_vpa": "wash_node_gamma@kotak",
        "amount": 67000.0,
        "timestamp": "2026-11-03T16:45:30Z",
        "latency_ms": 7.7,
        "risk_score": 81,
        "decision": "review",
        "tx_ref": "UPI-REF-0204",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-m3-i3",
        "sender_vpa": "easytrans_hub@sbi",
        "receiver_vpa": "wash_node_gamma@kotak",
        "amount": 82000.0,
        "timestamp": "2026-11-03T16:45:55Z",
        "latency_ms": 7.5,
        "risk_score": 83,
        "decision": "review",
        "tx_ref": "UPI-REF-0205",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-m3-d1",
        "sender_vpa": "easytrans_hub@sbi",
        "receiver_vpa": "smurf_pocket_01@airtel",
        "amount": 66500.0,
        "timestamp": "2026-11-03T16:46:12Z",
        "latency_ms": 8.4,
        "risk_score": 75,
        "decision": "review",
        "tx_ref": "UPI-REF-0206",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "e-i1-cons",
        "sender_vpa": "wash_node_alpha@icici",
        "receiver_vpa": "offshore_settle_node@indus",
        "amount": 159000.0,
        "timestamp": "2026-11-03T16:47:00Z",
        "latency_ms": 9.1,
        "risk_score": 96,
        "decision": "blocked",
        "tx_ref": "UPI-REF-0301",
        "channel": "P2P",
        "status": "frozen",
    },
    {
        "id": "e-i2-cons",
        "sender_vpa": "wash_node_beta@yesbank",
        "receiver_vpa": "offshore_settle_node@indus",
        "amount": 168500.0,
        "timestamp": "2026-11-03T16:47:25Z",
        "latency_ms": 8.9,
        "risk_score": 97,
        "decision": "blocked",
        "tx_ref": "UPI-REF-0302",
        "channel": "P2P",
        "status": "frozen",
    },
    {
        "id": "e-i3-cons",
        "sender_vpa": "wash_node_gamma@kotak",
        "receiver_vpa": "offshore_settle_node@indus",
        "amount": 149000.0,
        "timestamp": "2026-11-03T16:47:50Z",
        "latency_ms": 9.0,
        "risk_score": 95,
        "decision": "blocked",
        "tx_ref": "UPI-REF-0303",
        "channel": "P2P",
        "status": "frozen",
    },

    # --- Smurfing Cascade Edges ---
    {
        "id": "sm-e1",
        "sender_vpa": "target_enterprise@okaxis",
        "receiver_vpa": "pocket_pay_01@paytm",
        "amount": 40000.0,
        "timestamp": "2026-11-03T15:10:02Z",
        "latency_ms": 6.1,
        "risk_score": 88,
        "decision": "review",
        "tx_ref": "SM-01",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "sm-e2",
        "sender_vpa": "target_enterprise@okaxis",
        "receiver_vpa": "pocket_pay_02@paytm",
        "amount": 40000.0,
        "timestamp": "2026-11-03T15:10:20Z",
        "latency_ms": 5.9,
        "risk_score": 88,
        "decision": "review",
        "tx_ref": "SM-02",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "sm-e3",
        "sender_vpa": "target_enterprise@okaxis",
        "receiver_vpa": "pocket_pay_03@okbizaxis",
        "amount": 40000.0,
        "timestamp": "2026-11-03T15:10:45Z",
        "latency_ms": 6.3,
        "risk_score": 87,
        "decision": "review",
        "tx_ref": "SM-03",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "sm-e4",
        "sender_vpa": "target_enterprise@okaxis",
        "receiver_vpa": "pocket_pay_04@icici",
        "amount": 40000.0,
        "timestamp": "2026-11-03T15:11:10Z",
        "latency_ms": 6.0,
        "risk_score": 88,
        "decision": "review",
        "tx_ref": "SM-04",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "sm-e5",
        "sender_vpa": "target_enterprise@okaxis",
        "receiver_vpa": "pocket_pay_05@kotak",
        "amount": 40000.0,
        "timestamp": "2026-11-03T15:11:35Z",
        "latency_ms": 6.2,
        "risk_score": 89,
        "decision": "review",
        "tx_ref": "SM-05",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "sm-e6",
        "sender_vpa": "target_enterprise@okaxis",
        "receiver_vpa": "pocket_pay_06@sbi",
        "amount": 40000.0,
        "timestamp": "2026-11-03T15:12:00Z",
        "latency_ms": 6.5,
        "risk_score": 89,
        "decision": "review",
        "tx_ref": "SM-06",
        "channel": "P2P",
        "status": "flagged",
    },

    # --- Circular Wash Typology Edges ---
    {
        "id": "cr-e1",
        "sender_vpa": "ring_shell_a@okicici",
        "receiver_vpa": "ring_shell_b@yesbank",
        "amount": 60000.0,
        "timestamp": "2026-11-03T14:20:00Z",
        "latency_ms": 5.2,
        "risk_score": 86,
        "decision": "review",
        "tx_ref": "CR-01",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "cr-e2",
        "sender_vpa": "ring_shell_b@yesbank",
        "receiver_vpa": "ring_shell_c@axisbank",
        "amount": 59800.0,
        "timestamp": "2026-11-03T14:21:10Z",
        "latency_ms": 5.4,
        "risk_score": 85,
        "decision": "review",
        "tx_ref": "CR-02",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "cr-e3",
        "sender_vpa": "ring_shell_c@axisbank",
        "receiver_vpa": "ring_shell_d@hdfcbank",
        "amount": 59500.0,
        "timestamp": "2026-11-03T14:22:25Z",
        "latency_ms": 5.6,
        "risk_score": 87,
        "decision": "review",
        "tx_ref": "CR-03",
        "channel": "P2P",
        "status": "flagged",
    },
    {
        "id": "cr-e4",
        "sender_vpa": "ring_shell_d@hdfcbank",
        "receiver_vpa": "ring_shell_a@okicici",
        "amount": 59200.0,
        "timestamp": "2026-11-03T14:23:40Z",
        "latency_ms": 5.7,
        "risk_score": 88,
        "decision": "review",
        "tx_ref": "CR-04",
        "channel": "P2P",
        "status": "flagged",
    },

    # --- Legitimate Benchmark Edges ---
    {
        "id": "legit-e1",
        "sender_vpa": "priya.sharma@sbi",
        "receiver_vpa": "swiggy.order@icici",
        "amount": 420.0,
        "timestamp": "2026-11-03T16:41:55Z",
        "latency_ms": 2.8,
        "risk_score": 3,
        "decision": "approved",
        "tx_ref": "P2M-SWIGGY-101",
        "channel": "P2M",
        "status": "completed",
    },
    {
        "id": "legit-e2",
        "sender_vpa": "rajesh_groceries@icici",
        "receiver_vpa": "amul_distributors@hdfcbank",
        "amount": 18250.0,
        "timestamp": "2026-11-03T16:38:00Z",
        "latency_ms": 4.1,
        "risk_score": 12,
        "decision": "approved",
        "tx_ref": "P2M-AMUL-992",
        "channel": "P2M",
        "status": "completed",
    },
]


class TransactionGraphBuilder:
    """
    Constructs and maintains a NetworkX directed transaction graph.
    """

    def __init__(self):
        self.graph: nx.MultiDiGraph = nx.MultiDiGraph()
        self.vpa_to_id: Dict[str, str] = {}
        self.id_to_vpa: Dict[str, str] = {}
        self._load_synthetic_defaults()

    def _load_synthetic_defaults(self) -> None:
        """Seed the graph with realistic synthetic topologies."""
        for acc in SYNTHETIC_ACCOUNTS:
            self.add_account_node(acc)

        for tx in SYNTHETIC_TRANSACTIONS:
            self.add_transaction_edge(tx)

    def add_account_node(self, acc: Dict[str, Any]) -> None:
        """Add or update an account node in the graph."""
        vpa = acc.get("vpa")
        if not vpa:
            return

        node_id = acc.get("id", vpa)
        self.vpa_to_id[vpa] = node_id
        self.id_to_vpa[node_id] = vpa

        self.graph.add_node(
            vpa,
            id=node_id,
            vpa=vpa,
            owner_name=acc.get("owner_name", "Unknown Entity"),
            bank_name=acc.get("bank_name", "Reserve Bank Node"),
            ifsc=acc.get("ifsc", "IFSC0000000"),
            city=acc.get("city", "Mumbai, MH"),
            role=acc.get("role", "legitimate"),
            risk_score=int(acc.get("risk_score", 0)),
            status=acc.get("status", "active"),
            account_age_days=int(acc.get("account_age_days", 30)),
            device_fingerprint=acc.get("device_fingerprint", "DEV-UNKNOWN"),
            total_incoming=float(acc.get("total_incoming", 0.0)),
            total_outgoing=float(acc.get("total_outgoing", 0.0)),
            incoming_count=int(acc.get("incoming_count", 0)),
            outgoing_count=int(acc.get("outgoing_count", 0)),
            is_synthetic=True,
        )

    def add_transaction_edge(self, tx: Dict[str, Any]) -> None:
        """Add a directed transaction edge between sender and receiver."""
        sender_vpa = tx.get("sender_vpa")
        receiver_vpa = tx.get("receiver_vpa")

        if not sender_vpa or not receiver_vpa:
            return

        # Ensure both nodes exist
        if not self.graph.has_node(sender_vpa):
            self.add_account_node({
                "id": sender_vpa,
                "vpa": sender_vpa,
                "owner_name": tx.get("sender_name", sender_vpa.split("@")[0].title()),
                "bank_name": tx.get("sender_bank", "Partner Bank"),
                "role": "source",
                "risk_score": int(tx.get("risk_score", 0)),
            })

        if not self.graph.has_node(receiver_vpa):
            self.add_account_node({
                "id": receiver_vpa,
                "vpa": receiver_vpa,
                "owner_name": tx.get("receiver_name", receiver_vpa.split("@")[0].title()),
                "bank_name": tx.get("receiver_bank", "Partner Bank"),
                "role": "intermediate",
                "risk_score": int(tx.get("risk_score", 0)),
            })

        tx_id = tx.get("id", f"TX-{len(self.graph.edges) + 1}")
        amount = float(tx.get("amount", 0.0))
        timestamp = str(tx.get("timestamp", datetime.now(timezone.utc).isoformat()))

        self.graph.add_edge(
            sender_vpa,
            receiver_vpa,
            key=tx_id,
            id=tx_id,
            amount=amount,
            timestamp=timestamp,
            latency_ms=float(tx.get("latency_ms", 5.0)),
            risk_score=int(tx.get("risk_score", 0)),
            decision=tx.get("decision", "approved"),
            tx_ref=tx.get("tx_ref", tx_id),
            channel=tx.get("channel", "P2P"),
            status=tx.get("status", "completed"),
            is_synthetic=True,
        )

    def build_from_db(self, db_session) -> None:
        """
        Sync transaction graph from live SQLAlchemy database models,
        preserving synthetic fixtures.
        """
        from app.models.account import AccountModel
        from app.models.transaction import TransactionModel

        try:
            accounts = db_session.query(AccountModel).all()
            for acc in accounts:
                self.add_account_node({
                    "id": acc.id,
                    "vpa": acc.vpa,
                    "owner_name": acc.owner_name,
                    "bank_name": acc.bank_name,
                    "ifsc": acc.ifsc,
                    "city": acc.city,
                    "role": acc.role,
                    "risk_score": acc.risk_score,
                    "status": acc.status,
                    "account_age_days": acc.account_age_days,
                    "device_fingerprint": acc.device_fingerprint,
                    "total_incoming": acc.total_incoming,
                    "total_outgoing": acc.total_outgoing,
                    "incoming_count": acc.incoming_count,
                    "outgoing_count": acc.outgoing_count,
                })

            transactions = db_session.query(TransactionModel).all()
            for tx in transactions:
                self.add_transaction_edge({
                    "id": tx.id,
                    "sender_vpa": tx.sender_vpa,
                    "sender_name": tx.sender_name,
                    "sender_bank": tx.sender_bank,
                    "receiver_vpa": tx.receiver_vpa,
                    "receiver_name": tx.receiver_name,
                    "receiver_bank": tx.receiver_bank,
                    "amount": tx.amount,
                    "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
                    "latency_ms": tx.latency_ms,
                    "risk_score": tx.risk_score,
                    "decision": tx.decision,
                    "channel": tx.channel,
                    "status": "flagged" if tx.risk_score >= 70 else "completed",
                })
        except Exception:
            # Fall back safely to synthetic fixtures
            pass

    def get_simple_digraph(self) -> nx.DiGraph:
        """
        Returns a collapsed simple directed graph nx.DiGraph with aggregated
        edge weights and counts for algorithms that require simple graphs (e.g., PageRank, simple cycles).
        """
        simple_g = nx.DiGraph()

        for node, data in self.graph.nodes(data=True):
            simple_g.add_node(node, **data)

        for u, v, data in self.graph.edges(data=True):
            amount = data.get("amount", 0.0)
            if simple_g.has_edge(u, v):
                simple_g[u][v]["amount"] += amount
                simple_g[u][v]["tx_count"] += 1
                simple_g[u][v]["max_risk"] = max(simple_g[u][v].get("max_risk", 0), data.get("risk_score", 0))
            else:
                simple_g.add_edge(
                    u,
                    v,
                    amount=amount,
                    tx_count=1,
                    max_risk=data.get("risk_score", 0),
                    first_tx_id=data.get("id"),
                    timestamp=data.get("timestamp"),
                )

        return simple_g

    def resolve_vpa(self, identifier: str) -> Optional[str]:
        """Resolves either a VPA or node ID to the corresponding VPA in the graph."""
        if self.graph.has_node(identifier):
            return identifier
        if identifier in self.id_to_vpa:
            return self.id_to_vpa[identifier]
        return None

    @staticmethod
    def to_cytoscape_elements(
        nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Converts node and edge lists into Cytoscape.js ElementDefinition array.
        """
        elements: List[Dict[str, Any]] = []

        for n in nodes:
            vpa = n.get("vpa", n.get("id", ""))
            role = n.get("role", "legitimate")
            risk_score = n.get("risk_score", 0)

            # Assign distinctive node color based on typology role
            color = "#10B981"  # Legitimate green
            if role == "source":
                color = "#DC2626"  # Deep Red
            elif role == "first_mule":
                color = "#EA580C"  # Burnt Orange
            elif role == "intermediate":
                color = "#1E293B"  # Navy Slate
            elif role == "downstream":
                color = "#64748B"  # Muted Slate
            elif role == "consolidation":
                color = "#7C3AED"  # Purple OTC Sink

            elements.append({
                "group": "nodes",
                "data": {
                    "id": n.get("id", vpa),
                    "vpa": vpa,
                    "label": f"{n.get('owner_name', vpa).split()[0]}\n₹{int(n.get('total_incoming', 0)):,}",
                    "ownerName": n.get("owner_name", vpa),
                    "role": role,
                    "riskScore": risk_score,
                    "muleScore": n.get("mule_score", 0.0),
                    "bankName": n.get("bank_name", ""),
                    "city": n.get("city", ""),
                    "status": n.get("status", "active"),
                    "bgColor": color,
                    "fullData": n,
                },
            })

        for e in edges:
            elements.append({
                "group": "edges",
                "data": {
                    "id": e.get("id", f"edge-{e.get('source')}-{e.get('target')}"),
                    "source": e.get("source"),
                    "target": e.get("target"),
                    "label": f"₹{int(e.get('amount', 0)):,}",
                    "amount": e.get("amount", 0.0),
                    "timestamp": e.get("timestamp", ""),
                    "riskScore": e.get("risk_score", 0),
                    "decision": e.get("decision", "approved"),
                    "txRef": e.get("tx_ref", ""),
                    "fullData": e,
                },
            })

        return elements


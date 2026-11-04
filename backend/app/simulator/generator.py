"""
StreamShield Simulator — Procedural Attack & Stream Generator

Procedurally synthesizes transaction streams and network structures according
to user configuration for the 6 core financial crime attack scenarios.
"""

from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone, timedelta
import random

from app.simulator.scenarios import SCENARIO_CATALOG


class ScenarioStreamGenerator:
    """
    Procedurally synthesizes graph nodes and transaction event sequences.
    """

    def generate_scenario_stream(
        self,
        scenario_id: str,
        volume: int,
        intermediaries: int,
        amount_min: float,
        amount_max: float,
        noise_ratio: float = 0.20,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Generates:
            - accounts: List of generated account dicts
            - transactions: List of synthetic transaction event dicts
        """
        scenario = next((s for s in SCENARIO_CATALOG if s["id"] == scenario_id), SCENARIO_CATALOG[0])
        rule_triggers = scenario["key_rule_triggers"]

        accounts: List[Dict[str, Any]] = []
        transactions: List[Dict[str, Any]] = []

        now = datetime.now(timezone.utc)
        curr_time = now - timedelta(minutes=volume)

        n_noise = int(volume * noise_ratio)
        n_attack = max(1, volume - n_noise)

        # Dispatch procedural topology synthesizer
        if scenario_id == "funnel-attack":
            accounts, txs = self._generate_funnel(intermediaries, n_attack, amount_min, amount_max, curr_time, rule_triggers)
        elif scenario_id == "smurfing-split":
            accounts, txs = self._generate_smurfing(intermediaries, n_attack, amount_min, amount_max, curr_time, rule_triggers)
        elif scenario_id == "circular-transfers":
            accounts, txs = self._generate_circular(intermediaries, n_attack, amount_min, amount_max, curr_time, rule_triggers)
        elif scenario_id == "layering-intermediates":
            accounts, txs = self._generate_layering(intermediaries, n_attack, amount_min, amount_max, curr_time, rule_triggers)
        elif scenario_id == "coordinated-mule-network":
            accounts, txs = self._generate_coordinated(intermediaries, n_attack, amount_min, amount_max, curr_time, rule_triggers)
        else:
            accounts, txs = self._generate_adaptive(intermediaries, n_attack, amount_min, amount_max, curr_time, rule_triggers)

        transactions.extend(txs)

        # Inject benign noise transactions (Swiggy, groceries, peer transfers)
        if n_noise > 0:
            noise_accs, noise_txs = self._generate_benign_noise(n_noise, curr_time)
            accounts.extend(noise_accs)
            transactions.extend(noise_txs)

        # Shuffle chronologically
        transactions.sort(key=lambda x: x["timestamp"])

        return accounts, transactions

    def _generate_funnel(
        self, n_victims: int, total_tx: int, amt_min: float, amt_max: float, start_t: datetime, rules: List[str]
    ):
        accs = []
        txs = []

        # Central aggregator node
        aggregator_vpa = "sim_aggregator_drop@paytm"
        accs.append({
            "id": "node-aggregator",
            "vpa": aggregator_vpa,
            "owner_name": "Apex Mobile Pay (Collector)",
            "role": "first_mule",
            "bank_name": "Paytm Payments Bank",
            "city": "Noida, UP",
            "risk_score": 92,
            "account_age_days": 6,
            "status": "under_surveillance",
        })

        # Terminal exit sink
        terminal_vpa = "sim_crypto_sink@kotak"
        accs.append({
            "id": "node-terminal-exit",
            "vpa": terminal_vpa,
            "owner_name": "Kuber Digital Assets (Offshore Sink)",
            "role": "consolidation",
            "bank_name": "Kotak Mahindra Bank",
            "city": "Mumbai, MH",
            "risk_score": 96,
            "account_age_days": 12,
            "status": "frozen",
        })

        # Generate victims
        victim_vpas = []
        for i in range(1, n_victims + 1):
            v_vpa = f"victim_entity_{i}@okhdfcbank"
            victim_vpas.append(v_vpa)
            accs.append({
                "id": f"node-victim-{i}",
                "vpa": v_vpa,
                "owner_name": f"Victim Account #{i}",
                "role": "source",
                "bank_name": "HDFC Bank",
                "city": "Bengaluru, KA",
                "risk_score": 25,
                "account_age_days": 500 + i * 20,
                "status": "active",
            })

        # Emitted transactions into collector
        t = start_t
        total_funneled = 0.0
        for i in range(total_tx - 1):
            src = random.choice(victim_vpas)
            amt = round(random.uniform(amt_min, amt_max), 2)
            total_funneled += amt
            t += timedelta(seconds=random.randint(15, 60))
            txs.append({
                "id": f"SIM-TXN-{1000 + len(txs)}",
                "sender_vpa": src,
                "sender_name": "Victim User",
                "sender_bank": "HDFC Bank",
                "sender_account_age_days": 600,
                "sender_device_id": f"DEV-VIC-{i % 5}",
                "receiver_vpa": aggregator_vpa,
                "receiver_name": "Apex Mobile Pay",
                "receiver_bank": "Paytm Payments Bank",
                "amount": amt,
                "timestamp": t.isoformat(),
                "channel": "P2P",
                "is_synthetic": True,
                "rule_hint": rules[0],
            })

        # Final massive drain from aggregator into terminal exit
        t += timedelta(seconds=45)
        txs.append({
            "id": f"SIM-TXN-{1000 + len(txs)}",
            "sender_vpa": aggregator_vpa,
            "sender_name": "Apex Mobile Pay",
            "sender_bank": "Paytm Payments Bank",
            "sender_account_age_days": 6,
            "sender_device_id": "DEV-MULE-EXIT",
            "receiver_vpa": terminal_vpa,
            "receiver_name": "Kuber Digital Assets",
            "receiver_bank": "Kotak Mahindra Bank",
            "amount": round(total_funneled * 0.98, 2),
            "timestamp": t.isoformat(),
            "channel": "P2P",
            "is_synthetic": True,
            "rule_hint": rules[1],
        })

        return accs, txs

    def _generate_smurfing(
        self, n_mules: int, total_tx: int, amt_min: float, amt_max: float, start_t: datetime, rules: List[str]
    ):
        accs = []
        txs = []

        origin_vpa = "sim_corp_origin@okaxis"
        accs.append({
            "id": "node-smurf-origin",
            "vpa": origin_vpa,
            "owner_name": "Targeted Corporate Source",
            "role": "source",
            "bank_name": "Axis Bank",
            "city": "Mumbai, MH",
            "risk_score": 88,
            "account_age_days": 450,
            "status": "under_surveillance",
        })

        mule_vpas = []
        for i in range(1, n_mules + 1):
            m_vpa = f"sim_pocket_pay_{i:02d}@paytm"
            mule_vpas.append(m_vpa)
            accs.append({
                "id": f"node-smurf-mule-{i}",
                "vpa": m_vpa,
                "owner_name": f"Micro-Mule Wallet #{i}",
                "role": "first_mule",
                "bank_name": "Paytm Payments Bank",
                "city": "Jaipur, RJ",
                "risk_score": 76,
                "account_age_days": 2,
                "status": "frozen",
            })

        t = start_t
        for i in range(total_tx):
            dest = mule_vpas[i % len(mule_vpas)]
            # Force values strictly between 40,000 and 49,990 to trigger boundary rule
            amt = round(random.uniform(max(amt_min, 40000.0), min(amt_max, 49950.0)), 2)
            t += timedelta(seconds=random.randint(10, 30))
            txs.append({
                "id": f"SIM-TXN-{1000 + len(txs)}",
                "sender_vpa": origin_vpa,
                "sender_name": "Corporate Source",
                "sender_bank": "Axis Bank",
                "sender_account_age_days": 450,
                "sender_device_id": "DEV-SMURF-EMITTER",
                "receiver_vpa": dest,
                "receiver_name": f"Micro Mule {i+1}",
                "receiver_bank": "Paytm Payments Bank",
                "amount": amt,
                "timestamp": t.isoformat(),
                "channel": "P2P",
                "is_synthetic": True,
                "rule_hint": rules[0],
            })

        return accs, txs

    def _generate_circular(
        self, n_ring: int, total_tx: int, amt_min: float, amt_max: float, start_t: datetime, rules: List[str]
    ):
        accs = []
        txs = []

        ring_vpas = []
        for i in range(1, n_ring + 1):
            vpa = f"sim_shell_firm_{chr(64 + i)}@okicici"
            ring_vpas.append(vpa)
            accs.append({
                "id": f"node-ring-{i}",
                "vpa": vpa,
                "owner_name": f"Shell Enterprise {chr(64 + i)} LLP",
                "role": "intermediate",
                "bank_name": "ICICI Bank",
                "city": "Surat, GJ",
                "risk_score": 85,
                "account_age_days": 14,
                "status": "under_surveillance",
            })

        t = start_t
        base_amt = round(random.uniform(amt_min, amt_max), 2)

        for i in range(total_tx):
            src_idx = i % n_ring
            dst_idx = (i + 1) % n_ring
            src = ring_vpas[src_idx]
            dst = ring_vpas[dst_idx]

            # Minus small deduction representing platform gas
            amt = round(base_amt * (1.0 - (i * 0.002)), 2)
            t += timedelta(seconds=random.randint(20, 60))

            txs.append({
                "id": f"SIM-TXN-{1000 + len(txs)}",
                "sender_vpa": src,
                "sender_name": f"Shell {chr(65 + src_idx)}",
                "sender_bank": "ICICI Bank",
                "sender_account_age_days": 14,
                "sender_device_id": f"DEV-CYCLE-{src_idx}",
                "receiver_vpa": dst,
                "receiver_name": f"Shell {chr(65 + dst_idx)}",
                "receiver_bank": "ICICI Bank",
                "amount": amt,
                "timestamp": t.isoformat(),
                "channel": "P2P",
                "is_synthetic": True,
                "rule_hint": rules[0],
            })

        return accs, txs

    def _generate_layering(
        self, n_layers: int, total_tx: int, amt_min: float, amt_max: float, start_t: datetime, rules: List[str]
    ):
        accs = []
        txs = []

        src_vpa = "sim_layer_victim@okhdfcbank"
        accs.append({
            "id": "node-layer-victim",
            "vpa": src_vpa,
            "owner_name": "Compromised HNWI",
            "role": "source",
            "bank_name": "HDFC Bank",
            "city": "Delhi, DL",
            "risk_score": 90,
            "account_age_days": 800,
            "status": "under_surveillance",
        })

        exit_vpa = "sim_layer_exit@indus"
        accs.append({
            "id": "node-layer-exit",
            "vpa": exit_vpa,
            "owner_name": "Offshore Trade Settlement",
            "role": "consolidation",
            "bank_name": "IndusInd Bank",
            "city": "Mumbai, MH",
            "risk_score": 95,
            "account_age_days": 35,
            "status": "frozen",
        })

        tier_vpas = []
        for i in range(1, n_layers + 1):
            t_vpa = f"sim_wash_conduit_{i:02d}@yesbank"
            tier_vpas.append(t_vpa)
            accs.append({
                "id": f"node-layer-tier-{i}",
                "vpa": t_vpa,
                "owner_name": f"Silverline Conduit Tier {i}",
                "role": "intermediate",
                "bank_name": "Yes Bank",
                "city": "Indore, MP",
                "risk_score": 78,
                "account_age_days": 18,
                "status": "under_surveillance",
            })

        t = start_t
        for i in range(total_tx):
            # Chain forward: src -> tier_1 -> tier_2 -> ... -> exit
            step = i % (len(tier_vpas) + 1)
            if step == 0:
                s, d = src_vpa, tier_vpas[0]
            elif step == len(tier_vpas):
                s, d = tier_vpas[-1], exit_vpa
            else:
                s, d = tier_vpas[step - 1], tier_vpas[step]

            amt = round(random.uniform(amt_min, amt_max), 2)
            t += timedelta(seconds=random.randint(15, 45))

            txs.append({
                "id": f"SIM-TXN-{1000 + len(txs)}",
                "sender_vpa": s,
                "sender_name": "Layering Transit",
                "sender_bank": "Yes Bank",
                "sender_account_age_days": 20,
                "sender_device_id": f"DEV-LAYER-{step}",
                "receiver_vpa": d,
                "receiver_name": "Next Hop",
                "receiver_bank": "Yes Bank",
                "amount": amt,
                "timestamp": t.isoformat(),
                "channel": "P2P",
                "is_synthetic": True,
                "rule_hint": rules[0],
            })

        return accs, txs

    def _generate_coordinated(
        self, n_bots: int, total_tx: int, amt_min: float, amt_max: float, start_t: datetime, rules: List[str]
    ):
        accs = []
        txs = []

        shared_mac = "DEV-BOTNET-SHARED-MAC"
        bot_vpas = []
        for i in range(1, n_bots + 1):
            b_vpa = f"sim_bot_mule_{i:02d}@airtel"
            bot_vpas.append(b_vpa)
            accs.append({
                "id": f"node-bot-{i}",
                "vpa": b_vpa,
                "owner_name": f"Synchronized Bot #{i}",
                "role": "first_mule",
                "bank_name": "Airtel Payments Bank",
                "city": "Nuh, HR",
                "risk_score": 89,
                "account_age_days": 4,
                "status": "frozen",
                "device_fingerprint": shared_mac,
            })

        t = start_t
        for i in range(total_tx):
            src = random.choice(bot_vpas)
            dst = random.choice([b for b in bot_vpas if b != src])
            amt = round(random.uniform(amt_min, amt_max), 2)
            # Micro-burst timing (under 5 seconds)
            t += timedelta(seconds=random.randint(1, 5))

            txs.append({
                "id": f"SIM-TXN-{1000 + len(txs)}",
                "sender_vpa": src,
                "sender_name": "Bot Node",
                "sender_bank": "Airtel Payments Bank",
                "sender_account_age_days": 4,
                "sender_device_id": shared_mac,
                "receiver_vpa": dst,
                "receiver_name": "Peer Bot",
                "receiver_bank": "Airtel Payments Bank",
                "amount": amt,
                "timestamp": t.isoformat(),
                "channel": "P2P",
                "is_synthetic": True,
                "rule_hint": rules[0],
            })

        return accs, txs

    def _generate_adaptive(
        self, n_nodes: int, total_tx: int, amt_min: float, amt_max: float, start_t: datetime, rules: List[str]
    ):
        accs = []
        txs = []

        nodes = []
        for i in range(1, n_nodes + 1):
            vpa = f"sim_adaptive_node_{i:02d}@sbi"
            nodes.append(vpa)
            accs.append({
                "id": f"node-adapt-{i}",
                "vpa": vpa,
                "owner_name": f"Adaptive Entity {i}",
                "role": "intermediate",
                "bank_name": "State Bank of India",
                "city": "Pune, MH",
                "risk_score": 82,
                "account_age_days": 15,
                "status": "under_surveillance",
            })

        t = start_t
        channels = ["P2P", "P2M", "COLLECT", "QR_INTENT"]

        for i in range(total_tx):
            src, dst = random.sample(nodes, 2)
            amt = round(random.uniform(amt_min, amt_max), 2)
            # Stochastic delay jitter
            t += timedelta(seconds=random.randint(5, 120))
            chan = random.choice(channels)

            txs.append({
                "id": f"SIM-TXN-{1000 + len(txs)}",
                "sender_vpa": src,
                "sender_name": "Adaptive Node",
                "sender_bank": "State Bank of India",
                "sender_account_age_days": 15,
                "sender_device_id": f"DEV-ADAPT-{i % 4}",
                "receiver_vpa": dst,
                "receiver_name": "Peer Node",
                "receiver_bank": "State Bank of India",
                "amount": amt,
                "timestamp": t.isoformat(),
                "channel": chan,
                "is_synthetic": True,
                "rule_hint": rules[0],
            })

        return accs, txs

    def _generate_benign_noise(self, count: int, start_t: datetime):
        accs = [
            {
                "id": "node-noise-swiggy",
                "vpa": "swiggy.orders@icici",
                "owner_name": "Bundl Swiggy Express",
                "role": "legitimate",
                "bank_name": "ICICI Bank",
                "city": "Bengaluru, KA",
                "risk_score": 2,
                "account_age_days": 1800,
                "status": "active",
            },
            {
                "id": "node-noise-amul",
                "vpa": "amul.dairy@hdfcbank",
                "owner_name": "Amul Cooperative Store",
                "role": "legitimate",
                "bank_name": "HDFC Bank",
                "city": "Anand, GJ",
                "risk_score": 3,
                "account_age_days": 1500,
                "status": "active",
            },
            {
                "id": "node-noise-priya",
                "vpa": "priya.sharma@sbi",
                "owner_name": "Priya Sharma",
                "role": "legitimate",
                "bank_name": "State Bank of India",
                "city": "Pune, MH",
                "risk_score": 4,
                "account_age_days": 700,
                "status": "active",
            },
        ]

        txs = []
        t = start_t
        for i in range(count):
            amt = round(random.uniform(250.0, 3500.0), 2)
            t += timedelta(seconds=random.randint(10, 50))
            txs.append({
                "id": f"SIM-NOISE-{100 + i}",
                "sender_vpa": "priya.sharma@sbi",
                "sender_name": "Priya Sharma",
                "sender_bank": "State Bank of India",
                "sender_account_age_days": 700,
                "sender_device_id": "DEV-BENIGN-PHONE",
                "receiver_vpa": random.choice(["swiggy.orders@icici", "amul.dairy@hdfcbank"]),
                "receiver_name": "Merchant Retail",
                "receiver_bank": "ICICI Bank",
                "amount": amt,
                "timestamp": t.isoformat(),
                "channel": "P2M",
                "is_synthetic": True,
                "rule_hint": None,
            })

        return accs, txs


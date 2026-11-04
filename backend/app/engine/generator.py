import random
from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Dict, Any
import numpy as np
from app.engine.features import extract_features

HOUR_WEIGHTS = np.array([
    0.01, 0.01, 0.005, 0.005, 0.01, 0.02, # 00-05 Night
    0.04, 0.06, 0.08, 0.09, 0.08, 0.07,  # 06-11 Morning
    0.08, 0.07, 0.06, 0.06, 0.07, 0.08,  # 12-17 Afternoon
    0.09, 0.08, 0.07, 0.04, 0.02, 0.01   # 18-23 Evening
], dtype=np.float64)
HOUR_PROBABILITIES = HOUR_WEIGHTS / HOUR_WEIGHTS.sum()

AMOUNT_WEIGHTS = np.array([0.65, 0.28, 0.07], dtype=np.float64)
AMOUNT_PROBABILITIES = AMOUNT_WEIGHTS / AMOUNT_WEIGHTS.sum()


def generate_synthetic_dataset(
    n_samples: int = 5000,
    fraud_ratio: float = 0.08,
    random_seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]]]:
    """
    Generate realistic synthetic UPI transactions for training and empirical evaluation.
    Balances features across amount, account age, velocity, structuring, device, and beneficiary topology.
    """
    random.seed(random_seed)
    np.random.seed(random_seed)

    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    records: List[Dict[str, Any]] = []
    features_list: List[np.ndarray] = []
    labels: List[int] = []

    banks = ["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Paytm Payments Bank"]
    cities = ["Bengaluru, KA", "Mumbai, MH", "Delhi, DL", "Pune, MH", "Hyderabad, TS", "Ahmedabad, GJ", "Surat, GJ", "Jaipur, RJ"]

    base_time = datetime.now(timezone.utc) - timedelta(days=7)

    # 1. Generate Legitimate Transactions (y = 0)
    for i in range(n_legit):
        tier = int(np.random.choice([1, 2, 3], p=AMOUNT_PROBABILITIES))
        if tier == 1:
            amount = float(random.uniform(20, 1200))
        elif tier == 2:
            amount = float(random.uniform(1200, 15000))
        else:
            amount = float(random.uniform(15000, 65000))

        # Legitimate accounts typically seasoned, but some new users exist
        age_days = int(np.random.exponential(scale=350)) + 15
        hour = int(np.random.choice(range(24), p=HOUR_PROBABILITIES))

        ts = base_time + timedelta(hours=random.uniform(0, 168))
        ts = ts.replace(hour=hour)

        channel = "P2M" if random.random() < 0.60 else "P2P"
        v_count = int(np.random.poisson(lam=1.2)) + 1

        # Legitimate beneficiary activity
        receiver_in = int(random.uniform(2, 300))
        receiver_out = int(random.uniform(2, 300))

        # Standard genuine device
        device_id = f"DEV-STD-{random.randint(1000, 9999)}"

        tx = {
            "id": f"TXN-LEGIT-{i+1:05d}-UPI",
            "sender_vpa": f"consumer_{random.randint(100, 999)}@{random.choice(['okhdfc', 'oksbi', 'okicici'])}",
            "sender_name": f"Genuine User {i+1}",
            "sender_bank": random.choice(banks[:4]),
            "sender_city": random.choice(cities[:5]),
            "sender_device_id": device_id,
            "sender_ip": f"103.24.{random.randint(10, 240)}.{random.randint(1, 250)}",
            "sender_account_age_days": age_days,
            "receiver_vpa": f"merchant_{random.randint(10, 99)}@{random.choice(banks).lower().split()[0]}",
            "receiver_name": f"Verified Retailer {i+1}",
            "receiver_bank": random.choice(banks),
            "amount": round(amount, 2),
            "timestamp": ts.isoformat(),
            "channel": channel,
            "mule_probability": round(random.uniform(0.001, 0.08), 3),
            "is_simulated": True,
        }

        context = {
            "sender_velocity_1h_count": v_count,
            "sender_velocity_1h_amount": amount * v_count,
            "receiver_incoming_count": receiver_in,
            "receiver_outgoing_count": receiver_out,
        }

        fvec = extract_features(tx, context)
        records.append(tx)
        features_list.append(fvec)
        labels.append(0)

    # 2. Generate Fraud / Adversarial Transactions (y = 1)
    fraud_typologies = ["funnel", "smurfing", "fast_drain", "mule_cashout", "night_burst"]

    for j in range(n_fraud):
        typology = random.choice(fraud_typologies)

        if typology == "smurfing":
            # Structured just below reporting threshold ₹50k
            amount = float(random.choice([49999.0, 49500.0, 48500.0, 47000.0, 45500.0]))
            age_days = random.randint(2, 20)
            hour = random.randint(9, 21)
            v_count = random.randint(3, 8)
            channel = "P2P"
            mule_prior = random.uniform(0.70, 0.95)
            device_id = f"DEV-SMURF-{random.randint(10, 99)}"
            receiver_in = random.randint(10, 40)
            receiver_out = random.randint(1, 4)

        elif typology == "funnel":
            # High-velocity max limit funneling
            amount = float(random.uniform(85000, 99500))
            age_days = random.randint(1, 10)
            hour = random.randint(0, 23)
            v_count = random.randint(4, 10)
            channel = "P2P"
            mule_prior = random.uniform(0.85, 0.99)
            device_id = f"DEV-MOCK-EMU-{random.randint(100, 999)}"
            receiver_in = random.randint(20, 80)
            receiver_out = random.randint(1, 5)

        elif typology == "night_burst":
            # Nocturnal siphon between 01:00 and 04:00 AM
            amount = float(random.uniform(45000, 95000))
            age_days = random.randint(4, 45)
            hour = random.randint(1, 4)
            v_count = random.randint(2, 6)
            channel = "P2P"
            mule_prior = random.uniform(0.65, 0.90)
            device_id = f"DEV-ROOT-{random.randint(100, 999)}"
            receiver_in = random.randint(10, 50)
            receiver_out = random.randint(1, 6)

        else: # mule_cashout or fast_drain
            amount = float(random.uniform(35000, 85000))
            age_days = random.randint(2, 30)
            hour = random.randint(8, 23)
            v_count = random.randint(3, 7)
            channel = "P2P"
            mule_prior = random.uniform(0.75, 0.98)
            device_id = f"DEV-AUTO-{random.randint(100, 999)}"
            receiver_in = random.randint(25, 100)
            receiver_out = random.randint(1, 5)

        ts = base_time + timedelta(hours=random.uniform(0, 168))
        ts = ts.replace(hour=hour)

        tx = {
            "id": f"TXN-FRAUD-{j+1:05d}-UPI",
            "sender_vpa": f"mule_source_{random.randint(10, 99)}@airtel",
            "sender_name": f"Suspicious Entity {j+1}",
            "sender_bank": random.choice(banks[4:]),
            "sender_city": random.choice(cities[4:]),
            "sender_device_id": device_id,
            "sender_ip": f"115.110.{random.randint(100, 200)}.{random.randint(1, 250)}",
            "sender_account_age_days": age_days,
            "receiver_vpa": f"crypto_sink_{random.randint(1, 10)}@kotak",
            "receiver_name": f"Terminal Mule Pool {j+1}",
            "receiver_bank": random.choice(banks),
            "amount": round(amount, 2),
            "timestamp": ts.isoformat(),
            "channel": channel,
            "mule_probability": round(mule_prior, 3),
            "is_simulated": True,
        }

        context = {
            "sender_velocity_1h_count": v_count,
            "sender_velocity_1h_amount": amount * v_count,
            "receiver_incoming_count": receiver_in,
            "receiver_outgoing_count": receiver_out,
        }

        fvec = extract_features(tx, context)
        records.append(tx)
        features_list.append(fvec)
        labels.append(1)

    X = np.array(features_list, dtype=np.float32)
    y = np.array(labels, dtype=np.int32)

    return X, y, records

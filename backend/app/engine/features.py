import math
from datetime import datetime, timezone
from typing import Dict, Any, List
import numpy as np

FEATURE_NAMES = [
    "amount",
    "log_amount",
    "amount_to_limit",
    "is_structuring",
    "is_round_number",
    "sender_account_age_days",
    "is_new_account",
    "hour_of_day",
    "is_night_tx",
    "velocity_1h_count",
    "velocity_1h_amount",
    "velocity_spike",
    "receiver_incoming_count",
    "receiver_outgoing_count",
    "receiver_fan_in_ratio",
    "is_p2p",
    "device_is_emulator",
    "mule_prior_score",
]


def extract_features(tx_data: Dict[str, Any], context: Dict[str, Any] = None) -> np.ndarray:
    """Extract an 18-dimensional numerical feature vector for real-time model inference."""
    ctx = context or {}

    amount = float(tx_data.get("amount", 0.0))
    log_amount = float(np.log1p(max(0.0, amount)))
    amount_to_limit = float(amount / 100000.0)

    # Structuring check (just below PAN ₹50,000 threshold)
    is_structuring = 1.0 if (45000.0 <= amount <= 49999.0) else 0.0
    is_round_number = 1.0 if (amount > 0 and amount % 1000 == 0) else 0.0

    sender_age = float(tx_data.get("sender_account_age_days", 365))
    is_new_account = 1.0 if sender_age < 14 else 0.0

    # Timestamp / Circadian analysis
    ts = tx_data.get("timestamp")
    if isinstance(ts, str):
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            dt = datetime.now(timezone.utc)
    elif isinstance(ts, datetime):
        dt = ts
    else:
        dt = datetime.now(timezone.utc)

    hour = float(dt.hour)
    is_night_tx = 1.0 if (1 <= hour <= 4) else 0.0

    # Velocity features from context (or tx_data fallback, then defaults)
    velocity_1h_count = float(ctx.get("sender_velocity_1h_count", tx_data.get("sender_velocity_1h_count", 1)))
    velocity_1h_amount = float(ctx.get("sender_velocity_1h_amount", tx_data.get("sender_velocity_1h_amount", amount)))
    velocity_spike = 1.0 if velocity_1h_count >= 4 else 0.0

    # Beneficiary graph topology proxy
    receiver_in = float(ctx.get("receiver_incoming_count", tx_data.get("receiver_incoming_count", 25)))
    receiver_out = float(ctx.get("receiver_outgoing_count", tx_data.get("receiver_outgoing_count", 25)))
    fan_in_ratio = float((receiver_in + 1.0) / (receiver_out + 1.0))

    channel = tx_data.get("channel", "P2P")
    is_p2p = 1.0 if channel == "P2P" else 0.0

    device_id = str(tx_data.get("sender_device_id", ""))
    is_emulator = 1.0 if any(k in device_id.lower() for k in ["auto", "mock", "emu", "root", "dev-sm", "bot", "mule"]) else 0.0

    mule_prior = float(tx_data.get("mule_probability", 0.0))

    vec = [
        amount,
        log_amount,
        amount_to_limit,
        is_structuring,
        is_round_number,
        sender_age,
        is_new_account,
        hour,
        is_night_tx,
        velocity_1h_count,
        velocity_1h_amount,
        velocity_spike,
        receiver_in,
        receiver_out,
        fan_in_ratio,
        is_p2p,
        is_emulator,
        mule_prior,
    ]

    return np.array(vec, dtype=np.float32)


def explain_prediction(
    features: np.ndarray,
    risk_score: int,
    tx_data: Dict[str, Any],
) -> List[str]:
    """Derive human-readable, auditable SHAP-style explanation reasons for suspicious decisions."""
    reasons = []

    amount = features[0]
    is_structuring = features[3]
    sender_age = features[5]
    is_night = features[8]
    velocity_count = features[9]
    velocity_spike = features[11]
    fan_in_ratio = features[14]
    is_emulator = features[16]
    mule_prior = features[17]

    # Primary high-impact explanations
    if is_structuring > 0.5:
        reasons.append(f"Amount (₹{amount:,.0f}) structured just below ₹50,000 statutory reporting threshold")

    if sender_age < 14 and amount > 50000:
        reasons.append(f"Account age is only {int(sender_age)} days with high-ticket outbound debit (₹{amount:,.0f})")
    elif sender_age < 30 and amount > 25000:
        reasons.append(f"Newly registered account ({int(sender_age)} days) exceeding standard seasoning ticket size")

    if velocity_spike > 0.5:
        reasons.append(f"High-frequency velocity burst: {int(velocity_count)} outbound transactions in past 60 minutes")

    if fan_in_ratio > 3.5:
        reasons.append(f"Beneficiary exhibits anomalous fan-in ratio ({fan_in_ratio:.1f}x incoming/outgoing multiplier)")

    if is_emulator > 0.5:
        reasons.append("Client device hardware fingerprint matches rooted environment or mock location framework")

    if is_night > 0.5 and amount > 30000:
        reasons.append("Unusual nocturnal settlement window (01:00-04:00 AM) with high-value transfer")

    if mule_prior >= 0.8:
        reasons.append(f"Graph topology prior flags beneficiary as suspected mule cluster node ({int(mule_prior*100)}% confidence)")

    # Baseline justification if score is elevated but specific rule didn't hit
    if not reasons:
        if risk_score >= 70:
            reasons.append("Composite behavioral anomaly: Divergence from established UPI consumer velocity baseline")
        else:
            reasons.append("Verified low-friction consumer payment baseline")

    return reasons

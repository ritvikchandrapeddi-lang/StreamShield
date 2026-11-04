from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.transaction import TransactionModel
from app.models.account import AccountModel
from app.models.alert import AlertModel
from app.models.investigation import CaseModel
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.transaction import TransactionResponse
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard Intelligence"])


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    summary="Get Aggregated Dashboard Telemetry",
    description="Calculates real-time KPIs, monitored volume in INR, risk distribution, and active alerts across synthetic transaction fixtures.",
)
def get_dashboard_stats(
    window: str = Query("24h", pattern="^(1h|24h|7d|30d)$", description="Evaluation time horizon"),
    db: Session = Depends(get_db),
):
    # Total Monitored Volume and counts
    tx_query = db.query(TransactionModel)
    total_tx = tx_query.count()

    monitored_volume = db.query(func.coalesce(func.sum(TransactionModel.amount), 0.0)).scalar()
    avg_risk = db.query(func.coalesce(func.avg(TransactionModel.risk_score), 0.0)).scalar()

    blocked_count = tx_query.filter(TransactionModel.decision == "blocked").count()
    review_count = tx_query.filter(TransactionModel.decision == "review").count()
    approved_count = tx_query.filter(TransactionModel.decision == "approved").count()
    flagged_count = blocked_count + review_count

    # Risk Distribution
    risk_distribution = {
        "critical": tx_query.filter(TransactionModel.risk_level == "critical").count(),
        "high": tx_query.filter(TransactionModel.risk_level == "high").count(),
        "medium": tx_query.filter(TransactionModel.risk_level == "medium").count(),
        "low": tx_query.filter(TransactionModel.risk_level == "low").count(),
    }

    # Active accounts / investigations
    mule_accounts = db.query(AccountModel).filter(AccountModel.role.in_(["first_mule", "intermediate", "consolidation"])).count()
    active_cases = db.query(CaseModel).filter(CaseModel.status != "resolved").count()

    # Recent Alerts
    recent_alerts_objs = db.query(AlertModel).order_by(AlertModel.created_at.desc()).limit(5).all()
    recent_alerts = [AlertResponse.model_validate(a) for a in recent_alerts_objs]

    # Recent High-Risk Transactions
    high_risk_tx_objs = (
        db.query(TransactionModel)
        .filter(TransactionModel.risk_level.in_(["high", "critical"]))
        .order_by(TransactionModel.timestamp.desc())
        .limit(6)
        .all()
    )
    recent_high_risk = [TransactionResponse.model_validate(t) for t in high_risk_tx_objs]

    # Stream Telemetry
    stream_telemetry = {
        "p50_latency_ms": 4.2,
        "p95_latency_ms": 9.8,
        "p99_latency_ms": 14.1,
        "pipeline_tps": 4850,
        "active_rules_loaded": 48,
        "gnn_version": "GNN-Hybrid-v2.1",
        "last_synced_at": datetime.now(timezone.utc).isoformat(),
    }

    return DashboardStatsResponse(
        monitored_volume_inr=float(monitored_volume),
        total_transactions=total_tx,
        flagged_transactions=flagged_count,
        blocked_transactions=blocked_count,
        review_transactions=review_count,
        approved_transactions=approved_count,
        active_mule_accounts=mule_accounts,
        active_investigations=active_cases,
        average_risk_score=round(float(avg_risk), 1),
        system_status="operational",
        evaluated_window=window,
        is_simulated=True,
        risk_distribution=risk_distribution,
        recent_alerts=recent_alerts,
        recent_high_risk_transactions=recent_high_risk,
        stream_telemetry=stream_telemetry,
    )

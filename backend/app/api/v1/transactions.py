import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.transaction import TransactionModel
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionListResponse,
    TransactionDecisionUpdate,
    RiskLevel,
    Decision,
)

router = APIRouter(prefix="/transactions", tags=["Transaction Monitoring"])


@router.get(
    "",
    response_model=TransactionListResponse,
    summary="Search & Filter Transactions",
    description="Retrieve paginated transactions with multi-field search, risk level filtering, decision state, and amount range.",
)
def list_transactions(
    q: Optional[str] = Query(None, description="Search term for ID, sender/receiver VPA or name"),
    risk_level: Optional[RiskLevel] = Query(None, description="Filter by risk tier"),
    decision: Optional[Decision] = Query(None, description="Filter by automated or manual decision"),
    channel: Optional[str] = Query(None, pattern="^(P2P|P2M)$", description="Filter by UPI channel"),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum transaction amount in INR"),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum transaction amount in INR"),
    sort_by: str = Query("timestamp", pattern="^(timestamp|amount|risk_score)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(TransactionModel)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                TransactionModel.id.ilike(search_pattern),
                TransactionModel.sender_vpa.ilike(search_pattern),
                TransactionModel.sender_name.ilike(search_pattern),
                TransactionModel.receiver_vpa.ilike(search_pattern),
                TransactionModel.receiver_name.ilike(search_pattern),
            )
        )

    if risk_level:
        query = query.filter(TransactionModel.risk_level == risk_level)

    if decision:
        query = query.filter(TransactionModel.decision == decision)

    if channel:
        query = query.filter(TransactionModel.channel == channel)

    if min_amount is not None:
        query = query.filter(TransactionModel.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(TransactionModel.amount <= max_amount)

    total = query.count()

    # Dynamic sorting
    sort_column = getattr(TransactionModel, sort_by)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    records = query.offset(skip).limit(limit).all()

    return TransactionListResponse(
        transactions=[TransactionResponse.model_validate(r) for r in records],
        total=total,
        limit=limit,
        skip=skip,
    )


@router.get(
    "/{id}",
    response_model=TransactionResponse,
    summary="Get Transaction Dossier",
    description="Retrieve comprehensive risk factors, behavioral metadata, and channel attributes for a single transaction.",
)
def get_transaction(id: str, db: Session = Depends(get_db)):
    tx = db.query(TransactionModel).filter(TransactionModel.id == id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{id}' was not found in the ledger.",
        )
    return TransactionResponse.model_validate(tx)


@router.patch(
    "/{id}/decision",
    response_model=TransactionResponse,
    summary="Update Transaction Disposition",
    description="Analyst action to approve, review, or quarantine a transaction.",
)
def update_transaction_decision(
    id: str,
    payload: TransactionDecisionUpdate,
    db: Session = Depends(get_db),
):
    tx = db.query(TransactionModel).filter(TransactionModel.id == id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{id}' was not found.",
        )

    tx.decision = payload.decision
    if payload.reason:
        updated_factors = list(tx.risk_factors or [])
        updated_factors.append(f"Analyst Disposition ({payload.decision.upper()}): {payload.reason}")
        tx.risk_factors = updated_factors

    db.commit()
    db.refresh(tx)
    return TransactionResponse.model_validate(tx)


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Real-Time Transaction Event",
    description="Ingests a simulated or live UPI event into the scoring pipeline and persists it in the audit ledger.",
)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    tx_id = payload.id or f"TXN-{uuid.uuid4().hex[:8].upper()}-UPI"

    # Auto-derive risk level if not consistent
    risk_level = payload.risk_level
    if payload.risk_score >= 90:
        risk_level = "critical"
    elif payload.risk_score >= 70:
        risk_level = "high"
    elif payload.risk_score >= 40:
        risk_level = "medium"
    else:
        risk_level = "low"

    new_tx = TransactionModel(
        id=tx_id,
        sender_vpa=payload.sender_vpa,
        sender_name=payload.sender_name,
        sender_bank=payload.sender_bank,
        sender_city=payload.sender_city,
        sender_device_id=payload.sender_device_id,
        sender_ip=payload.sender_ip,
        sender_account_age_days=payload.sender_account_age_days,
        receiver_vpa=payload.receiver_vpa,
        receiver_name=payload.receiver_name,
        receiver_bank=payload.receiver_bank,
        amount=payload.amount,
        timestamp=datetime.now(timezone.utc),
        risk_score=payload.risk_score,
        risk_level=risk_level,
        decision=payload.decision,
        risk_factors=payload.risk_factors,
        latency_ms=payload.latency_ms or 5.2,
        channel=payload.channel,
        mule_probability=payload.mule_probability,
        is_simulated=payload.is_simulated,
    )

    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return TransactionResponse.model_validate(new_tx)

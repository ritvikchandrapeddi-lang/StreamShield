from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.account import AccountModel
from app.models.transaction import TransactionModel
from app.schemas.account import AccountCreate, AccountResponse, AccountRole, AccountStatus
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/accounts", tags=["Account & Mule Intelligence"])


@router.get(
    "",
    response_model=List[AccountResponse],
    summary="List Accounts & Graph Nodes",
    description="Retrieve registered accounts, mule nodes, and synthetic entities with role and status filtering.",
)
def list_accounts(
    role: Optional[AccountRole] = Query(None, description="Filter by topology role"),
    account_status: Optional[AccountStatus] = Query(None, alias="status", description="Filter by compliance state"),
    min_risk: Optional[int] = Query(None, ge=0, le=100, description="Minimum risk score"),
    db: Session = Depends(get_db),
):
    query = db.query(AccountModel)

    if role:
        query = query.filter(AccountModel.role == role)

    if account_status:
        query = query.filter(AccountModel.status == account_status)

    if min_risk is not None:
        query = query.filter(AccountModel.risk_score >= min_risk)

    records = query.order_by(AccountModel.risk_score.desc()).all()
    return [AccountResponse.model_validate(r) for r in records]


@router.get(
    "/{vpa}",
    summary="Get Account Profile & Ledger Flow",
    description="Retrieve full account profile and recent debit/credit transactions for a given VPA.",
)
def get_account_profile(vpa: str, db: Session = Depends(get_db)):
    account = db.query(AccountModel).filter(AccountModel.vpa == vpa).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with VPA '{vpa}' was not found.",
        )

    recent_txs = (
        db.query(TransactionModel)
        .filter(
            or_(
                TransactionModel.sender_vpa == vpa,
                TransactionModel.receiver_vpa == vpa,
            )
        )
        .order_by(TransactionModel.timestamp.desc())
        .limit(10)
        .all()
    )

    return {
        "account": AccountResponse.model_validate(account),
        "recent_transactions": [TransactionResponse.model_validate(t) for t in recent_txs],
        "is_simulated": account.is_simulated,
    }


@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Account Node",
    description="Adds an account entity to the graph intelligence ledger.",
)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    existing = db.query(AccountModel).filter(AccountModel.vpa == payload.vpa).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account with VPA '{payload.vpa}' is already registered.",
        )

    acc_id = payload.id or f"acc-{payload.vpa.replace('@', '-').replace('.', '-')}"
    new_acc = AccountModel(
        id=acc_id,
        vpa=payload.vpa,
        owner_name=payload.owner_name,
        role=payload.role,
        risk_score=payload.risk_score,
        bank_name=payload.bank_name,
        ifsc=payload.ifsc,
        city=payload.city,
        incoming_count=payload.incoming_count,
        outgoing_count=payload.outgoing_count,
        total_incoming=payload.total_incoming,
        total_outgoing=payload.total_outgoing,
        account_age_days=payload.account_age_days,
        status=payload.status,
        device_fingerprint=payload.device_fingerprint,
        is_simulated=payload.is_simulated,
    )
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)
    return AccountResponse.model_validate(new_acc)

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.alert import AlertModel
from app.schemas.alert import AlertCreate, AlertResponse, AlertListResponse, AlertSeverity

router = APIRouter(prefix="/alerts", tags=["Real-Time Fraud Alerts"])


@router.get(
    "",
    response_model=AlertListResponse,
    summary="List Real-Time Fraud Alerts",
    description="Retrieve high-velocity fraud alert notifications with unread filtering and risk tier breakdown.",
)
def list_alerts(
    unread_only: bool = Query(False, description="Filter for unread alerts only"),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by risk severity tier"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(AlertModel)

    if unread_only:
        query = query.filter(AlertModel.read == False)  # noqa: E712

    if severity:
        query = query.filter(AlertModel.severity == severity)

    total = query.count()
    unread_count = db.query(AlertModel).filter(AlertModel.read == False).count()  # noqa: E712
    records = query.order_by(AlertModel.created_at.desc()).limit(limit).all()

    return AlertListResponse(
        alerts=[AlertResponse.model_validate(r) for r in records],
        unread_count=unread_count,
        total=total,
    )


@router.patch(
    "/{id}/read",
    response_model=AlertResponse,
    summary="Mark Alert as Read",
    description="Dismisses or acknowledges an alert from the active notification tray.",
)
def mark_alert_read(id: str, db: Session = Depends(get_db)):
    alert = db.query(AlertModel).filter(AlertModel.id == id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{id}' was not found.",
        )
    alert.read = True
    db.commit()
    db.refresh(alert)
    return AlertResponse.model_validate(alert)


@router.post(
    "/mark-all-read",
    summary="Mark All Alerts as Read",
    description="Acknowledges all active unread alerts in the docket.",
)
def mark_all_alerts_read(db: Session = Depends(get_db)):
    updated = db.query(AlertModel).filter(AlertModel.read == False).update({"read": True})  # noqa: E712
    db.commit()
    return {"message": f"Successfully marked {updated} alerts as read.", "updated_count": updated}


@router.post(
    "",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish Fraud Alert",
    description="Publishes a simulated or automated rule trigger alert to the notification center.",
)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    alert_id = payload.id or f"alt-{uuid.uuid4().hex[:6]}"
    new_alert = AlertModel(
        id=alert_id,
        title=payload.title,
        vpa=payload.vpa,
        time_label=payload.time_label,
        severity=payload.severity,
        tx_id=payload.tx_id,
        case_id=payload.case_id,
        read=payload.read,
        is_simulated=payload.is_simulated,
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return AlertResponse.model_validate(new_alert)


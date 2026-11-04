import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.investigation import CaseModel, CaseNoteModel, CaseEvidenceModel
from app.schemas.investigation import (
    CaseCreate,
    CaseResponse,
    CaseListResponse,
    CaseStatusUpdate,
    CaseNoteCreate,
    CaseNoteUpdate,
    CaseNoteResponse,
    CaseSeverity,
    CaseStatus,
)

router = APIRouter(prefix="/investigations", tags=["Case Investigations Docket"])


@router.get(
    "",
    response_model=CaseListResponse,
    summary="List Case Dossiers",
    description="Retrieve financial crime dossiers with full-text search, severity, and status filtering.",
)
def list_cases(
    q: Optional[str] = Query(None, description="Search term for case ID, title, VPA, or assigned analyst"),
    severity: Optional[CaseSeverity] = Query(None, description="Filter by case severity"),
    case_status: Optional[CaseStatus] = Query(None, alias="status", description="Filter by lifecycle status"),
    db: Session = Depends(get_db),
):
    query = db.query(CaseModel)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                CaseModel.id.ilike(search_pattern),
                CaseModel.title.ilike(search_pattern),
                CaseModel.primary_account.ilike(search_pattern),
                CaseModel.primary_entity_name.ilike(search_pattern),
                CaseModel.assigned_analyst.ilike(search_pattern),
            )
        )

    if severity:
        query = query.filter(CaseModel.severity == severity)

    if case_status:
        query = query.filter(CaseModel.status == case_status)

    total = query.count()
    records = query.order_by(CaseModel.created_at.desc()).all()

    return CaseListResponse(
        cases=[CaseResponse.model_validate(c) for c in records],
        total=total,
    )


@router.get(
    "/{id}",
    response_model=CaseResponse,
    summary="Get Case Dossier Details",
    description="Retrieve full audit evidence timeline, attached transactions, and analyst notes for a case.",
)
def get_case(id: str, db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case dossier '{id}' was not found.",
        )
    return CaseResponse.model_validate(case)


@router.patch(
    "/{id}/status",
    response_model=CaseResponse,
    summary="Update Case Status",
    description="Transition case lifecycle status (open, investigating, escalated, resolved).",
)
def update_case_status(
    id: str,
    payload: CaseStatusUpdate,
    db: Session = Depends(get_db),
):
    case = db.query(CaseModel).filter(CaseModel.id == id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case dossier '{id}' was not found.",
        )
    case.status = payload.status
    db.commit()
    db.refresh(case)
    return CaseResponse.model_validate(case)


@router.post(
    "/{id}/notes",
    response_model=CaseNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Analyst Disposition Note",
    description="Appends an analyst finding or law enforcement record to the case audit log.",
)
def add_case_note(
    id: str,
    payload: CaseNoteCreate,
    db: Session = Depends(get_db),
):
    case = db.query(CaseModel).filter(CaseModel.id == id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case dossier '{id}' was not found.",
        )

    now_str = datetime.now(timezone.utc).strftime("%b %d, %Y • %H:%M")
    note = CaseNoteModel(
        id=f"note-{uuid.uuid4().hex[:6]}",
        case_id=case.id,
        author=payload.author,
        timestamp=now_str,
        text=payload.text,
        badge=payload.badge or "Analyst Entry",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return CaseNoteResponse.model_validate(note)


@router.patch(
    "/{id}/notes/{note_id}",
    response_model=CaseNoteResponse,
    summary="Edit Analyst Note",
    description="Modifies the narrative text of an existing analyst disposition note.",
)
def edit_case_note(
    id: str,
    note_id: str,
    payload: CaseNoteUpdate,
    db: Session = Depends(get_db),
):
    note = (
        db.query(CaseNoteModel)
        .filter(CaseNoteModel.case_id == id, CaseNoteModel.id == note_id)
        .first()
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note '{note_id}' in case '{id}' was not found.",
        )
    note.text = payload.text
    db.commit()
    db.refresh(note)
    return CaseNoteResponse.model_validate(note)


@router.delete(
    "/{id}/notes/{note_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Analyst Note",
    description="Removes an analyst note from the case dossier.",
)
def delete_case_note(id: str, note_id: str, db: Session = Depends(get_db)):
    note = (
        db.query(CaseNoteModel)
        .filter(CaseNoteModel.case_id == id, CaseNoteModel.id == note_id)
        .first()
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note '{note_id}' in case '{id}' was not found.",
        )
    db.delete(note)
    db.commit()
    return {"message": f"Successfully deleted note '{note_id}'.", "deleted": True}


@router.get(
    "/{id}/export",
    summary="Export Section 91 CrPC Forensic Bundle",
    description="Generates a structured statutory audit bundle suitable for LEA and CERT-In submission.",
)
def export_lea_bundle(id: str, db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case dossier '{id}' was not found.",
        )

    bundle = {
        "statutory_notice": "Forensic Evidence Bundle generated under Section 91 CrPC / CERT-In Cyber Security Directions",
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "case_id": case.id,
        "title": case.title,
        "severity": case.severity,
        "status": case.status,
        "primary_suspect_account": case.primary_account,
        "primary_entity_name": case.primary_entity_name,
        "total_disputed_amount_inr": case.total_disputed_amount,
        "transaction_count": case.transaction_count,
        "associated_transaction_ids": case.associated_tx_ids,
        "risk_indicators": case.risk_indicators,
        "evidence_timeline": [
            {
                "time": ev.time,
                "title": ev.title,
                "description": ev.description,
                "category": ev.category,
                "severity": ev.severity,
            }
            for ev in case.evidence
        ],
        "analyst_audit_log": [
            {
                "author": nt.author,
                "timestamp": nt.timestamp,
                "badge": nt.badge,
                "text": nt.text,
            }
            for nt in case.notes
        ],
        "is_simulated": case.is_simulated,
    }
    return bundle


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Case Dossier",
    description="Registers a new financial crime investigation dossier in the system.",
)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    case_id = payload.id or f"CASE-2026-{uuid.uuid4().hex[:4].upper()}"
    new_case = CaseModel(
        id=case_id,
        title=payload.title,
        severity=payload.severity,
        status=payload.status,
        date_created=payload.date_created,
        primary_account=payload.primary_account,
        primary_entity_name=payload.primary_entity_name,
        transaction_count=payload.transaction_count,
        total_disputed_amount=payload.total_disputed_amount,
        description=payload.description,
        assigned_analyst=payload.assigned_analyst,
        risk_indicators=payload.risk_indicators,
        associated_tx_ids=payload.associated_tx_ids,
        is_simulated=payload.is_simulated,
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return CaseResponse.model_validate(new_case)

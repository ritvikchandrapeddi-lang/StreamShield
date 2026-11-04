from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.engine.pipeline import fraud_pipeline
from app.engine.model import fraud_model
from app.engine.generator import generate_synthetic_dataset

router = APIRouter(prefix="/fraud", tags=["Fraud Detection & ML Engine"])


class FraudScoreRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction ticket size in INR (₹)")
    sender_vpa: str = Field(..., description="Debited customer VPA")
    sender_name: Optional[str] = Field("Unknown Sender", description="Debited customer title")
    sender_bank: Optional[str] = Field("State Bank of India", description="Issuing bank")
    sender_city: Optional[str] = Field(None, description="Initiating geography")
    sender_device_id: Optional[str] = Field(None, description="Hardware IMEI/MAC fingerprint")
    sender_account_age_days: int = Field(365, ge=0, description="Sender account seasoning in days")
    receiver_vpa: str = Field(..., description="Beneficiary VPA")
    receiver_name: Optional[str] = Field("Beneficiary Entity", description="Beneficiary legal title")
    receiver_bank: Optional[str] = Field("HDFC Bank", description="Acquiring bank")
    channel: str = Field("P2P", description="Payment channel: P2P, P2M, COLLECT")
    mule_probability: Optional[float] = Field(0.0, ge=0.0, le=1.0, description="Graph prior mule probability")


class FraudScoreResponse(BaseModel):
    risk_score: int
    fraud_probability: float
    risk_level: str
    decision: str
    risk_factors: List[str]
    latency_ms: float
    mule_probability: float
    features: Dict[str, float]
    model_version: str
    is_simulated: bool


class RetrainRequest(BaseModel):
    n_samples: int = Field(5000, ge=500, le=20000, description="Synthetic training samples count")


@router.post(
    "/score",
    response_model=FraudScoreResponse,
    summary="Real-Time Transaction Scoring & SHAP Explanations",
    description="Scores an incoming UPI payment event using the trained XGBoost model and returns explainable risk factors.",
)
def score_transaction(
    payload: FraudScoreRequest,
    db: Session = Depends(get_db),
):
    result = fraud_pipeline.process_transaction(
        payload.model_dump(),
        db=db,
        create_alert_if_flagged=False,
    )
    return FraudScoreResponse(**result)


@router.get(
    "/model-info",
    summary="Get Active Model Architecture & Metadata",
    description="Returns current active model weights version, training timestamp, and feature importances.",
)
def get_model_info():
    return fraud_model.get_evaluation_report()


@router.get(
    "/evaluate",
    summary="Empirical Model Performance & Confusion Matrix",
    description="Returns empirical evaluation metrics (Precision, Recall, F1, FPR, ROC-AUC) on a held-out test split.",
)
def evaluate_model():
    report = fraud_model.get_evaluation_report()
    return {
        "status": "success",
        "evaluation": report,
        "disclaimer": "Metrics are evaluated on synthetic UPI adversarial and genuine behavioral fixtures.",
    }


@router.post(
    "/train",
    summary="Train / Fine-Tune Model",
    description="Generates a fresh synthetic dataset, fits the XGBoost/GradientBoosting estimator, and saves updated weights.",
)
def retrain_model(payload: RetrainRequest = RetrainRequest()):
    report = fraud_model.train_and_evaluate(n_samples=payload.n_samples)
    return {
        "status": "success",
        "message": f"Successfully retrained {report.get('model_architecture')} on {report.get('train_samples')} samples.",
        "evaluation": report,
    }


@router.get(
    "/synthetic-batch",
    summary="Generate Synthetic Transactions Batch",
    description="Generates a batch of labeled synthetic transactions (genuine vs adversarial typologies) for simulation.",
)
def generate_batch(
    n: int = Query(20, ge=1, le=100, description="Batch size"),
    fraud_ratio: float = Query(0.3, ge=0.0, le=1.0, description="Fraction of fraudulent examples"),
):
    _, _, records = generate_synthetic_dataset(n_samples=n, fraud_ratio=fraud_ratio)
    return {
        "batch_size": len(records),
        "is_simulated": True,
        "transactions": records,
    }


from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.seed import force_reseed

router = APIRouter(prefix="/seed", tags=["Demonstration Seeding"])


@router.post(
    "/reset",
    summary="Reset Synthetic Demonstration Data",
    description="Clears and re-seeds all synthetic transactions, accounts, alerts, and cases with fresh demonstration fixtures.",
)
def reset_seed_data(db: Session = Depends(get_db)):
    force_reseed(db)
    return {
        "status": "success",
        "message": "All demonstration tables have been successfully reseeded with synthetic fixtures.",
    }


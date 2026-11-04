from fastapi import APIRouter
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.investigations import router as investigations_router
from app.api.v1.accounts import router as accounts_router
from app.api.v1.fraud import router as fraud_router
from app.api.v1.seed import router as seed_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(investigations_router)
api_v1_router.include_router(accounts_router)
api_v1_router.include_router(fraud_router)
api_v1_router.include_router(seed_router)

__all__ = ["api_v1_router"]

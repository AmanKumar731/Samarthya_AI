from fastapi import APIRouter
from app.models.schemas import HealthResponse, BeneficiaryProfile, PredictionResponse
from app.services.core_service import CoreService
from app.core.config import settings
from datetime import datetime, timezone

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        environment=settings.APP_ENV,
        version="2.0.0",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.post("/api/v1/predict", response_model=PredictionResponse)
def predict(profile: BeneficiaryProfile) -> PredictionResponse:
    return CoreService.evaluate(profile)

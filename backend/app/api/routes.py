from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from app.models.schemas import (
    HealthResponse,
    BeneficiaryProfile,
    PredictionResponse,
    StudentProfile,
    MatchResponse,
    CreditApplicantProfile,
    CreditMatchResponse,
)
from app.services.core_service import CoreService
from app.services.matching_service import (
    schemes_data,
    match_student_profile,
    match_credit_profile,
)
from app.core.config import settings

router = APIRouter()

@router.get("/", summary="API Root & Overview")
def root_info() -> Dict[str, Any]:
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "environment": settings.APP_ENV,
        "version": "2.0.0",
        "endpoints": {
            "GET /health": "Microservice health check",
            "GET /api/metadata": "Indian states, categories, education levels, disability types",
            "GET /api/schemes": "Complete database of active welfare schemes",
            "POST /api/match": "Evaluate student/citizen profile for scheme eligibility",
            "GET /api/credit-schemes": "NSFDC concessional loan credit schemes",
            "GET /api/channel-partners": "State Allocating Agencies & channel partners",
            "POST /api/match-credit": "Evaluate credit readiness & loan scheme match",
            "POST /api/v1/predict": "AI credit readiness score and recommendation pipeline",
        }
    }

@router.get("/health", response_model=HealthResponse, summary="Health Check")
def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        environment=settings.APP_ENV,
        version="2.0.0",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.get("/api/metadata", summary="Fetch System Reference Metadata")
def get_metadata() -> Dict[str, Any]:
    return {
        "states": schemes_data.get("INDIAN_STATES", []),
        "educationLevels": schemes_data.get("EDUCATION_LEVELS", []),
        "disabilityTypes": schemes_data.get("DISABILITY_TYPES", []),
        "categories": schemes_data.get("SCHEME_CATEGORIES", {})
    }

@router.get("/api/schemes", summary="Fetch All Welfare Schemes")
def get_schemes() -> List[Dict[str, Any]]:
    return schemes_data.get("SCHEME_DATABASE", [])

@router.post("/api/match", response_model=MatchResponse, summary="Match Citizen Profile with Schemes")
def match_profile(profile: StudentProfile) -> MatchResponse:
    return match_student_profile(profile)

@router.get("/api/credit-schemes", summary="Fetch NSFDC Concessional Credit Schemes")
def get_credit_schemes() -> List[Dict[str, Any]]:
    return schemes_data.get("CREDIT_SCHEME_DATABASE", [])

@router.get("/api/channel-partners", summary="List Channel Partners & State Agencies")
def get_channel_partners(state: Optional[str] = Query(None), healthy_only: bool = Query(False)) -> List[Dict[str, Any]]:
    partners = schemes_data.get("CHANNEL_PARTNERS_DATABASE", [])
    if state:
        st_clean = state.lower().replace(" ", "_")
        partners = [p for p in partners if p.get("state", "").lower().replace(" ", "_") == st_clean]
    if healthy_only:
        partners = [p for p in partners if p.get("fundHealthStatus") == "healthy"]
    return partners

@router.post("/api/match-credit", response_model=CreditMatchResponse, summary="Match Credit & Loan Schemes")
def match_credit(profile: CreditApplicantProfile) -> CreditMatchResponse:
    return match_credit_profile(profile)

@router.post("/api/v1/predict", response_model=PredictionResponse, summary="AI Credit Readiness Prediction")
def predict(profile: BeneficiaryProfile) -> PredictionResponse:
    return CoreService.evaluate(profile)

from pydantic import BaseModel, Field
from typing import List, Optional

class HealthResponse(BaseModel):
    status: str = Field(default="healthy")
    environment: str
    version: str = "2.0.0"
    timestamp: Optional[str] = None

class BeneficiaryProfile(BaseModel):
    annual_income: float
    occupation: str
    state: str
    social_category: str = "general"
    disability_percent: Optional[float] = 0.0
    has_land: Optional[bool] = False
    land_acres: Optional[float] = 0.0

class SchemeRecommendation(BaseModel):
    scheme_id: str
    scheme_name: str
    category: str
    benefit_summary: str
    confidence_score: float

class PredictionResponse(BaseModel):
    credit_readiness_score: int
    readiness_band: str
    eligible_schemes_count: int
    recommendations: List[SchemeRecommendation]

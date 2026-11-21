from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- System & Core Schemas ---
class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str
    timestamp: str

class BeneficiaryProfile(BaseModel):
    annual_income: int = Field(ge=0, description="Annual household income in INR")
    category: str = Field(default="General", description="Social category: General, OBC, SC, ST")
    state: str = Field(default="All", description="Indian state of residence")
    has_disability: bool = Field(default=False)
    disability_percentage: int = Field(default=0, ge=0, le=100)
    has_land: bool = Field(default=False)

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

# --- Welfare Matching Schemas ---
class StudentProfile(BaseModel):
    name: str = "Student"
    dob: str  # YYYY-MM-DD
    gender: str = "all"  # male, female, other, all
    state: str = "all"
    disabilityTypes: List[str] = ["none"]
    disabilityPercent: int = Field(default=0, ge=0, le=100)
    educationLevel: str = "all"
    householdIncome: int = 0

class SchemeEligibilityCheck(BaseModel):
    id: str
    label: str
    passed: bool
    detail: str

class EvaluatedSchemeResult(BaseModel):
    scheme: Dict[str, Any]
    score: int
    status: str
    checks: List[SchemeEligibilityCheck]
    daysToDeadline: int
    isUrgent: bool
    requiredDocuments: List[str]

class MatchStatsSummary(BaseModel):
    total: int
    highlyEligible: int
    urgent: int
    avgScore: str
    categories: Dict[str, int]

class MatchResponse(BaseModel):
    profile: Dict[str, Any]
    results: List[EvaluatedSchemeResult]
    stats: MatchStatsSummary

# --- Credit Matching Schemas ---
class CreditApplicantProfile(BaseModel):
    name: str = "Applicant"
    state: str = "maharashtra"
    gender: str = "male"
    householdIncome: int = 180000
    hasScCert: bool = True
    scCertNumber: str = ""
    purpose: str = "business"  # business, education
    sector: str = "service"
    courseType: str = "inland"
    projectCost: int = 200000
    promoterContribution: int = 20000
    hasProjectReport: bool = False
    trainingCompleted: bool = False

class CreditMatchResult(BaseModel):
    scheme: Dict[str, Any]
    score: int
    status: str
    isEligible: bool
    checks: List[Dict[str, Any]]
    matchedReasons: List[str]
    missingReasons: List[str]
    indicativeRate: float

class CreditMatchResponse(BaseModel):
    profile: Dict[str, Any]
    results: List[CreditMatchResult]
    eligibleCount: int
    bestMatch: Optional[CreditMatchResult] = None

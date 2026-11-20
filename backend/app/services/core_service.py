from app.models.schemas import BeneficiaryProfile, SchemeRecommendation, PredictionResponse

class CoreService:
    @staticmethod
    def evaluate(profile: BeneficiaryProfile) -> PredictionResponse:
        score = 550
        if profile.annual_income <= 300000:
            score += 100
        elif profile.annual_income <= 500000:
            score += 60
        if profile.has_land:
            score += 50
        score = max(300, min(900, score))
        band = "Prime" if score >= 700 else "Good"

        recs = [
            SchemeRecommendation(
                scheme_id="PM-KISAN",
                scheme_name="PM Kisan Samman Nidhi",
                category="Agriculture",
                benefit_summary="₹6,000/yr DBT",
                confidence_score=0.95
            ),
            SchemeRecommendation(
                scheme_id="PM-JAY",
                scheme_name="Ayushman Bharat PM-JAY",
                category="Healthcare",
                benefit_summary="₹5 Lakh hospitalization cover",
                confidence_score=0.92
            )
        ]
        return PredictionResponse(
            credit_readiness_score=score,
            readiness_band=band,
            eligible_schemes_count=len(recs),
            recommendations=recs
        )

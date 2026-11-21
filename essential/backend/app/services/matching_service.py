import os
import json
from datetime import date
from typing import Dict, Any, List, Optional
from app.models.schemas import (
    StudentProfile,
    CreditApplicantProfile,
    SchemeEligibilityCheck,
    EvaluatedSchemeResult,
    MatchStatsSummary,
    MatchResponse,
    CreditMatchResult,
    CreditMatchResponse,
)

# Load schemes database once
SCHEMES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "schemes.json")

def load_schemes_data() -> Dict[str, Any]:
    try:
        with open(SCHEMES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load schemes database from {SCHEMES_FILE}: {e}")
        return {
            "INDIAN_STATES": [],
            "EDUCATION_LEVELS": [],
            "DISABILITY_TYPES": [],
            "SCHEME_CATEGORIES": {},
            "SCHEME_DATABASE": [],
            "CREDIT_SCHEME_DATABASE": [],
            "CHANNEL_PARTNERS_DATABASE": []
        }

schemes_data = load_schemes_data()

def calculate_age(dob_str: str) -> int:
    try:
        dob = date.fromisoformat(dob_str)
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return 18

def get_disability_label(dtype_id: str) -> str:
    for d in schemes_data.get("DISABILITY_TYPES", []):
        if d.get("id") == dtype_id:
            return d.get("label", dtype_id)
    return dtype_id

def get_education_label(edu_id: str) -> str:
    for e in schemes_data.get("EDUCATION_LEVELS", []):
        if e.get("id") == edu_id:
            return e.get("label", edu_id)
    return edu_id

def days_to_deadline(deadline_str: str) -> int:
    try:
        deadline = date.fromisoformat(deadline_str)
        today = date.today()
        diff = deadline - today
        return diff.days
    except Exception:
        return 365

def evaluate_scheme(profile: StudentProfile, age: int, scheme: Dict[str, Any]) -> EvaluatedSchemeResult:
    e = scheme.get("eligibility", {})
    checks: List[SchemeEligibilityCheck] = []
    total_weight = 0
    passed_weight = 0

    # 1. Disability Type Check (weight: 30)
    weight_dtype = 30
    total_weight += weight_dtype
    scheme_dtypes = e.get("disabilityTypes", [])
    profile_dtypes = profile.disabilityTypes
    has_no_disability = "none" in profile_dtypes

    if has_no_disability:
        passed_dtype = e.get("disabilityPercentMin", 0) == 0
        detail_dtype = "No disability required for this scheme" if passed_dtype else "This scheme requires a disability certificate"
    else:
        if isinstance(scheme_dtypes, str) and scheme_dtypes == "all":
            passed_dtype = True
            detail_dtype = "Open to all categories of disability"
        else:
            intersection = [d for d in profile_dtypes if d in scheme_dtypes]
            passed_dtype = len(intersection) > 0
            detail_dtype = f"Matched: {', '.join([get_disability_label(d) for d in intersection])}" if passed_dtype else "Disability type not eligible"

    if passed_dtype:
        passed_weight += weight_dtype
    checks.append(SchemeEligibilityCheck(id="disability_type", label="Disability Category", passed=passed_dtype, detail=detail_dtype))

    # 2. Disability Percentage Check (weight: 20)
    weight_percent = 20
    total_weight += weight_percent
    min_pct = e.get("disabilityPercentMin", 0)
    passed_pct = profile.disabilityPercent >= min_pct
    detail_pct = f"{profile.disabilityPercent}% meets minimum {min_pct}% requirement" if passed_pct else f"{profile.disabilityPercent}% is below required {min_pct}%"
    if passed_pct:
        passed_weight += weight_percent
    checks.append(SchemeEligibilityCheck(id="disability_pct", label=f"Disability % (Min {min_pct}%)", passed=passed_pct, detail=detail_pct))

    # 3. Education Level Check (weight: 20)
    weight_edu = 20
    total_weight += weight_edu
    scheme_edus = e.get("educationLevels", [])
    passed_edu = (scheme_edus == "all") or (profile.educationLevel in scheme_edus) or (profile.educationLevel == "all")
    detail_edu = f"Level '{get_education_label(profile.educationLevel)}' is eligible" if passed_edu else "Current education level not covered"
    if passed_edu:
        passed_weight += weight_edu
    checks.append(SchemeEligibilityCheck(id="education", label="Education Qualification", passed=passed_edu, detail=detail_edu))

    # 4. Income Ceiling Check (weight: 15)
    weight_inc = 15
    total_weight += weight_inc
    max_income = e.get("maxIncome", 0)
    passed_inc = (max_income == 0) or (profile.householdIncome <= max_income)
    detail_inc = f"Income ₹{profile.householdIncome:,} within ceiling ₹{max_income:,}" if (passed_inc and max_income > 0) else ("No income cap applied" if max_income == 0 else f"Income ₹{profile.householdIncome:,} exceeds limit ₹{max_income:,}")
    if passed_inc:
        passed_weight += weight_inc
    checks.append(SchemeEligibilityCheck(id="income", label=f"Income Cap (Max ₹{max_income:,})" if max_income > 0 else "Income Cap (No limit)", passed=passed_inc, detail=detail_inc))

    # 5. Age Bracket Check (weight: 10)
    weight_age = 10
    total_weight += weight_age
    age_range = e.get("ageRange", [0, 100])
    passed_age = age_range[0] <= age <= age_range[1]
    detail_age = f"Age {age} is within range ({age_range[0]}–{age_range[1]} yrs)" if passed_age else f"Age {age} is outside eligible range ({age_range[0]}–{age_range[1]} yrs)"
    if passed_age:
        passed_weight += weight_age
    checks.append(SchemeEligibilityCheck(id="age", label=f"Age Limit ({age_range[0]}–{age_range[1]} yrs)", passed=passed_age, detail=detail_age))

    # 6. Gender Check (weight: 5)
    weight_gen = 5
    total_weight += weight_gen
    scheme_gender = e.get("gender", "all")
    passed_gen = (scheme_gender == "all") or (profile.gender == scheme_gender) or (profile.gender == "all")
    detail_gen = "Scheme is open to all genders" if scheme_gender == "all" else f"Exclusively for {scheme_gender.capitalize()}"
    if passed_gen:
        passed_weight += weight_gen
    checks.append(SchemeEligibilityCheck(id="gender", label="Gender Eligibility", passed=passed_gen, detail=detail_gen))

    # Critical gate checks
    has_cert_issue = not has_no_disability and (min_pct > 0 and profile.disabilityPercent < min_pct)
    has_income_issue = (max_income > 0 and profile.householdIncome > max_income)
    has_type_issue = not passed_dtype

    score = round((passed_weight / total_weight) * 100) if total_weight > 0 else 0
    if has_cert_issue or has_type_issue or has_income_issue:
        score = min(score, 45)

    if score >= 85:
        status = "highly-eligible"
    elif score >= 60:
        status = "likely-eligible"
    elif score >= 40:
        status = "partially-eligible"
    else:
        status = "ineligible"

    days_left = days_to_deadline(scheme.get("deadline", "2027-12-31"))
    is_urgent = 0 < days_left <= 60

    return EvaluatedSchemeResult(
        scheme=scheme,
        score=score,
        status=status,
        checks=checks,
        daysToDeadline=days_left,
        isUrgent=is_urgent,
        requiredDocuments=scheme.get("requiredDocuments", [])
    )

def match_student_profile(profile: StudentProfile) -> MatchResponse:
    age = calculate_age(profile.dob)
    results: List[EvaluatedSchemeResult] = []

    for scheme in schemes_data.get("SCHEME_DATABASE", []):
        res = evaluate_scheme(profile, age, scheme)
        if res.score > 0:
            results.append(res)

    results.sort(key=lambda x: x.score, reverse=True)

    highly_eligible = sum(1 for r in results if r.status == "highly-eligible")
    urgent = sum(1 for r in results if r.isUrgent)
    avg_score = sum(r.score for r in results) / len(results) if results else 0.0

    categories: Dict[str, int] = {}
    for r in results:
        cat = r.scheme.get("category", "other")
        categories[cat] = categories.get(cat, 0) + 1

    return MatchResponse(
        profile={**profile.model_dump(), "age": age},
        results=results,
        stats=MatchStatsSummary(
            total=len(results),
            highlyEligible=highly_eligible,
            urgent=urgent,
            avgScore=f"{avg_score:.1f}",
            categories=categories
        )
    )

def evaluate_credit_scheme(profile: CreditApplicantProfile, scheme: Dict[str, Any]) -> CreditMatchResult:
    checks = []
    total_weight = 0
    passed_weight = 0
    matched_reasons = []
    missing_reasons = []

    is_sc = profile.hasScCert
    income = profile.householdIncome
    cost = profile.projectCost
    purpose = profile.purpose
    is_education = purpose == "education"

    # SC Check
    w_sc = 30
    total_weight += w_sc
    if is_sc:
        passed_weight += w_sc
        checks.append({"id": "sc_category", "label": "SC Category Verification", "passed": True, "detail": "Valid SC Caste Certificate self-declared."})
        matched_reasons.append("SC Community Entitlement verified")
    else:
        checks.append({"id": "sc_category", "label": "SC Category Verification", "passed": False, "detail": "NSFDC mandates Scheduled Caste (SC) category."})
        missing_reasons.append("Requires valid SC certificate")

    # Income Check
    w_inc = 30
    total_weight += w_inc
    if income <= 500000:
        passed_weight += w_inc
        checks.append({"id": "income_limit", "label": "Household Income <= Rs 5.0L", "passed": True, "detail": f"Annual income Rs {income:,} is within Rs 5.0L ceiling."})
        matched_reasons.append(f"Income Rs {income:,} complies with NSFDC norms")
    else:
        checks.append({"id": "income_limit", "label": "Household Income <= Rs 5.0L", "passed": False, "detail": f"Income Rs {income:,} exceeds statutory Rs 5.0L ceiling."})
        missing_reasons.append("Annual income exceeds Rs 5.0 Lakh limit")

    # Purpose & Cost
    w_cost = 25
    total_weight += w_cost
    scheme_id = scheme.get("id", "")
    max_amount = scheme.get("maxAmount", 5000000)

    if is_education:
        if scheme_id == "nsfdc_education_loan":
            passed_weight += w_cost
            checks.append({"id": "purpose_cost", "label": "Education Course Loan Fit", "passed": True, "detail": "Optimal for higher professional education."})
            matched_reasons.append("Concessional student loan rate (6.5%)")
        else:
            checks.append({"id": "purpose_cost", "label": "Enterprise Purpose Mismatch", "passed": False, "detail": "Scheme is designed for business, not tuition."})
    else:
        if scheme_id == "nsfdc_education_loan":
            checks.append({"id": "purpose_cost", "label": "Purpose Mismatch", "passed": False, "detail": "Education scheme not applicable for commercial enterprise."})
        elif cost <= max_amount:
            passed_weight += w_cost
            checks.append({"id": "purpose_cost", "label": f"Project Cost <= Rs {max_amount/100000:.1f}L", "passed": True, "detail": f"Project cost Rs {cost:,} is within scheme ceiling."})
            matched_reasons.append(f"Within scheme financial cap of Rs {max_amount/100000:.1f} Lakh")
        else:
            passed_weight += round(w_cost * 0.4)
            checks.append({"id": "purpose_cost", "label": "Project Cost Exceeds Cap", "passed": False, "detail": f"Cost Rs {cost:,} exceeds scheme cap Rs {max_amount:,}."})
            missing_reasons.append(f"Cost exceeds maximum scheme limit of Rs {max_amount:,}")

    # Sector
    w_sec = 10
    total_weight += w_sec
    if not is_education:
        passed_weight += w_sec
        checks.append({"id": "sector_fit", "label": "Commercial Sector Viability", "passed": True, "detail": f"Sector '{profile.sector}' is an eligible commercial activity."})
        matched_reasons.append(f"Recognized commercial sector: {profile.sector}")
    else:
        passed_weight += w_sec
        checks.append({"id": "course_fit", "label": "Accredited Higher Study", "passed": True, "detail": f"Course track '{profile.courseType}' is eligible."})

    # Channel Partner
    w_part = 5
    total_weight += w_part
    state_norm = profile.state.lower().replace(" ", "_")
    partners = schemes_data.get("CHANNEL_PARTNERS_DATABASE", [])
    has_active_partner = any(p.get("state", "").lower().replace(" ", "_") == state_norm and p.get("fundHealthStatus") == "healthy" for p in partners)
    if has_active_partner:
        passed_weight += w_part
        checks.append({"id": "partner_avail", "label": "Channel Partner Active", "passed": True, "detail": f"Active channel partner branch available in {profile.state}."})
        matched_reasons.append(f"Active SCA / PSB partner operating in {profile.state}")
    else:
        passed_weight += round(w_part * 0.5)
        checks.append({"id": "partner_avail", "label": "Channel Partner Network", "passed": True, "detail": "Lead Public Sector Bank channel available."})

    score = round((passed_weight / total_weight) * 100) if total_weight > 0 else 0
    is_eligible = is_sc and (income <= 500000)

    if not is_eligible:
        status = "ineligible"
    elif score >= 85:
        status = "highly-eligible"
    elif score >= 65:
        status = "likely-eligible"
    else:
        status = "partially-eligible"

    return CreditMatchResult(
        scheme=scheme,
        score=score,
        status=status,
        isEligible=is_eligible,
        checks=checks,
        matchedReasons=matched_reasons,
        missingReasons=missing_reasons,
        indicativeRate=scheme.get("interestRates", {}).get("beneficiaryFinalMin", 6.5)
    )

def match_credit_profile(profile: CreditApplicantProfile) -> CreditMatchResponse:
    schemes = schemes_data.get("CREDIT_SCHEME_DATABASE", [])
    results: List[CreditMatchResult] = []
    for s in schemes:
        res = evaluate_credit_scheme(profile, s)
        results.append(res)
    results.sort(key=lambda x: x.score, reverse=True)
    return CreditMatchResponse(
        profile=profile.model_dump(),
        results=results,
        eligibleCount=sum(1 for r in results if r.isEligible),
        bestMatch=results[0] if results else None
    )

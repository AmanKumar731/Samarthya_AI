# Samarthya AI — REST API Specification

> **Base URL:** `http://localhost:8000` (Local) / `/api` (Production Proxy)  
> **OpenAPI Swagger UI:** `http://localhost:8000/docs`  
> **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## 1. System & Health

### `GET /health`
Returns microservice status, active environment, and ISO 8601 UTC timestamp.

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "2.0.0",
  "timestamp": "2026-11-20T22:50:00.000000+00:00"
}
```

---

## 2. Welfare & Scholarship Schemes

### `GET /api/metadata`
Returns all statutory reference categories, education levels, disability classifications, and state mappings.

**Response `200 OK`:**
```json
{
  "states": [{"id": "andhra_pradesh", "label": "Andhra Pradesh"}, ...],
  "educationLevels": [{"id": "graduate", "label": "Graduate"}, ...],
  "disabilityTypes": [{"id": "locomotor", "label": "Locomotor Disability"}, ...],
  "categories": {
    "scholarship": {"label": "Education & Scholarships", "icon": "🎓"},
    "healthcare": {"label": "Health & Medical", "icon": "🏥"}
  }
}
```

### `GET /api/schemes`
Returns the verified list of all active welfare schemes and scholarships with 2027 deadlines.

**Response `200 OK`:**
```json
[
  {
    "id": "pm_usp_central_sector_scholarship",
    "name": "PM-USP Central Sector Scheme of Scholarship for College & University Students",
    "ministry": "Ministry of Education (DoHE)",
    "category": "scholarship",
    "benefits": {
      "amount": "₹12,000/year (Graduation) / ₹20,000/year (Post-Graduation)",
      "description": "Direct Benefit Transfer (DBT) maintenance allowance"
    },
    "deadline": "2027-03-31"
  }
]
```

### `POST /api/match`
Evaluates a student or citizen profile against the entire welfare database using weighted multi-criteria eligibility scoring.

**Request Payload:**
```json
{
  "name": "Aarav Sharma",
  "dob": "2005-08-15",
  "gender": "male",
  "state": "uttar_pradesh",
  "disabilityTypes": ["locomotor"],
  "disabilityPercent": 50,
  "educationLevel": "graduate",
  "householdIncome": 180000
}
```

**Response `200 OK`:**
```json
{
  "profile": {
    "name": "Aarav Sharma",
    "dob": "2005-08-15",
    "gender": "male",
    "state": "uttar_pradesh",
    "disabilityTypes": ["locomotor"],
    "disabilityPercent": 50,
    "educationLevel": "graduate",
    "householdIncome": 180000,
    "age": 21
  },
  "results": [
    {
      "scheme": { "id": "aicte_saksham_degree_scholarship", "name": "AICTE Saksham Scholarship..." },
      "score": 95,
      "status": "highly-eligible",
      "checks": [
        {"id": "disability_type", "label": "Disability Category", "passed": true, "detail": "Matched: Locomotor Disability"},
        {"id": "disability_pct", "label": "Disability % (Min 40%)", "passed": true, "detail": "50% meets minimum 40% requirement"}
      ],
      "daysToDeadline": 72,
      "isUrgent": false,
      "requiredDocuments": ["Disability Certificate (40%+)", "College Admission Letter", "Income Certificate"]
    }
  ],
  "stats": {
    "total": 12,
    "highlyEligible": 8,
    "urgent": 1,
    "avgScore": "82.5",
    "categories": { "scholarship": 6, "assistive_device": 3, "financial_aid": 3 }
  }
}
```

---

## 3. Concessional Credit & Loans (NSFDC / MSME)

### `GET /api/credit-schemes`
Returns concessional loans, micro-credit programs, and enterprise funding schemes.

### `GET /api/channel-partners?state=maharashtra&healthy_only=true`
Lists State Channelising Agencies (SCAs) and Public Sector Bank partner branches for credit disbursement.

### `POST /api/match-credit`
Evaluates business or education credit applications for interest subventions, collateral-free loans, and eligibility caps.

---

## 4. AI Prediction Pipeline

### `POST /api/v1/predict`
Calculates comprehensive credit readiness score (300–900 scale), readiness band, and AI recommended schemes.

**Request Payload:**
```json
{
  "annual_income": 240000,
  "category": "OBC",
  "state": "Bihar",
  "has_disability": false,
  "disability_percentage": 0,
  "has_land": true
}
```

**Response `200 OK`:**
```json
{
  "credit_readiness_score": 760,
  "readiness_band": "Prime",
  "eligible_schemes_count": 2,
  "recommendations": [
    {
      "scheme_id": "PM-KISAN",
      "scheme_name": "PM Kisan Samman Nidhi",
      "category": "Agriculture",
      "benefit_summary": "₹6,000/yr DBT",
      "confidence_score": 0.95
    }
  ]
}
```

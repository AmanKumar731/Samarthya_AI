# Samarthya AI API Reference

REST endpoints for welfare scheme eligibility and credit assessment.

## 1. Health Probe
- Route: `GET /health`
- Response: Status 200 JSON with service status and environment.

Example response:
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "2.0.0"
}
```

## 2. Scheme & Credit Prediction
- Route: `POST /api/v1/predict`
- Request: Beneficiary socio-economic data (income, occupation, state, category).
- Response: Evaluated credit readiness index (300-900) and matched scheme list.

Example request:
```json
{
  "annual_income": 180000,
  "occupation": "Farmer",
  "state": "Uttar Pradesh",
  "social_category": "sc",
  "has_land": true,
  "land_acres": 2.5
}
```

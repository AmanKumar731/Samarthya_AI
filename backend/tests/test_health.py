from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_predict():
    payload = {
        "annual_income": 180000,
        "occupation": "Farmer",
        "state": "Uttar Pradesh",
        "has_land": True
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert 300 <= data["credit_readiness_score"] <= 900
    assert data["eligible_schemes_count"] > 0

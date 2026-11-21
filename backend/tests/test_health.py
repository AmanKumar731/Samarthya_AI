from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "endpoints" in data

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

def test_metadata():
    response = client.get("/api/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "states" in data
    assert "educationLevels" in data

def test_schemes():
    response = client.get("/api/schemes")
    assert response.status_code == 200
    schemes = response.json()
    assert isinstance(schemes, list)
    assert len(schemes) == 56

def test_match_student():
    payload = {
        "name": "Test Student",
        "dob": "2005-01-15",
        "gender": "male",
        "state": "uttar_pradesh",
        "disabilityTypes": ["locomotor"],
        "disabilityPercent": 50,
        "educationLevel": "graduate",
        "householdIncome": 150000
    }
    response = client.post("/api/match", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "results" in res
    assert "stats" in res
    assert res["stats"]["total"] > 0

def test_predict():
    payload = {
        "annual_income": 250000,
        "category": "OBC",
        "state": "Uttar Pradesh",
        "has_disability": False,
        "disability_percentage": 0,
        "has_land": True
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "credit_readiness_score" in res
    assert res["credit_readiness_score"] >= 300
    assert len(res["recommendations"]) > 0

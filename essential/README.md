# 🚀 Samarthya AI — Monorepo Architecture

> **Production-grade full-stack architecture for AI-powered government welfare matching and concessional credit readiness.**

- **System Architecture:** [`docs/architecture.png`](docs/architecture.png)
- **Pitch Deck:** [`docs/pitch-deck.pdf`](docs/pitch-deck.pdf)
- **API Specification:** [`docs/api-spec.md`](docs/api-spec.md)
- **FastAPI Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🏗️ Directory Hierarchy

```
essential/
├── .github/
│   ├── workflows/ci.yml             # Automated CI workflow on push/PR
│   ├── PULL_REQUEST_TEMPLATE.md     # Pull request template
│   └── ISSUE_TEMPLATE/              # Bug report & feature request templates
├── docs/
│   ├── architecture.png             # Full system architecture diagram
│   ├── pitch-deck.pdf               # Hackathon presentation pitch deck
│   ├── api-spec.md                  # REST API contract and payloads
│   ├── SYSTEM_GUIDE.md              # In-depth system documentation
│   └── TECH_STACK.md                # Technology stack specifications
├── frontend/                        # Next.js 14 App Router client application
│   ├── public/                      # Static assets (logo, webmanifest)
│   ├── src/app/                     # Pages & layouts (layout.tsx, page.tsx, globals.css)
│   ├── src/components/              # Reusable UI components (Navbar, landing, ui)
│   ├── src/lib/                     # API client & utility helpers
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── components.json
│   └── .env.example
├── backend/                         # Modular FastAPI backend microservice
│   ├── app/
│   │   ├── main.py                  # App entry point with CORS middleware
│   │   ├── api/routes.py            # Modular route handlers
│   │   ├── core/config.py           # Configuration loader from .env
│   │   ├── models/schemas.py        # Pydantic request/response schemas
│   │   └── services/
│   │       ├── core_service.py      # Core AI readiness prediction pipeline
│   │       └── matching_service.py  # Scheme evaluation & credit scoring engines
│   ├── tests/test_health.py         # Pytest smoke tests (6/6 passing)
│   ├── schemes.json                 # 56 active schemes database
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── scripts/
│   ├── seed_db.py                   # Demo seeding CLI tool
│   └── mock_data.json               # Sample offline citizen profiles
├── README.md
├── docker-compose.yml               # Multi-container orchestration (ports 3000 & 8000)
├── .gitignore
└── LICENSE
```

---

## ⚡ 3-Step Quickstart

### Step 1: Environment Setup
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Step 2: Run via Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

### Step 3: Run Tests & Seed Demo Data
```bash
# Backend pytest suite
cd backend && PYTHONPATH=. pytest -v tests/

# CLI DB seeder
python3 ../scripts/seed_db.py
```

---

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.

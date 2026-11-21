# 🚀 Samarthya AI (Saksham)

> **Inclusive AI-Powered Welfare Delivery & Alternative Credit Readiness Platform for Underserved Citizens.**

- **Live Prototype:** Open `index.html` locally or visit [Samarthya Portal](https://samarthya-ai.vercel.app)
- **Monorepo Package:** Located in [`essential/`](essential/) (with Next.js frontend, FastAPI backend, CI workflows, and docs)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Project Organization

This workspace is organized into two primary pillars:

1. **Root Interactive Prototype:**
   - `index.html`: High-performance citizen portal with instant client-side matching across 56 active schemes.
   - `experience.html`: Experiential lab narrative and audio-visual overview.
   - `js/` & `css/`: Modular client runtime, multi-language internationalization, sound engine, and scheme databases.
   - `chatbot/`: Chatbot system prompts, model specifications (Gemini 1.5 Flash), and trained dataset questions.
   - `feature/`: Showcase media assets, promo video, and platform screenshots.

2. **Modular Monorepo (`essential/`):**
   - `essential/.github/`: Automated CI workflows, PR templates, and issue templates.
   - `essential/docs/`: Architecture diagram (`architecture.png`), pitch deck (`pitch-deck.pdf`), API spec (`api-spec.md`), and system guides.
   - `essential/frontend/`: Next.js 14 App Router, TypeScript, Tailwind CSS, components, and public assets.
   - `essential/backend/`: Modular FastAPI architecture (`app/api`, `app/core`, `app/models`, `app/services`, `schemes.json`, `tests/`).
   - `essential/scripts/`: Seeding utility (`seed_db.py`) and mock datasets (`mock_data.json`).
   - `essential/docker-compose.yml`: Multi-container orchestration (ports 3000 & 8000).

---

## ⚡ 3-Step Quickstart for Monorepo (`essential/`)

### Step 1: Navigate to Monorepo
```bash
cd essential
```

### Step 2: Environment Setup
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Step 3: Run Full Stack via Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

---

## 🧪 Testing & Verification

```bash
# Run backend pytest suite (6/6 tests passing)
cd essential/backend
PYTHONPATH=. pytest -v tests/

# Seed sample mock data
python3 essential/scripts/seed_db.py
```

---

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.

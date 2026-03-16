# Target App (Sacrificial SaaS)

Full-stack commerce application with FastAPI, React, PostgreSQL/SQLite, and Razorpay integration.

## Stack

- Backend: FastAPI + SQLAlchemy (async) + PostgreSQL
- Frontend: React (Vite) + Tailwind
- Payments: Razorpay (Test Mode)

## Quickstart (Docker)

1. Copy env:
   - `cp .env.example .env`
2. Start:
   - `docker compose up --build`
3. Open:
   - Frontend: `http://localhost:5173`
   - Backend docs: `http://localhost:8000/docs`

## Local dev (no Docker)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export $(cat ../.env | xargs) # zsh: use with care
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notes

- The backend can auto-create tables in dev if `DB_AUTO_CREATE=true`.
- Use Razorpay *test* keys only. Never commit live keys.

# InterviewForge AI 🚀

> AI-powered Interview Preparation Platform for Data Analyst, Business Analyst, Data Science, ML, AI, and Software Engineering roles.

[![CI/CD](https://github.com/your-org/interviewforge/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/interviewforge/actions)

---

## Live Demo
- **Frontend**: https://interviewforge.vercel.app
- **API Docs**: https://interviewforge-backend.onrender.com/docs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| State | Zustand + React Query |
| Backend | FastAPI, Python 3.12, SQLAlchemy (async) |
| Database | PostgreSQL (Supabase) |
| AI | Gemini 1.5 Flash, LangChain, FAISS, RAG |
| Storage | AWS S3 |
| Auth | JWT + Google OAuth 2.0 |
| Deploy | Vercel (FE) + Render (BE) |

---

## Features

- ✅ 12 subjects: Python, SQL, Excel, Power BI, Statistics, ML, DL, NLP, Cloud, Linux, HR, Aptitude
- ✅ Quiz engine with timer, shuffle, MCQ + text answers, AI feedback
- ✅ Live Mock Interview — AI asks, evaluates, scores every answer
- ✅ Monaco code editor with sandboxed Python execution + SQL simulator
- ✅ AI Chat Assistant — RAG-powered, answers only from uploaded notes
- ✅ Resume Interview — upload PDF, AI creates personalized interview
- ✅ Company Interview — tailored questions for Amazon, Google, TCS, etc.
- ✅ Progress dashboard with streak calendar, score trends, topic analysis
- ✅ Leaderboard with podium, filters, badges
- ✅ Admin Panel — upload notes with OCR, bulk question import
- ✅ Dark / Light mode with glassmorphism UI

---

## Quick Start

```bash
# Clone
git clone https://github.com/your-org/interviewforge
cd interviewforge

# Backend
cd backend
cp .env.example .env          # fill API keys
docker compose up -d           # postgres + redis
uvicorn main:app --reload      # http://localhost:8000

# Frontend (new terminal)
cd frontend
cp .env.example .env.local     # fill keys
npm install
npm run dev                    # http://localhost:3000
```

API Docs: http://localhost:8000/docs

---

## Project Structure

```
interviewforge/
├── frontend/                  # Next.js App Router
│   └── src/
│       ├── app/               # Pages (App Router)
│       │   ├── (auth)/        # Login, Register
│       │   ├── dashboard/     # Main dashboard
│       │   ├── subjects/      # All subject pages
│       │   ├── progress/      # Analytics
│       │   ├── leaderboard/   # Rankings
│       │   ├── resume-interview/
│       │   ├── company-interview/
│       │   ├── notifications/
│       │   └── admin/
│       ├── components/
│       │   ├── ui/            # Button, Input, Skeleton
│       │   ├── layout/        # Sidebar, Navbar
│       │   └── charts/        # ProgressRing, RadarChart, StreakCalendar
│       ├── store/             # Zustand: auth, quiz, ui
│       ├── hooks/             # useAuth, useTimer, useProgress
│       ├── services/          # Axios API clients
│       └── types/             # TypeScript interfaces
│
├── backend/                   # FastAPI
│   └── app/
│       ├── api/v1/routers/    # auth, quiz, interview, coding, AI...
│       ├── core/              # config, DB, security, deps
│       ├── models/            # SQLAlchemy ORM
│       ├── schemas/           # Pydantic request/response
│       ├── services/          # Business logic
│       ├── ai/                # Gemini client + RAG pipeline
│       └── middleware/        # rate limit, logging
│
├── infra/
│   ├── render.yaml            # Backend deployment
│   ├── vercel.json            # Frontend deployment
│   ├── supabase_setup.sql     # DB indexes + views
│   └── DEPLOYMENT.md         # Full deployment guide
│
└── docker-compose.yml         # Local dev stack
```

---

## Build Phases

- [x] Phase 1 — Architecture & Planning
- [x] Phase 2 — Scaffolding, Auth, Base Dashboard
- [x] Phase 3 — Subject pages, Quiz Engine, Notes, Coding Editor, Mock Interview, AI Chat
- [x] Phase 4 — Leaderboard, Notifications, Deployment Pipeline, Tests
- [ ] Phase 5 — Polish, PWA, performance optimization, advanced analytics

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full step-by-step instructions.

---

## Environment Variables

Copy `.env.example` files and fill in your keys:
- `backend/.env.example` → `backend/.env`
- `frontend/.env.example` → `frontend/.env.local`

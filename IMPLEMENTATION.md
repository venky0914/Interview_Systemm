# InterviewForge AI — Implementation Guide

## 🎯 Project Overview

**InterviewForge AI** is a comprehensive AI-powered interview preparation platform designed for Data Analysts, Business Analysts, Data Scientists, ML Engineers, AI Engineers, and Software Engineers.

### Key Features

- **12 Subjects**: Python, SQL, Excel, Power BI, Statistics, ML, DL, NLP, Cloud, Linux, HR, Aptitude
- **Quiz Engine**: Timer, shuffle, MCQ + text answers, AI-powered feedback
- **Live Mock Interview**: AI-driven interviews with real-time evaluation
- **Code Editor**: Monaco editor with Python execution & SQL simulator
- **AI Chat Assistant**: RAG-powered Q&A from uploaded notes
- **Resume Interview**: Upload PDF, get personalized AI questions
- **Company Interview**: Pre-built questions for major tech companies
- **Progress Dashboard**: Streak calendar, score trends, topic analysis
- **Leaderboard**: User rankings with badges
- **Admin Panel**: OCR-enabled note uploads, bulk question import

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js 14)                  │
│  • React 18 with TypeScript                                 │
│  • Tailwind CSS + Framer Motion                             │
│  • Zustand for state management                             │
│  • React Query for API data fetching                        │
│  • Next Auth for authentication                             │
│  http://localhost:3000                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                    API (Axios)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  • Python 3.12 with async SQLAlchemy                        │
│  • PostgreSQL (async driver)                                │
│  • JWT + Google OAuth 2.0                                   │
│  • Gemini 1.5 Flash for AI                                  │
│  • LangChain + FAISS for RAG                                │
│  http://localhost:8000 / https://render.com                │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │Database │     │ AI API   │    │AWS S3   │
    │Supabase │     │ Gemini   │    │Storage  │
    └─────────┘     └──────────┘    └─────────┘
```

---

## 📋 Current Implementation Status

### ✅ Completed

- **Frontend Setup**
  - Next.js 14.2.5 with App Router
  - TypeScript configuration
  - Tailwind CSS v3 with custom theme
  - Global CSS with CSS variables (dark/light mode)
  - Project structure and routing configured
  - All dependencies installed (`npm install` completed)

- **Pages & Routes**
  - Auth pages: `/login`, `/register`
  - Dashboard: `/dashboard`
  - Subject pages: `/subjects`, `/subjects/[slug]`
  - Quiz flow: `/subjects/[slug]/quiz`, `/subjects/[slug]/quiz/session`, `/subjects/[slug]/quiz/results`
  - Features: `/subjects/[slug]/coding`, `/subjects/[slug]/mock-interview`, `/subjects/[slug]/ai-assistant`, `/subjects/[slug]/notes`
  - User features: `/progress`, `/leaderboard`, `/notifications`
  - Interviews: `/resume-interview`, `/company-interview`
  - Admin: `/admin`

- **Components**
  - UI components: Button, Input, Skeleton
  - Layout: Navbar, Sidebar
  - Charts: ProgressRing, ScoreBarChart, StreakCalendar, TopicRadarChart
  - Dark/Light mode theme switching

- **State Management**
  - Zustand stores: `authStore`, `quizStore`, `uiStore`
  - React Query integration
  - Type-safe store actions

- **Services & Hooks**
  - API service layer with axios
  - Auth service (JWT token management)
  - Quiz service
  - Custom hooks: `useAuth`, `useTimer`, `useProgress`, `useDebounce`
  - Middleware for auth protection

- **Build Configuration**
  - Next.js config: Fixed TypeScript config issue (converted to JS)
  - Security headers configured
  - Image optimization for Google & AWS S3
  - Clean ESLint setup

### 🔄 Partially Completed

- **Authentication Flow**
  - JWT token storage in cookies
  - Auth middleware configured
  - Structure in place, needs backend connection

- **Types & Interfaces**
  - Base types defined for: API, Auth, Interview, Quiz, Subjects
  - Needs population with actual data structures

### ⏳ To Do / Backend Required

- **Backend Services** (FastAPI)
  - Database models & schema
  - API endpoints for all features
  - Authentication (JWT + Google OAuth)
  - Quiz logic & scoring
  - Mock interview orchestration
  - Code execution (Python + SQL)
  - AI integration (Gemini API)
  - RAG pipeline for Q&A
  - User management
  - Leaderboard logic

- **Database Setup** (Supabase)
  - PostgreSQL setup
  - Schema migration
  - Indexes & views

- **Integrations**
  - Google OAuth setup
  - Google Gemini API keys
  - AWS S3 bucket configuration

---

## 🚀 Quick Start Guide

### Prerequisites

- Node.js 18+ and npm
- Python 3.12 (for backend)
- Git

### Local Development

#### 1. **Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Fill in your environment variables:
# - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
# - NEXTAUTH_SECRET=your_32_char_secret
# - NEXTAUTH_URL=http://localhost:3000

# Start dev server (with HMR)
npm run dev

# Build for production
npm run build
npm start

# Lint check
npm run lint
```

**Frontend will be available at**: http://localhost:3000

#### 2. **Backend Setup** (Once ready)

```bash
cd backend

# Create .env from example
cp .env.example .env

# Fill required API keys:
# - DATABASE_URL (Supabase PostgreSQL)
# - JWT_SECRET_KEY (32+ char)
# - SECRET_KEY (32+ char)
# - GEMINI_API_KEY (Google AI Studio)
# - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
# - AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY
# - AWS_S3_BUCKET

# With Docker Compose
docker compose up -d

# Or manually
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend API will be available at**: http://localhost:8000
**Swagger Docs**: http://localhost:8000/docs

---

## 🔧 Environment Variables

### Frontend (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_-base64_32
```

### Backend (.env)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase PostgreSQL asyncpg URL |
| `JWT_SECRET_KEY` | ✅ | 32+ char random string |
| `SECRET_KEY` | ✅ | 32+ char random string |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | ✅ | AWS IAM user secret key |
| `AWS_S3_BUCKET` | ✅ | S3 bucket name (e.g., `interviewforge-assets`) |
| `ALLOWED_ORIGINS` | ✅ | Frontend URL (comma-separated) |
| `REDIS_URL` | ⬜ | Redis URL (for rate limiting) |

---

## 📁 Project Structure

```
interviewforge/
├── frontend/                          # Next.js 14 Frontend
│   ├── public/                        # Static assets
│   │   └── manifest.json
│   ├── src/
│   │   ├── app/                       # Next.js App Router pages
│   │   │   ├── (auth)/                # Auth group layout
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── leaderboard/
│   │   │   ├── notifications/
│   │   │   ├── progress/
│   │   │   ├── subjects/
│   │   │   │   ├── [slug]/
│   │   │   │   │   ├── ai-assistant/
│   │   │   │   │   ├── coding/
│   │   │   │   │   ├── mock-interview/
│   │   │   │   │   ├── notes/
│   │   │   │   │   └── quiz/
│   │   │   ├── company-interview/
│   │   │   ├── resume-interview/
│   │   │   ├── global-error.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── page.tsx              # Root redirect
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Skeleton.tsx
│   │   │   ├── layout/                # Page layout components
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── charts/                # Data visualization
│   │   │       ├── ProgressRing.tsx
│   │   │       ├── ScoreBarChart.tsx
│   │   │       ├── StreakCalendar.tsx
│   │   │       └── TopicRadarChart.tsx
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useProgress.ts
│   │   │   └── useTimer.ts
│   │   ├── services/                  # API client services
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   └── quizService.ts
│   │   ├── store/                     # Zustand state stores
│   │   │   ├── authStore.ts
│   │   │   ├── quizStore.ts
│   │   │   └── uiStore.ts
│   │   ├── types/                     # TypeScript interfaces
│   │   │   ├── api.types.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── interview.types.ts
│   │   │   ├── quiz.types.ts
│   │   │   └── subject.types.ts
│   │   ├── utils/                     # Utility functions
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   └── middleware.ts              # Next.js middleware
│   ├── .eslintrc.json
│   ├── tailwind.config.ts
│   ├── next.config.js                 # Next.js configuration (Fixed)
│   ├── tsconfig.json
│   ├── package.json
│   └── package-lock.json
│
├── backend/                           # FastAPI Backend (structure only)
│   ├── app/
│   │   ├── api/v1/routers/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ai/
│   └── requirements.txt
│
├── infra/
│   ├── supabase_setup.sql             # DB schema & migrations
│   ├── render.yaml                    # Backend deployment
│   └── vercel.json                    # Frontend deployment config
│
├── README.md
├── DEPLOYMENT.md                      # Deployment guide
├── IMPLEMENTATION.md                  # This file
└── docker-compose.yml
```

---

## 🎨 Design System

### Colors

- **Primary**: Blue (#2563EB)
- **Secondary**: Cyan (#06B6D4)
- **Accent**: Green (#10B981)
- **Dark**: Navy (#0F172A)
- **Neutral**: Gray scale

### Typography

- **Headings**: Inter (600-800 weight)
- **Body**: Inter (400-500 weight)
- **Monospace**: JetBrains Mono (code blocks)

### Components

- **Glassmorphism**: Blur + transparency for modern UI
- **Custom animations**: Fade, slide, scale, float, shimmer
- **Responsive**: Mobile-first Tailwind CSS approach

---

## 🔗 Important Links & Commands

### Development

```bash
# Frontend
cd frontend && npm run dev         # Start dev server
cd frontend && npm run build       # Production build
cd frontend && npm run lint        # Lint check

# Backend
cd backend && uvicorn main:app --reload

# Docker
docker compose up -d               # Start all services
docker compose down                # Stop all services
```

### Documentation

- **README.md**: Project overview and tech stack
- **DEPLOYMENT.md**: Full deployment guide with step-by-step instructions
- **IMPLEMENTATION.md**: This file — detailed implementation guide

### Key Files to Know

- **Frontend Config**: `frontend/next.config.js`
- **Styles**: `frontend/src/app/globals.css`
- **Tailwind Config**: `frontend/tailwind.config.ts`
- **Auth Middleware**: `frontend/src/middleware.ts`
- **Auth Store**: `frontend/src/store/authStore.ts`

---

## ✨ Next Steps to Complete the Project

### Phase 1: Backend Setup (High Priority)

1. Set up Supabase PostgreSQL database
2. Run schema migrations (`infra/supabase_setup.sql`)
3. Implement FastAPI backend with all API endpoints
4. Set up Google OAuth integration
5. Configure Gemini API for AI features

### Phase 2: API Integration (High Priority)

1. Connect frontend to backend API
2. Implement authentication flow (login, register, JWT)
3. Test all API endpoints
4. Set up error handling & logging

### Phase 3: Feature Implementation

1. **Quiz Engine**: Implement quiz logic, timer, scoring
2. **Mock Interview**: AI-driven question orchestration
3. **Code Editor**: Python & SQL execution
4. **AI Chat**: RAG-powered Q&A
5. **Leaderboard**: Ranking calculations

### Phase 4: Deployment

1. Deploy backend to Render
2. Deploy frontend to Vercel
3. Configure CI/CD with GitHub Actions
4. Set up monitoring & logging

### Phase 5: Polish & Optimization

1. PWA support
2. Performance optimization
3. Analytics integration
4. Advanced testing

---

## 🛠️ Troubleshooting

### Frontend Won't Start

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run dev
```

### Build Errors

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Clean build
npm run build
```

### Environment Issues

- Ensure all `.env.local` variables are set
- Check `.env.example` for required variables
- Verify backend API URL is correct

---

## 📞 Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Zustand**: https://github.com/pmndrs/zustand
- **FastAPI**: https://fastapi.tiangolo.com
- **Supabase**: https://supabase.com/docs

---

## 📝 Notes for Developers

1. **Type Safety**: Always use TypeScript interfaces from `src/types/`
2. **API Calls**: Use axios clients from `src/services/`
3. **State**: Use Zustand stores, not useState for shared state
4. **Styling**: Use Tailwind utilities + CSS variables for consistency
5. **Error Handling**: Wrap API calls in try-catch and show toast notifications
6. **Dark Mode**: Uses CSS class `dark` on `<html>` tag (localStorage synced)

---

## 🎉 Project Status

✅ **Frontend**: Fully scaffolded and running
✅ **Styling**: Complete with dark/light theme
⏳ **Backend**: Pending implementation
⏳ **Database**: Pending Supabase setup
⏳ **Deployment**: Pending backend + frontend configuration

**Current**: Frontend development ready at http://localhost:3000

---

Last Updated: June 29, 2026

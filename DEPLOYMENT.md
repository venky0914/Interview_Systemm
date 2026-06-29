# InterviewForge AI — Deployment Guide

## Architecture Overview
```
Frontend (Next.js)  →  Vercel
Backend (FastAPI)   →  Render
Database (PostgreSQL) → Supabase
File Storage        →  AWS S3
AI                  →  Google Gemini API
```

---

## Step 1 — Supabase PostgreSQL

1. Go to https://supabase.com → Create new project
2. Select region: **Southeast Asia (Singapore)**
3. Save your database password securely
4. Go to **Settings → Database**
5. Copy the **Connection String (URI)** — use the `postgresql+asyncpg://` format:
   ```
   postgresql+asyncpg://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
6. Open **SQL Editor** → paste and run `infra/supabase_setup.sql`

---

## Step 2 — AWS S3

1. Go to AWS Console → S3 → **Create bucket**
   - Name: `interviewforge-assets`
   - Region: `ap-south-1` (Mumbai)
   - Uncheck "Block all public access" (for public note PDFs)
2. Go to **IAM → Create user** with `AmazonS3FullAccess`
3. Generate **Access Key ID** and **Secret Access Key**
4. Add bucket CORS policy:
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedOrigins": ["https://interviewforge.vercel.app", "http://localhost:3000"],
  "ExposeHeaders": []
}]
```

---

## Step 3 — Google OAuth + Gemini

### Google OAuth
1. Go to https://console.cloud.google.com
2. Create a new project → **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/google/callback` (dev)
   - `https://interviewforge-backend.onrender.com/api/v1/auth/google/callback` (prod)
5. Copy **Client ID** and **Client Secret**

### Gemini API
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy it as `GEMINI_API_KEY`

---

## Step 4 — Deploy Backend to Render

1. Push your code to GitHub
2. Go to https://render.com → **New → Web Service**
3. Connect your GitHub repo → select `backend/` as root directory
4. Configure:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`
5. Add all environment variables from `backend/.env.example`
6. Set `DATABASE_URL` to your Supabase URI
7. Set `ALLOWED_ORIGINS` to `https://interviewforge.vercel.app`
8. Click **Deploy**

### Database migrations on Render
After first deploy, open the Render shell:
```bash
alembic upgrade head
```

---

## Step 5 — Deploy Frontend to Vercel

1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://interviewforge-backend.onrender.com/api/v1
   NEXT_PUBLIC_APP_URL=https://interviewforge.vercel.app
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NEXTAUTH_SECRET=generate_with_openssl_rand_-base64_32
   NEXTAUTH_URL=https://interviewforge.vercel.app
   ```
5. Click **Deploy**

---

## Step 6 — GitHub Actions Secrets

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `RENDER_API_KEY` | From Render account settings |
| `RENDER_DEPLOY_HOOK_URL` | From Render service settings |
| `VERCEL_TOKEN` | From Vercel account settings |
| `VERCEL_ORG_ID` | From `vercel link` output |
| `VERCEL_PROJECT_ID` | From `vercel link` output |

---

## Step 7 — Create First Admin User

After deployment, run in the Render shell or locally:
```python
# backend/scripts/create_admin.py
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin = User(
            email="admin@interviewforge.ai",
            full_name="Admin",
            hashed_password=hash_password("your_secure_password"),
            is_admin=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Admin created: {admin.email}")

asyncio.run(create_admin())
```

```bash
python scripts/create_admin.py
```

---

## Local Development

```bash
# Start all services
docker compose up -d

# Backend (auto-reloads)
cd backend
cp .env.example .env  # fill your API keys
uvicorn main:app --reload

# Frontend (hot reload)
cd frontend
cp .env.example .env.local  # fill your keys
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

---

## Environment Variables Reference

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
| `AWS_S3_BUCKET` | ✅ | S3 bucket name |
| `ALLOWED_ORIGINS` | ✅ | Frontend URL (comma-separated) |
| `REDIS_URL` | ⬜ | Redis URL (rate limiting cache) |

### Frontend (.env.local)
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `NEXTAUTH_SECRET` | ✅ | Random 32-char string |
| `NEXTAUTH_URL` | ✅ | Frontend public URL |

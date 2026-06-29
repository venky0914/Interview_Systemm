# Deployment Guide - InterviewForge AI

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected
- Node.js 18+

### Option 1: Deploy via Vercel CLI (Recommended)

```bash
cd frontend
vercel --prod
```

Follow the prompts:
- Select "y" for existing project
- Select your project
- Environment variables will be configured automatically

### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Select `frontend` directory
5. Add environment variables
6. Click "Deploy"

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=InterviewForge AI
```

---

## Backend Deployment (Render.com)

### Prerequisites
- Render account (https://render.com)
- GitHub repository connected
- Python 3.11+

### Backend Environment Variables

```env
APP_NAME=InterviewForge AI
APP_ENV=production
DEBUG=false
SECRET_KEY=<generate-secure-key>
ALLOWED_ORIGINS=https://yourdomain.vercel.app

DATABASE_URL=postgresql+asyncpg://user:password@host:5432/interviewforge
REDIS_URL=redis://:password@host:6379

JWT_SECRET_KEY=<generate-secure-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

GOOGLE_CLIENT_ID=<from-google-cloud>
GOOGLE_CLIENT_SECRET=<from-google-cloud>
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/v1/auth/google/callback

GEMINI_API_KEY=<from-google-ai>

AWS_ACCESS_KEY_ID=<from-aws>
AWS_SECRET_ACCESS_KEY=<from-aws>
AWS_S3_BUCKET=interviewforge-assets
AWS_REGION=us-east-1
```

### Step-by-Step Deployment

1. **Create Render Service**
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `backend` directory

2. **Configure Build Settings**
   - **Name**: interviewforge-api
   - **Environment**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

3. **Set Environment Variables**
   - Add all backend environment variables from the list above

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

---

## Database Setup

### Option 1: AWS RDS PostgreSQL

1. Create RDS instance
2. Save connection string
3. Add to `DATABASE_URL` env var
4. Run migrations:
   ```bash
   alembic upgrade head
   ```

### Option 2: Neon PostgreSQL

1. Sign up at https://neon.tech
2. Create project
3. Get connection string
4. Add to `DATABASE_URL` env var

---

## Redis Setup

### Option 1: Redis Cloud

1. Sign up at https://redis.com/try-free
2. Create database
3. Get connection string
4. Add to `REDIS_URL` env var

### Option 2: Upstash Redis

1. Sign up at https://upstash.com
2. Create database
3. Get connection string
4. Add to `REDIS_URL` env var

---

## AWS S3 Setup

1. Create S3 bucket: `interviewforge-assets`
2. Enable CORS
3. Create IAM user with S3 access
4. Save AWS credentials
5. Add to environment variables

---

## Verification

### Frontend
```bash
curl https://yourdomain.vercel.app
```

### Backend
```bash
curl https://api.yourdomain.com/docs
curl https://api.yourdomain.com/health
```

### API Test
```bash
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

---

## Custom Domain Setup

### Frontend (Vercel)
1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your domain
5. Update DNS records

### Backend (Render)
1. Go to Render dashboard
2. Select your service
3. Go to "Settings" → "Custom Domain"
4. Add your domain
5. Update DNS records

---

## Monitoring & Logs

### Vercel
- https://vercel.com/docs/observability

### Render
- https://render.com/docs/logging

---

## Troubleshooting

**Frontend won't build**
- Clear .next directory: `rm -rf .next`
- Check Node version: `node --version` (should be 18+)
- Install dependencies: `npm install`

**Backend connection issues**
- Check DATABASE_URL format
- Verify Redis connection
- Check CORS settings in config.py

**API 502 errors**
- Check backend logs in Render
- Verify environment variables
- Check database connection

---

## Success Metrics

- Frontend loads in < 2s
- API responds in < 500ms
- Database queries complete in < 100ms
- Authentication works end-to-end
- Quiz questions load properly
- AI feedback generation works

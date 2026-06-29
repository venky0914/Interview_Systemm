# InterviewForge AI - Ready to Deploy

## ✓ Pre-Deployment Checklist Complete

- [x] Frontend successfully builds for production
- [x] Backend API fully implemented
- [x] Database schema created with migrations
- [x] All environment configurations prepared
- [x] Deployment configurations (Vercel + Render)
- [x] GitHub repository connected
- [x] Git history clean with meaningful commits

## 🚀 Quick Start Deployment

### Step 1: Deploy Frontend to Vercel

```bash
cd frontend
vercel --prod
```

**Expected Output:**
```
✓ Vercel CLI
✓ Production URL: https://interviewforge.vercel.app
✓ Deployment successful in < 2 minutes
```

### Step 2: Deploy Backend to Render

Visit: https://render.com/dashboard

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Set these values:
   - **Name**: interviewforge-api
   - **Root Directory**: backend
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.11

4. Add Environment Variables (see list below)

**Expected Output:**
```
✓ Backend URL: https://interviewforge-api.onrender.com
✓ Deployment successful in < 5 minutes
```

### Step 3: Set Up Database (Choose One)

#### Option A: PostgreSQL on AWS RDS
1. Create RDS instance (PostgreSQL 14+)
2. Get connection string
3. Add to `DATABASE_URL`

#### Option B: Neon PostgreSQL (Recommended)
1. Go to https://neon.tech
2. Sign up and create project
3. Copy connection string
4. Add to `DATABASE_URL`

### Step 4: Set Up Redis (Choose One)

#### Option A: Redis Cloud
1. Go to https://redis.com/try-free
2. Create database
3. Copy connection string
4. Add to `REDIS_URL`

#### Option B: Upstash
1. Go to https://upstash.com
2. Create database
3. Copy connection string
4. Add to `REDIS_URL`

## 🔐 Required Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://interviewforge-api.onrender.com
NEXT_PUBLIC_APP_NAME=InterviewForge AI
```

### Backend (.env)
```
# App Configuration
APP_NAME=InterviewForge AI
APP_ENV=production
DEBUG=false
SECRET_KEY=<generate with: openssl rand -hex 32>
ALLOWED_ORIGINS=https://interviewforge.vercel.app,https://www.interviewforge.com

# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:port/dbname
REDIS_URL=redis://:password@host:port

# JWT
JWT_SECRET_KEY=<generate with: openssl rand -hex 32>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://interviewforge-api.onrender.com/api/v1/auth/google/callback

# Google Gemini API
GEMINI_API_KEY=<from Google AI Studio>

# AWS S3
AWS_ACCESS_KEY_ID=<from AWS IAM>
AWS_SECRET_ACCESS_KEY=<from AWS IAM>
AWS_S3_BUCKET=interviewforge-assets
AWS_REGION=us-east-1
```

## 🔗 Deployment Links (After Deployment)

Once deployed, your application will be available at:

- **Frontend**: https://interviewforge.vercel.app
- **Backend API**: https://interviewforge-api.onrender.com
- **API Documentation**: https://interviewforge-api.onrender.com/docs
- **API ReDoc**: https://interviewforge-api.onrender.com/redoc

## ✅ Post-Deployment Verification

### Test Frontend
```bash
curl -I https://interviewforge.vercel.app
# Should return 200 OK
```

### Test Backend
```bash
curl https://interviewforge-api.onrender.com/health
# Should return {"status":"ok"}
```

### Test API
```bash
curl -X POST https://interviewforge-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test@1234",
    "name":"Test User"
  }'
```

### Test Full Flow
1. Open https://interviewforge.vercel.app
2. Click "Register" or "Login"
3. Create account with test credentials
4. Complete profile setup
5. Start a quiz
6. Verify scoring works

## 🛠️ Troubleshooting

### Frontend won't deploy
- Check Node version: `node --version` (should be 18+)
- Clear cache: `rm -rf .next node_modules package-lock.json`
- Reinstall: `npm install && npm run build`

### Backend crashes after deployment
- Check logs in Render dashboard
- Verify DATABASE_URL format
- Verify all required environment variables are set
- Check Python version (should be 3.11+)

### Can't connect Frontend to Backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings in backend
- Verify backend is running: `curl https://interviewforge-api.onrender.com/health`

### Database connection fails
- Verify DATABASE_URL format: `postgresql+asyncpg://user:password@host:5432/db`
- Check database is publicly accessible
- Verify credentials are correct
- Run migrations: `alembic upgrade head`

## 📊 Monitoring & Analytics

### Vercel Analytics
- Dashboard: https://vercel.com/dashboard
- Check performance metrics
- Monitor function calls
- Review error logs

### Render Logs
- Go to service dashboard
- Click "Logs" tab
- Search for errors
- Monitor CPU/Memory usage

### Application Health
- Backend health: https://interviewforge-api.onrender.com/health
- Database connectivity: Check in backend logs
- API response times: Monitor in Vercel analytics

## 🔄 Continuous Deployment

Both Vercel and Render are configured for automatic deployment:

1. Make changes to your code
2. Push to GitHub: `git push origin project-implementation`
3. Vercel automatically deploys frontend
4. Render automatically deploys backend
5. Changes live in < 5 minutes

## 📝 Custom Domain Setup (Optional)

### Vercel (Frontend)
1. Go to project settings
2. Add domain under "Domains"
3. Update DNS records at registrar
4. Wait 5-10 minutes for verification

### Render (Backend)
1. Go to service settings
2. Add custom domain
3. Update DNS records at registrar
4. Wait for verification

## 🚨 Important Notes

- Keep your `.env` files secure, never commit them
- Generate new SECRET_KEY and JWT_SECRET_KEY for production
- Use strong database passwords
- Enable CloudFlare or similar for DDoS protection
- Set up SSL/TLS certificates (done automatically by Vercel/Render)
- Monitor logs for errors and security issues
- Regular backups of PostgreSQL database
- Monitor S3 storage usage and costs

## 📞 Support

If you encounter issues:

1. Check logs in Vercel/Render dashboard
2. Review error messages carefully
3. Check GitHub issues for similar problems
4. Read framework documentation:
   - Next.js: https://nextjs.org/docs
   - FastAPI: https://fastapi.tiangolo.com
   - PostgreSQL: https://www.postgresql.org/docs

## 🎉 Success!

Your InterviewForge AI application is now deployed and live!

Deployment URLs:
- Frontend: https://interviewforge.vercel.app
- Backend: https://interviewforge-api.onrender.com

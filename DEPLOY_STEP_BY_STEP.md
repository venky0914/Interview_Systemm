# InterviewForge AI - Step-by-Step Deployment Guide

## PART 1: DEPLOY FRONTEND (Next.js App)

### Step 1: Go to Vercel Website
- Open browser: https://vercel.com
- Click "Sign Up" (or login if you have account)
- Sign up using GitHub account (easier)

### Step 2: Connect Your GitHub Repository
- After login, click "Add New" → "Project"
- Search for: `Interview_Systemm`
- Click to import it
- Vercel will show the repository

### Step 3: Configure the Project
- **Project Name**: `interviewforge` (or any name you like)
- **Framework Preset**: Should auto-detect as "Next.js"
- **Root Directory**: Click "Edit" → Type `frontend`
- **Build Command**: Keep default `npm run build`
- **Output Directory**: Keep default `.next`

### Step 4: Add Environment Variables
- Scroll down to "Environment Variables"
- Add this variable:
  - Key: `NEXT_PUBLIC_API_URL`
  - Value: `http://localhost:8000` (for now, we'll update later)
- Click "Add"
- Click "Deploy"

### Step 5: Wait for Deployment
- Vercel will build and deploy automatically
- You'll see a progress indicator
- Once done, you'll get a URL like: `https://interviewforge.vercel.app`

**Your Frontend is now LIVE!** ✓

---

## PART 2: DEPLOY BACKEND (FastAPI App)

### Step 1: Go to Render Website
- Open browser: https://render.com
- Click "Sign Up" or Login with GitHub

### Step 2: Connect Your GitHub Repository
- After login, click "New" → "Web Service"
- Click "Connect repository"
- Search and select `Interview_Systemm`
- Click "Connect"

### Step 3: Configure the Backend Service
Fill in these settings:

- **Name**: `interviewforge-api`
- **Environment**: Select `Python 3.11`
- **Region**: Select closest to you (default is fine)
- **Branch**: `project-implementation`
- **Root Directory**: `backend`
- **Build Command**: 
  ```
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### Step 4: Add Environment Variables
Click "Environment" on the left, then add these:

```
APP_NAME=InterviewForge AI
APP_ENV=production
DEBUG=false
SECRET_KEY=your-secret-key-12345
ALLOWED_ORIGINS=https://interviewforge.vercel.app

DATABASE_URL=postgresql://localhost/interviewforge
REDIS_URL=redis://localhost:6379

JWT_SECRET_KEY=your-jwt-secret-12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://interviewforge-api.onrender.com/api/v1/auth/google/callback

GEMINI_API_KEY=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=interviewforge-assets
AWS_REGION=us-east-1
```

(Most can stay empty for testing, just set the required ones above)

### Step 5: Deploy
- Click "Deploy Web Service"
- Render will start building
- Wait for build to complete (5-10 minutes)
- You'll get a URL like: `https://interviewforge-api.onrender.com`

**Your Backend is now LIVE!** ✓

---

## PART 3: UPDATE FRONTEND WITH BACKEND URL

### Step 1: Go Back to Vercel
- Open: https://vercel.com
- Click on your `interviewforge` project

### Step 2: Update Environment Variable
- Click "Settings" → "Environment Variables"
- Find `NEXT_PUBLIC_API_URL`
- Change value from `http://localhost:8000` to `https://interviewforge-api.onrender.com`
- Click "Save"

### Step 3: Redeploy
- Click "Deployments"
- Click the 3-dot menu on latest deployment
- Click "Redeploy"
- Wait for it to finish

Now your frontend knows how to talk to your backend!

---

## PART 4: TEST YOUR APP

### Step 1: Open Your Frontend
- Go to: `https://interviewforge.vercel.app`
- You should see the login page

### Step 2: Test Backend API
- Open in new tab: `https://interviewforge-api.onrender.com/docs`
- You should see the interactive API documentation (Swagger UI)

### Step 3: Try to Register
- Go back to frontend
- Click "Sign Up"
- Enter email and password
- Click "Sign Up"
- If it works, great!

---

## PART 5: SETUP DATABASE (OPTIONAL - For Production)

If you want to store data in a real database:

### Option A: Use Neon (Free PostgreSQL)
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project
4. Copy connection string
5. Add to Render environment variables as `DATABASE_URL`

### Option B: Use AWS RDS
1. Go to AWS console
2. Create RDS PostgreSQL instance
3. Get connection string
4. Add to Render environment variables as `DATABASE_URL`

---

## YOUR DEPLOYMENT LINKS

After following these steps, your app will be live at:

- **Frontend**: `https://interviewforge.vercel.app`
- **Backend API**: `https://interviewforge-api.onrender.com`
- **API Docs**: `https://interviewforge-api.onrender.com/docs`

---

## TROUBLESHOOTING

### Frontend Build Fails
- Check build logs in Vercel
- Make sure root directory is set to `frontend`
- Check that `package.json` exists in frontend folder

### Backend Build Fails
- Check build logs in Render
- Make sure root directory is set to `backend`
- Check that `requirements.txt` exists in backend folder

### Frontend Can't Connect to Backend
- Check environment variable `NEXT_PUBLIC_API_URL` is correct
- Make sure backend is running
- Check backend URL is accessible: visit `https://interviewforge-api.onrender.com/docs`

### Backend Won't Start
- Check all environment variables are set
- Check build logs for specific error
- Make sure Python 3.11 is selected

---

## SUMMARY

Done! Your app is deployed at:
- Frontend: https://interviewforge.vercel.app
- Backend: https://interviewforge-api.onrender.com

That's it! Your InterviewForge AI app is now live on the internet!

# Getting Started - InterviewForge AI Implementation

This guide will get you from zero to a running development environment in 15 minutes.

## Prerequisites

- **Operating System**: Linux, macOS, or Windows (WSL2)
- **Git**: Version control
- **Docker**: For PostgreSQL and Redis
- **Python**: 3.11+ (for backend)
- **Node.js**: 18+ (for frontend)
- **npm/yarn/pnpm**: Package manager

### Quick Check
```bash
git --version
docker --version
python --version  # 3.11+
node --version    # 18+
npm --version
```

---

## Step 1: Project Setup (2 minutes)

### Clone or Navigate to Project
```bash
cd /vercel/share/v0-project
# or if cloning:
# git clone https://github.com/venky0914/Interview_Systemm.git
# cd Interview_Systemm
```

### Verify Project Structure
```bash
ls -la
# You should see: frontend/, backend/, docker-compose.yml, README.md, etc.
```

---

## Step 2: Infrastructure Setup (3 minutes)

### Start Docker Services
```bash
docker-compose up -d db redis
```

### Verify Services Running
```bash
docker-compose ps
# You should see: db (healthy), redis (running)
```

### Wait for Database
```bash
# Give it 5-10 seconds
sleep 10

# Verify connection
docker-compose exec db psql -U postgres -d interviewforge -c "SELECT 1;"
# Should return: (1 row)
```

---

## Step 3: Backend Setup (5 minutes)

### Navigate to Backend
```bash
cd backend
```

### Create Environment File
```bash
cp .env.example .env
# Now edit .env with your configuration
# For local development, defaults are usually fine
```

### Install Dependencies
```bash
pip install -r requirements.txt
# or if in virtual env:
# source venv/bin/activate
# pip install -r requirements.txt

# If you get psycopg2 errors:
# pip install --system -r requirements.txt
```

### Initialize Database
```bash
python scripts/init_db.py
# Output should show: ✓ Database tables created successfully
```

### Seed Sample Questions
```bash
python scripts/seed_questions.py
# Output should show: ✓ Seeded 20 sample questions
```

### Start Backend Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Wait for: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## Step 4: Frontend Setup (3 minutes)

### In a New Terminal, Navigate to Frontend
```bash
cd frontend
```

### Install Dependencies (already done, but verify)
```bash
npm install  # or already complete
```

### Start Development Server
```bash
npm run dev
# Wait for: ▲ Next.js 14.2.5 ready on http://localhost:3000
```

---

## Step 5: Verification (2 minutes)

### Test Backend
```bash
# In a new terminal
curl http://localhost:8000/health

# Should return:
# {"status":"ok","app":"InterviewForge AI","env":"development"}
```

### Test Database
```bash
# Check user count
curl -s http://localhost:8000/api/v1/users/count

# Check question count
psql -U postgres -d interviewforge -c "SELECT COUNT(*) FROM questions;"
```

### Test Frontend
Open in your browser:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs

---

## Development Environment Ready!

You now have a fully functional development setup:

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | http://localhost:3000 | ✅ |
| Backend | http://localhost:8000 | ✅ |
| API Docs | http://localhost:8000/docs | ✅ |
| Database | localhost:5432 | ✅ |
| Cache | localhost:6379 | ✅ |

---

## Next Steps

### Option 1: Complete Phase 1 (Database)
```bash
# Already done! Jump to Phase 2
```

### Option 2: Start Phase 2 (Authentication)
```bash
# Test registration endpoint
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "TestPassword123",
    "confirm_password": "TestPassword123"
  }'
```

### Option 3: Add Questions
```bash
# Add more questions via admin endpoint or directly in database
cd backend
python scripts/seed_questions.py  # Run again for more questions
```

---

## Common Commands Reference

### Backend Commands

```bash
# Start backend with auto-reload
cd backend
uvicorn main:app --reload

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Add new table"

# Rollback migration
alembic downgrade -1

# Reset database
python scripts/init_db.py  # Re-initializes tables

# Seed data
python scripts/seed_questions.py
```

### Frontend Commands

```bash
# Start development server
cd frontend
npm run dev

# Build for production
npm run build

# Run in production mode
npm run start

# Lint code
npm run lint
```

### Docker Commands

```bash
# View logs
docker-compose logs db
docker-compose logs -f  # Follow logs

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart services
docker-compose restart
```

### Database Commands

```bash
# Connect to database
psql -U postgres -d interviewforge

# Common queries:
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM questions;
SELECT * FROM subjects;

# Export data
pg_dump -U postgres -d interviewforge > backup.sql

# Import data
psql -U postgres -d interviewforge < backup.sql
```

---

## Testing Your Setup

### Test User Registration
```bash
# 1. Register
RESPONSE=$(curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "full_name": "New User",
    "password": "NewPassword123",
    "confirm_password": "NewPassword123"
  }')

echo $RESPONSE | jq .

# Should return:
# { user: {...}, tokens: {access_token, refresh_token}, message: "Account created successfully" }
```

### Test Login
```bash
# 2. Login with the user
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewPassword123"
  }' | jq .
```

### Test Protected Endpoint
```bash
# 3. Get current user (protected)
TOKEN="your-access-token-from-above"

curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Test Quiz Endpoint
```bash
# 4. Get subjects
curl -X GET http://localhost:8000/api/v1/subjects \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Troubleshooting

### Database Connection Errors
```bash
# Check if Docker is running
docker ps

# Check logs
docker-compose logs db

# Restart services
docker-compose down
docker-compose up -d db redis
```

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.11+

# Check dependencies
pip list | grep fastapi

# Try reinstalling
pip install -r requirements.txt --upgrade
```

### Frontend Won't Start
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check if port 3000 is in use
lsof -i :3000  # Kill process if needed
```

### Database Port Already in Use
```bash
# If port 5432 is taken:
# Change in docker-compose.yml or stop other services
docker ps  # See what's running
docker stop container_id
```

### API Documentation Not Loading
```bash
# If http://localhost:8000/docs gives 404:
# Check that DEBUG=true in backend/.env
# Restart backend: Ctrl+C and rerun uvicorn
```

---

## Development Tips

### Auto-save & Hot Reload
Both frontend and backend support auto-reload:
- **Frontend**: Changes save automatically (HMR)
- **Backend**: Changes detected with `--reload` flag

Just edit files and refresh browser/check terminal.

### Database Debugging
```bash
# Connect to DB to debug
psql -U postgres -d interviewforge

# List tables
\dt

# Describe table
\d users

# Run query
SELECT * FROM users LIMIT 5;

# Exit
\q
```

### API Testing
Use Swagger UI for interactive testing:
1. Go to http://localhost:8000/docs
2. Click on any endpoint
3. Click "Try it out"
4. Modify parameters
5. Click "Execute"

### Check Logs
```bash
# Backend terminal - watch for errors
# Frontend terminal - watch for build errors
# Docker - check service logs

docker-compose logs --tail=50 db  # Last 50 lines
```

---

## Performance Tips

### Speed Up Database
```bash
# Create index on frequently queried columns
psql -U postgres -d interviewforge -c "
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_quiz_user ON quiz_attempts(user_id);
CREATE INDEX idx_users_email ON users(email);
"
```

### Speed Up Frontend
```bash
# Use production build
npm run build
npm run start  # Production server (faster than dev)
```

### Monitor Performance
```bash
# Check database query time
psql -U postgres -d interviewforge

SET search_path TO public;
EXPLAIN ANALYZE SELECT * FROM questions LIMIT 100;
```

---

## Next: Implementation Phases

Now that you're set up, follow the phases:

1. **Phase 1 Complete** ✅ - Database is running with sample data
2. **Phase 2** - Implement authentication (2 days)
   - [ ] Test registration endpoint
   - [ ] Test login endpoint
   - [ ] Integrate frontend login

3. **Phase 3** - Quiz engine (2 days)
   - [ ] Create quiz start endpoint
   - [ ] Add question submission endpoint
   - [ ] Build quiz results page

4. **Phase 4** - AI integration (2 days)
   - [ ] Set up Gemini API
   - [ ] Implement RAG pipeline
   - [ ] Add feedback generation

... and so on through Phase 7.

See **IMPLEMENTATION_CHECKLIST.md** for detailed checklist.

---

## Getting Help

### Documentation
- **EXECUTIVE_SUMMARY.md** - Project overview
- **FULL_IMPLEMENTATION_GUIDE.md** - Complete 7-phase guide
- **IMPLEMENTATION_CHECKLIST.md** - Progress tracker
- **API Docs** - http://localhost:8000/docs

### Debug Mode
```bash
# Enable more verbose logging
export DEBUG=true
cd backend
uvicorn main:app --reload --log-level debug
```

### Community/Support
- Check GitHub issues
- Review code comments
- Check example endpoints in `/docs`

---

## Summary

You now have:
- ✅ Full development environment running
- ✅ Database initialized with sample data
- ✅ Backend API with authentication scaffolding
- ✅ Frontend ready for integration
- ✅ API documentation available
- ✅ Clear implementation roadmap

**Total time**: ~15 minutes
**Next action**: Follow the implementation checklist for Phase 2

Happy coding! 🚀

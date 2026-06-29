# Phases 4-7: Detailed Implementation Guide

This document provides step-by-step implementation instructions for the final four phases of InterviewForge AI.

---

## Phase 4: AI Integration & Gemini API (Est. 2 days)

### Prerequisites
- Google Cloud account with Gemini API enabled
- API key obtained from Google AI Studio

### Step 1: Environment Setup

**1.1 Get Gemini API Key**
```bash
# Go to: https://makersuite.google.com/app/apikeys
# Create new API key
# Add to backend/.env
echo "GEMINI_API_KEY=your-key-here" >> backend/.env
```

**1.2 Install Dependencies** (already in requirements.txt)
```bash
pip install google-generativeai==0.7.2
pip install langchain==0.2.14
pip install langchain-google-genai==1.0.8
pip install sentence-transformers==3.0.1
pip install faiss-cpu==1.8.0
```

### Step 2: Initialize RAG Pipeline

**2.1 Build Vector Embeddings**
```bash
# Run from backend directory
python scripts/init_rag.py

# This will:
# - Load all questions from database
# - Generate embeddings using Sentence Transformers
# - Build FAISS index for similarity search
# - Save index to disk
```

**2.2 Verify RAG Pipeline**
```python
# Test in Python shell
from app.ai.rag_pipeline import rag_pipeline

# Generate feedback
feedback = await rag_pipeline.generate_feedback(
    question_id="question-uuid",
    user_answer="user's answer",
    difficulty="medium"
)

print(feedback)
```

### Step 3: Implement AI Feedback Endpoint

**Backend Endpoint** (`/backend/app/api/v1/routers/quiz.py`):

```python
from fastapi import APIRouter, Depends
from app.ai.rag_pipeline import rag_pipeline
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/quiz", tags=["Quiz"])

@router.post("/{quiz_id}/feedback")
async def get_quiz_feedback(
    quiz_id: str,
    question_id: str,
    user_answer: str,
    difficulty: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI feedback for a quiz answer using RAG pipeline."""
    feedback = await rag_pipeline.generate_feedback(
        question_id=question_id,
        user_answer=user_answer,
        difficulty=difficulty,
        context_size=5  # Use top 5 similar answers
    )
    return feedback
```

### Step 4: Frontend Integration

**Frontend Service** (`/frontend/src/services/quizService.ts`):

```typescript
async function getAiFeedback(
  quizId: string,
  questionId: string,
  userAnswer: string,
  difficulty: string
): Promise<AiFeedback> {
  const { data } = await api.post(
    `/quiz/${quizId}/feedback`,
    { question_id: questionId, user_answer: userAnswer, difficulty }
  );
  return data;
}
```

### Step 5: Testing

```bash
# 1. Start backend with Gemini API key set
export GEMINI_API_KEY="your-key"
cd backend
uvicorn main:app --reload

# 2. Test feedback endpoint
curl -X POST http://localhost:8000/api/v1/quiz/quiz-id/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q-id",
    "user_answer": "my answer",
    "difficulty": "medium"
  }'

# 3. Expected response:
# {
#   "overall_assessment": "...",
#   "strengths": [...],
#   "areas_for_improvement": [...],
#   "score": 75,
#   "suggestions": [...]
# }
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| API key not recognized | Verify in Google Cloud Console |
| FAISS index not found | Run `python scripts/init_rag.py` |
| Slow feedback generation | Increase `context_size` or reduce on first run |
| Out of memory with FAISS | Use `faiss-cpu` or reduce question count in index |

---

## Phase 5: Mock Interview System (Est. 2 days)

### Overview
Dynamic interview sessions where AI generates contextual follow-up questions based on user answers.

### Step 1: Database Setup

**Models Already Defined** (`/backend/app/models/progress.py`):
- `InterviewSession` - Tracks interview metadata
- `InterviewResponse` - Individual Q&A records

### Step 2: Interview Service

**Create** `/backend/app/services/interview_service.py`:

```python
from app.ai.gemini_client import gemini_client
from app.models.progress import InterviewSession, InterviewResponse
from app.schemas.interview import InterviewStartRequest, InterviewResponse as ResponseSchema

class InterviewService:
    async def start_interview(
        self, 
        payload: InterviewStartRequest,
        user: User,
        db: AsyncSession
    ) -> dict:
        """Start new interview session."""
        session = InterviewSession(
            user_id=user.id,
            subject_id=payload.subject_id,
            interview_type=payload.interview_type,
            difficulty=payload.difficulty,
            company=payload.company_name
        )
        db.add(session)
        await db.flush()
        
        # Generate first question
        first_question = await gemini_client.generate_interview_question(
            subject_id=payload.subject_id,
            difficulty=payload.difficulty,
            interview_type=payload.interview_type,
            context="Start of interview"
        )
        
        return {
            "session_id": str(session.id),
            "first_question": first_question,
            "question_index": 1
        }
    
    async def submit_answer(
        self,
        session_id: UUID,
        question_text: str,
        user_answer: str,
        user: User,
        db: AsyncSession
    ) -> dict:
        """Submit interview answer and get next question."""
        session = await db.get(InterviewSession, session_id)
        if not session or session.user_id != user.id:
            raise NotFoundError("Interview session not found")
        
        # Score current answer
        scores = await gemini_client.score_interview_answer(
            question=question_text,
            answer=user_answer,
            difficulty=session.difficulty
        )
        
        # Save response
        response = InterviewResponse(
            session_id=session_id,
            question_index=len(session.responses),
            ai_question=question_text,
            user_answer=user_answer,
            technical_score=scores.technical,
            communication_score=scores.communication,
            improvement_tip=scores.tip
        )
        session.responses.append(response)
        
        # Generate next question if not at limit
        if len(session.responses) < 8:
            next_question = await gemini_client.generate_follow_up_question(
                previous_questions=[r.ai_question for r in session.responses],
                previous_answers=[r.user_answer for r in session.responses],
                difficulty=session.difficulty
            )
        else:
            next_question = None
        
        return {
            "score": {
                "technical": scores.technical,
                "communication": scores.communication,
                "overall": (scores.technical + scores.communication) // 2
            },
            "feedback": scores.feedback,
            "next_question": next_question
        }
    
    async def finish_interview(
        self,
        session_id: UUID,
        user: User,
        db: AsyncSession
    ) -> dict:
        """End interview and generate report."""
        session = await db.get(InterviewSession, session_id)
        if not session:
            raise NotFoundError("Session not found")
        
        # Calculate overall score
        if session.responses:
            avg_technical = sum(r.technical_score or 0 for r in session.responses) / len(session.responses)
            avg_communication = sum(r.communication_score or 0 for r in session.responses) / len(session.responses)
            overall_score = int((avg_technical + avg_communication) / 2)
        else:
            overall_score = 0
        
        session.overall_score = overall_score
        session.ended_at = datetime.now(timezone.utc)
        await db.commit()
        
        return {
            "overall_score": overall_score,
            "responses": [ResponseSchema.from_orm(r) for r in session.responses],
            "report": await self._generate_report(session, db)
        }

interview_service = InterviewService()
```

### Step 3: API Endpoints

**Create** `/backend/app/api/v1/routers/interview.py`:

```python
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/interview", tags=["Interview"])

@router.post("/start")
async def start_interview(
    payload: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start mock interview session."""
    return await interview_service.start_interview(payload, current_user, db)

@router.post("/{session_id}/answer")
async def submit_interview_answer(
    session_id: UUID,
    payload: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit answer and get next question."""
    return await interview_service.submit_answer(
        session_id, payload.question, payload.answer, current_user, db
    )

@router.post("/{session_id}/finish")
async def finish_interview(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """End interview and get report."""
    return await interview_service.finish_interview(session_id, current_user, db)

@router.get("/{session_id}")
async def get_interview(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get interview details."""
    session = await db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise NotFoundError()
    return session
```

### Step 4: Frontend Integration

Frontend interview pages already exist at `/frontend/src/app/subjects/[slug]/mock-interview/`. Wire them to backend:

```typescript
// Mock interview component
async function startInterview() {
  const response = await api.post('/interview/start', {
    subject_id: subjectId,
    interview_type: 'technical',
    difficulty: 'medium',
  });
  setSessionId(response.session_id);
  setCurrentQuestion(response.first_question);
}

async function submitAnswer() {
  const response = await api.post(`/interview/${sessionId}/answer`, {
    question: currentQuestion,
    answer: userAnswer,
  });
  setFeedback(response.score);
  setCurrentQuestion(response.next_question);
}
```

---

## Phase 6: Progress Dashboard & Analytics (Est. 1-2 days)

### Step 1: Analytics Calculations

**Create** `/backend/app/services/analytics_service.py`:

```python
from sqlalchemy import func, select
from datetime import datetime, timedelta, timezone

class AnalyticsService:
    async def get_user_dashboard(self, user_id: UUID, db: AsyncSession) -> dict:
        """Get comprehensive dashboard analytics."""
        
        # Calculate streak
        streak = await self._calculate_streak(user_id, db)
        
        # Get quiz statistics
        result = await db.execute(
            select(
                func.count(QuizAttempt.id),
                func.avg(QuizAttempt.score_pct),
                func.max(QuizAttempt.score_pct),
                func.min(QuizAttempt.score_pct),
            ).where(QuizAttempt.user_id == user_id)
        )
        quiz_count, avg_score, max_score, min_score = result.one()
        
        # Get weak areas
        weak_areas = await self._get_weak_areas(user_id, db)
        
        # Get recent activity
        recent = await db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.completed_at.desc())
            .limit(5)
        )
        recent_quizzes = recent.scalars().all()
        
        return {
            "current_streak": streak,
            "total_quizzes": quiz_count,
            "average_score": float(avg_score) if avg_score else 0,
            "max_score": int(max_score) if max_score else 0,
            "min_score": int(min_score) if min_score else 0,
            "weak_areas": weak_areas,
            "recent_quizzes": recent_quizzes,
        }
    
    async def _calculate_streak(self, user_id: UUID, db: AsyncSession) -> int:
        """Calculate user's current streak."""
        today = datetime.now(timezone.utc).date()
        streak = 0
        
        for i in range(365):
            check_date = today - timedelta(days=i)
            result = await db.execute(
                select(func.count(QuizAttempt.id)).where(
                    (QuizAttempt.user_id == user_id) &
                    (func.date(QuizAttempt.completed_at) == check_date)
                )
            )
            if result.scalar() > 0:
                streak += 1
            else:
                break
        
        return streak
    
    async def _get_weak_areas(self, user_id: UUID, db: AsyncSession) -> list:
        """Identify subjects with lowest average scores."""
        result = await db.execute(
            select(
                Subject.name,
                func.avg(QuizAttempt.score_pct).label("avg_score"),
                func.count(QuizAttempt.id).label("attempts")
            )
            .join(QuizAttempt, QuizAttempt.subject_id == Subject.id)
            .where(QuizAttempt.user_id == user_id)
            .group_by(Subject.id)
            .order_by("avg_score")
            .limit(5)
        )
        return [{"subject": row[0], "avg_score": row[1], "attempts": row[2]} for row in result]

analytics_service = AnalyticsService()
```

### Step 2: Leaderboard Service

**Create** `/backend/app/services/leaderboard_service.py`:

```python
class LeaderboardService:
    async def get_global_leaderboard(
        self,
        limit: int = 100,
        offset: int = 0,
        db: AsyncSession = None
    ) -> list:
        """Get top users by score."""
        result = await db.execute(
            select(
                User.id,
                User.full_name,
                User.avatar_url,
                func.avg(QuizAttempt.score_pct).label("avg_score"),
                func.count(QuizAttempt.id).label("quiz_count"),
            )
            .join(QuizAttempt, QuizAttempt.user_id == User.id)
            .group_by(User.id)
            .order_by(desc("avg_score"))
            .offset(offset)
            .limit(limit)
        )
        
        rows = result.all()
        leaderboard = []
        for rank, (user_id, name, avatar, avg_score, count) in enumerate(rows, 1):
            leaderboard.append({
                "rank": rank,
                "user_id": str(user_id),
                "name": name,
                "avatar": avatar,
                "score": float(avg_score),
                "quizzes": count
            })
        return leaderboard

leaderboard_service = LeaderboardService()
```

### Step 3: Dashboard Endpoints

Add to `/backend/app/api/v1/routers/progress.py`:

```python
@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analytics_service.get_user_dashboard(current_user.id, db)

@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    return await leaderboard_service.get_global_leaderboard(limit=limit, db=db)
```

### Step 4: Frontend Dashboard

Dashboard component already exists. Connect to backend:

```typescript
// Dashboard.tsx
const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    api.get('/progress/dashboard').then(res => setDashboard(res.data));
  }, []);

  return (
    <div>
      <StreakCounter streak={dashboard?.current_streak} />
      <ScoreChart scores={dashboard?.recent_quizzes} />
      <WeakAreasChart areas={dashboard?.weak_areas} />
    </div>
  );
};
```

---

## Phase 7: File Storage & Admin Panel (Est. 2 days)

### Step 1: AWS S3 Setup

```bash
# Create S3 bucket
aws s3 mb s3://interviewforge-assets --region ap-south-1

# Enable CORS
aws s3api put-bucket-cors --bucket interviewforge-assets --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }]
}'

# Set environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_S3_BUCKET="interviewforge-assets"
```

### Step 2: Resume Upload Service

**Update** `/backend/app/services/resume_service.py`:

```python
from fastapi import UploadFile
from app.services.s3_service import s3_service
from app.services.ocr_service import ocr_service

class ResumeService:
    async def upload_resume(
        self,
        file: UploadFile,
        user_id: UUID,
        db: AsyncSession
    ) -> dict:
        """Upload resume and extract text."""
        
        # Upload to S3
        file_url = await s3_service.upload_file(
            file=file,
            folder=f"resumes/{user_id}",
            public=False
        )
        
        # Extract text using OCR
        extracted_text = await ocr_service.extract_text_from_file(file_url)
        
        # Parse resume details
        parsed = await ocr_service.parse_resume(extracted_text)
        
        # Save to database
        resume = ResumeFile(
            user_id=user_id,
            file_url=file_url,
            filename=file.filename,
            extracted_text=extracted_text
        )
        db.add(resume)
        await db.commit()
        
        return {
            "resume_id": str(resume.id),
            "file_url": file_url,
            "extracted_text": extracted_text,
            "parsed_skills": parsed.get("skills", []),
        }

resume_service = ResumeService()
```

### Step 3: Upload Endpoints

```python
@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and parse resume."""
    return await resume_service.upload_resume(file, current_user.id, db)

@router.get("/resume")
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's resumes."""
    result = await db.execute(
        select(ResumeFile).where(ResumeFile.user_id == current_user.id)
    )
    return result.scalars().all()

@router.delete("/resume/{resume_id}")
async def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a resume."""
    resume = await db.get(ResumeFile, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise NotFoundError()
    
    await s3_service.delete_file(resume.file_url)
    await db.delete(resume)
    await db.commit()
    return {"deleted": True}
```

### Step 4: Admin Panel

**Create** `/backend/app/api/v1/routers/admin.py`:

```python
from app.core.dependencies import require_admin

@router.post("/questions/bulk-import")
async def bulk_import_questions(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Bulk import questions from CSV."""
    # Parse CSV and insert questions
    # Expected format: subject_name, type, difficulty, question_text, correct_answer, options, tags
    pass

@router.get("/analytics")
async def get_platform_analytics(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide analytics."""
    result = await db.execute(
        select(
            func.count(User.id).label("total_users"),
            func.count(QuizAttempt.id).label("total_quizzes"),
            func.avg(QuizAttempt.score_pct).label("avg_score"),
            func.count(InterviewSession.id).label("total_interviews"),
        )
    )
    return result.one()
```

---

## Testing & Validation

### Complete Flow Test

```bash
# 1. Register and login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -r '.tokens.access_token')

# 2. Start quiz
QUIZ_ID=$(curl -X POST http://localhost:8000/api/v1/quiz/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}' | jq -r '.quiz_id')

# 3. Submit answer
curl -X POST http://localhost:8000/api/v1/quiz/$QUIZ_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}'

# 4. Get feedback
curl -X POST http://localhost:8000/api/v1/quiz/$QUIZ_ID/feedback \
  -H "Authorization: Bearer $TOKEN"

# 5. Start interview
SESSION_ID=$(curl -X POST http://localhost:8000/api/v1/interview/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}' | jq -r '.session_id')

# 6. Submit interview answer
curl -X POST http://localhost:8000/api/v1/interview/$SESSION_ID/answer \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}'

# 7. Get dashboard
curl -X GET http://localhost:8000/api/v1/progress/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## Production Deployment Checklist

- [ ] All endpoints tested locally
- [ ] Database migrations run on production
- [ ] Environment variables configured (API keys, secrets)
- [ ] CORS headers configured for production domain
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Database backups scheduled
- [ ] Frontend built and deployed
- [ ] Backend deployed to Render/Railway
- [ ] SSL certificates configured
- [ ] CDN configured for static assets
- [ ] Monitoring and alerts set up

---

## Summary

All 7 phases are now thoroughly documented with code examples and step-by-step instructions. The architecture is in place, services are scaffolded, and implementation is straightforward following this guide.

**Estimated total development time**: 2-3 weeks with focused effort on each phase.

from fastapi import APIRouter

from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.subjects import router as subjects_router
from app.api.v1.routers.quiz import router as quiz_router
from app.api.v1.routers.ai_chat import router as ai_chat_router
from app.api.v1.routers.progress import router as progress_router
from app.api.v1.routers.interview import router as interview_router
from app.api.v1.routers.coding import router as coding_router
from app.api.v1.routers.resume import router as resume_router
from app.api.v1.routers.admin import router as admin_router
from app.api.v1.routers.leaderboard import router as leaderboard_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(subjects_router)
api_router.include_router(quiz_router)
api_router.include_router(ai_chat_router)
api_router.include_router(progress_router)
api_router.include_router(interview_router)
api_router.include_router(coding_router)
api_router.include_router(resume_router)
api_router.include_router(admin_router)
api_router.include_router(leaderboard_router)

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.quiz import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewRespondRequest,
    InterviewRespondResponse,
    InterviewReport,
)
from app.services.interview_service import interview_service

router = APIRouter(prefix="/interview", tags=["Mock Interview"])


@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(
    payload: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new AI-driven interview session.
    Generates questions based on subject, difficulty, type, and optional company/resume.
    Returns the first question immediately.
    """
    return await interview_service.start_session(payload, current_user, db)


@router.post("/respond", response_model=InterviewRespondResponse)
async def respond_to_interview(
    payload: InterviewRespondRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit an answer to the current interview question.
    Returns AI evaluation scores and the next question (or completion flag).
    """
    return await interview_service.respond(payload, current_user, db)


@router.get("/{session_id}/report", response_model=InterviewReport)
async def get_interview_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the full post-interview report with:
    overall score, per-question breakdown, AI feedback, and improvement areas.
    """
    return await interview_service.get_report(session_id, current_user, db)

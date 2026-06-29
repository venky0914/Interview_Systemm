from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.quiz import (
    QuizStartRequest,
    QuizStartResponse,
    SubmitAnswerRequest,
    QuizResult,
)
from app.services.quiz_service import quiz_service

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.post("/start", response_model=QuizStartResponse)
async def start_quiz(
    payload: QuizStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new quiz session and return shuffled questions."""
    return await quiz_service.start_quiz(payload, current_user, db)


@router.post("/complete/{attempt_id}", response_model=QuizResult)
async def complete_quiz(
    attempt_id: str,
    answers: list[SubmitAnswerRequest],
    time_taken_sec: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit all answers and receive scored results with AI feedback."""
    return await quiz_service.complete_quiz(
        attempt_id, answers, time_taken_sec, current_user, db
    )

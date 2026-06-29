from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.progress import Progress, QuizAttempt
from app.schemas.quiz import ProgressDashboard

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("/dashboard", response_model=ProgressDashboard)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the full progress dashboard for the current user."""
    # Overall progress record
    prog_result = await db.execute(
        select(Progress).where(
            Progress.user_id == current_user.id,
            Progress.subject_id.is_(None),
        )
    )
    progress = prog_result.scalar_one_or_none()

    # Recent quizzes (last 10)
    recent_result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(10)
    )
    recent_quizzes = [
        {
            "id": str(q.id),
            "score": q.score_pct,
            "mode": q.mode,
            "difficulty": q.difficulty,
            "date": q.completed_at.isoformat(),
        }
        for q in recent_result.scalars()
    ]

    # Activity heatmap — last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    heatmap_result = await db.execute(
        select(
            func.date(QuizAttempt.completed_at).label("date"),
            func.count().label("count"),
        )
        .where(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.completed_at >= thirty_days_ago,
        )
        .group_by(func.date(QuizAttempt.completed_at))
    )
    heatmap = [
        {"date": str(row.date), "count": row.count}
        for row in heatmap_result
    ]

    if not progress:
        return ProgressDashboard(
            current_streak=0,
            longest_streak=0,
            total_quiz_count=0,
            avg_score_pct=0.0,
            coding_accuracy=0.0,
            completion_by_subject=[],
            recent_quizzes=recent_quizzes,
            weak_topics=[],
            strong_topics=[],
            activity_heatmap=heatmap,
        )

    return ProgressDashboard(
        current_streak=progress.current_streak,
        longest_streak=progress.longest_streak,
        total_quiz_count=progress.total_quiz_count,
        avg_score_pct=progress.avg_score_pct,
        coding_accuracy=progress.coding_accuracy,
        completion_by_subject=[],  # populated in Phase 3 analytics
        recent_quizzes=recent_quizzes,
        weak_topics=[],
        strong_topics=[],
        activity_heatmap=heatmap,
    )

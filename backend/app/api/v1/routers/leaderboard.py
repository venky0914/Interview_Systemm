from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.progress import Progress, QuizAttempt

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("")
async def get_leaderboard(
    period: str = Query("all"),          # all | week | month
    subject: str = Query(""),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return ranked users by average quiz score.
    Supports filtering by time period and subject.
    """
    from datetime import datetime, timedelta, timezone

    # Build base query — join users with their progress
    query = (
        select(
            User.id,
            User.full_name,
            User.avatar_url,
            func.avg(QuizAttempt.score_pct).label("avg_score"),
            func.count(QuizAttempt.id).label("total_quizzes"),
        )
        .join(QuizAttempt, QuizAttempt.user_id == User.id)
        .where(User.is_active == True)
        .group_by(User.id, User.full_name, User.avatar_url)
        .having(func.count(QuizAttempt.id) >= 3)  # min 3 quizzes to rank
        .order_by(desc("avg_score"))
        .limit(limit)
    )

    # Period filter
    if period == "week":
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        query = query.where(QuizAttempt.completed_at >= cutoff)
    elif period == "month":
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        query = query.where(QuizAttempt.completed_at >= cutoff)

    result = await db.execute(query)
    rows = result.all()

    # Build ranked entries
    entries = []
    my_rank = None
    for i, row in enumerate(rows):
        rank = i + 1
        if str(row.id) == str(current_user.id):
            my_rank = rank
        entries.append({
            "rank": rank,
            "user_id": str(row.id),
            "full_name": row.full_name,
            "avatar_url": row.avatar_url,
            "avg_score": round(float(row.avg_score or 0), 1),
            "total_quizzes": row.total_quizzes,
            "current_streak": 0,  # fetched separately in Phase 5
            "badge": _get_badge(rank, float(row.avg_score or 0)),
        })

    return {"entries": entries, "my_rank": my_rank, "total": len(entries)}


def _get_badge(rank: int, score: float) -> str | None:
    if rank == 1:
        return "🔥 Top Scorer"
    if rank == 2:
        return "⚡ Runner Up"
    if rank == 3:
        return "🎯 Third Place"
    if score >= 90:
        return "💎 Expert"
    if score >= 80:
        return "⭐ Advanced"
    return None

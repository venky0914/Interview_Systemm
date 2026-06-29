import random
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.exceptions import NotFoundError, AppException
from app.models.subject import Question
from app.models.progress import QuizAttempt, QuizAttemptAnswer, Progress
from app.models.user import User
from app.schemas.quiz import (
    QuizStartRequest,
    QuizStartResponse,
    SubmitAnswerRequest,
    QuizResult,
    TopicAnalysis,
)
from app.ai.gemini_client import gemini_client


class QuizService:
    async def start_quiz(
        self, payload: QuizStartRequest, user: User, db: AsyncSession
    ) -> QuizStartResponse:
        # Build query with filters
        query = select(Question).where(
            Question.subject_id.in_(payload.subject_ids)
        )

        if payload.type != "mixed":
            query = query.where(Question.type == payload.type)

        if payload.difficulty != "mixed":
            query = query.where(Question.difficulty == payload.difficulty)

        result = await db.execute(query)
        questions = result.scalars().all()

        if not questions:
            raise AppException(status_code=404, detail="No questions found for this configuration", code="NO_QUESTIONS")

        # Shuffle and limit
        question_list = list(questions)
        if payload.shuffle_questions:
            random.shuffle(question_list)
        question_list = question_list[: payload.question_count]

        # Build serialized question dicts (shuffle options if needed)
        serialized = []
        for q in question_list:
            options = q.options if isinstance(q.options, list) else []
            if payload.shuffle_options and options:
                random.shuffle(options)
            serialized.append({
                "id": str(q.id),
                "question_text": q.question_text,
                "type": q.type,
                "difficulty": q.difficulty,
                "options": options,
                "tags": q.tags or [],
            })

        # Create attempt record
        attempt = QuizAttempt(
            user_id=user.id,
            subject_id=payload.subject_ids[0] if len(payload.subject_ids) == 1 else None,
            mode=payload.type,
            difficulty=payload.difficulty,
            total_questions=len(question_list),
        )
        db.add(attempt)
        await db.flush()

        return QuizStartResponse(
            attempt_id=str(attempt.id),
            questions=serialized,
            total=len(question_list),
            timer_seconds=payload.timer_minutes * 60,
        )

    async def complete_quiz(
        self,
        attempt_id: str,
        answers: list[SubmitAnswerRequest],
        time_taken_sec: int,
        user: User,
        db: AsyncSession,
    ) -> QuizResult:
        # Fetch attempt
        result = await db.execute(
            select(QuizAttempt).where(
                QuizAttempt.id == attempt_id,
                QuizAttempt.user_id == user.id,
            )
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            raise NotFoundError("Quiz attempt")

        # Fetch all answered questions in one query
        q_ids = [a.question_id for a in answers]
        q_result = await db.execute(select(Question).where(Question.id.in_(q_ids)))
        questions_map = {str(q.id): q for q in q_result.scalars()}

        correct = wrong = skipped = 0
        topic_stats: dict[str, dict] = {}
        answer_records = []

        for ans in answers:
            question = questions_map.get(ans.question_id)
            if not question:
                continue

            is_correct = False
            if ans.is_skipped:
                skipped += 1
            else:
                is_correct = (
                    ans.user_answer is not None
                    and ans.user_answer.strip().lower()
                    == question.correct_answer.strip().lower()
                )
                if is_correct:
                    correct += 1
                else:
                    wrong += 1

            # Track per-topic stats
            for tag in (question.tags or ["General"]):
                if tag not in topic_stats:
                    topic_stats[tag] = {"total": 0, "correct": 0}
                topic_stats[tag]["total"] += 1
                if is_correct:
                    topic_stats[tag]["correct"] += 1

            answer_records.append(
                QuizAttemptAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    user_answer=ans.user_answer,
                    is_correct=is_correct,
                    is_skipped=ans.is_skipped,
                    time_spent_sec=ans.time_spent_sec,
                )
            )

        db.add_all(answer_records)

        total = correct + wrong + skipped
        score_pct = round((correct / total) * 100) if total > 0 else 0

        # Update attempt record
        attempt.correct_count = correct
        attempt.wrong_count = wrong
        attempt.skipped_count = skipped
        attempt.score_pct = score_pct
        attempt.time_taken_sec = time_taken_sec

        # Update progress streak
        await self._update_progress(user.id, score_pct, db)

        # Build topic analysis
        topic_analysis = [
            TopicAnalysis(
                topic=tag,
                total=stats["total"],
                correct=stats["correct"],
                accuracy=round(stats["correct"] / stats["total"] * 100, 1),
            )
            for tag, stats in topic_stats.items()
        ]

        weak = [t.topic for t in topic_analysis if t.accuracy < 50]
        strong = [t.topic for t in topic_analysis if t.accuracy >= 80]
        recommended = weak[:3]

        # Async AI feedback
        ai_feedback = await gemini_client.generate_quiz_feedback(
            score=score_pct,
            weak_topics=weak,
            strong_topics=strong,
        )

        attempt.ai_feedback = {"text": ai_feedback}

        return QuizResult(
            attempt_id=str(attempt.id),
            score=score_pct,
            accuracy=round(correct / total * 100, 1) if total > 0 else 0,
            correct_count=correct,
            wrong_count=wrong,
            skipped_count=skipped,
            time_taken_sec=time_taken_sec,
            topic_analysis=topic_analysis,
            weak_topics=weak,
            strong_topics=strong,
            recommended_topics=recommended,
            ai_feedback=ai_feedback,
            leaderboard_rank=None,  # Phase 3 feature
        )

    async def _update_progress(
        self, user_id, score_pct: int, db: AsyncSession
    ) -> None:
        """Increment quiz count and recalculate average score in Progress table."""
        result = await db.execute(
            select(Progress).where(
                Progress.user_id == user_id,
                Progress.subject_id.is_(None),
            )
        )
        progress = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if not progress:
            progress = Progress(
                user_id=user_id,
                total_quiz_count=1,
                avg_score_pct=float(score_pct),
                current_streak=1,
                longest_streak=1,
                last_activity=now,
            )
            db.add(progress)
        else:
            # Streak: increment if last activity was yesterday, reset if older
            if progress.last_activity:
                days_diff = (now.date() - progress.last_activity.date()).days
                if days_diff == 1:
                    progress.current_streak += 1
                    progress.longest_streak = max(progress.longest_streak, progress.current_streak)
                elif days_diff > 1:
                    progress.current_streak = 1
            # Rolling average
            n = progress.total_quiz_count
            progress.avg_score_pct = round(
                (progress.avg_score_pct * n + score_pct) / (n + 1), 1
            )
            progress.total_quiz_count += 1
            progress.last_activity = now


quiz_service = QuizService()

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import NotFoundError, AppException
from app.models.subject import Subject
from app.models.progress import InterviewSession, InterviewResponse, ResumeFile
from app.models.user import User
from app.schemas.quiz import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewRespondRequest,
    InterviewRespondResponse,
    InterviewReport,
)
from app.ai.gemini_client import gemini_client


class InterviewService:

    async def start_session(
        self,
        payload: InterviewStartRequest,
        user: User,
        db: AsyncSession,
    ) -> InterviewStartResponse:
        """Create a new interview session and return the first AI question."""

        # Resolve subject name for AI prompt
        subject_name = "General"
        if payload.subject_id:
            result = await db.execute(
                select(Subject).where(Subject.id == payload.subject_id)
            )
            subj = result.scalar_one_or_none()
            if subj:
                subject_name = subj.name

        # Fetch resume text if provided
        resume_context = None
        if payload.resume_id:
            result = await db.execute(
                select(ResumeFile).where(
                    ResumeFile.id == payload.resume_id,
                    ResumeFile.user_id == user.id,
                )
            )
            resume = result.scalar_one_or_none()
            if resume:
                resume_context = resume.extracted_text

        # Generate all questions upfront and store as JSON
        questions = await gemini_client.generate_interview_questions(
            subject=subject_name,
            difficulty=payload.difficulty,
            interview_type=payload.interview_type,
            company=payload.company,
            count=8,
            resume_context=resume_context,
        )

        if not questions:
            raise AppException(
                status_code=500,
                detail="Failed to generate interview questions",
                code="AI_ERROR",
            )

        # Create session record; store questions in ai_feedback field temporarily
        session = InterviewSession(
            user_id=user.id,
            subject_id=payload.subject_id,
            resume_id=payload.resume_id,
            interview_type=payload.interview_type,
            difficulty=payload.difficulty,
            company=payload.company,
            ai_feedback={"questions": questions},  # prefetched questions cache
        )
        db.add(session)
        await db.flush()

        return InterviewStartResponse(
            session_id=str(session.id),
            first_question=questions[0],
            total_questions=len(questions),
        )

    async def respond(
        self,
        payload: InterviewRespondRequest,
        user: User,
        db: AsyncSession,
    ) -> InterviewRespondResponse:
        """Evaluate user's answer and return next question or completion flag."""

        result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == payload.session_id,
                InterviewSession.user_id == user.id,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise NotFoundError("Interview session")

        # Retrieve pre-generated questions
        questions: list[str] = (session.ai_feedback or {}).get("questions", [])
        total = len(questions)

        # Resolve subject name
        subject_name = "General"
        if session.subject_id:
            subj_result = await db.execute(
                select(Subject).where(Subject.id == session.subject_id)
            )
            subj = subj_result.scalar_one_or_none()
            if subj:
                subject_name = subj.name

        current_question = questions[payload.question_index] if payload.question_index < total else ""

        # Evaluate the answer
        evaluation = await gemini_client.evaluate_interview_answer(
            question=current_question,
            answer=payload.answer,
            subject=subject_name,
            difficulty=session.difficulty,
        )

        # Persist response
        response_record = InterviewResponse(
            session_id=session.id,
            question_index=payload.question_index,
            ai_question=current_question,
            user_answer=payload.answer,
            technical_score=evaluation["technical_score"],
            communication_score=evaluation["communication_score"],
            improvement_tip=evaluation["improvement_tip"],
        )
        db.add(response_record)

        next_index = payload.question_index + 1
        is_complete = next_index >= total

        if is_complete:
            session.ended_at = datetime.now(timezone.utc)

        return InterviewRespondResponse(
            next_question=questions[next_index] if not is_complete else None,
            is_complete=is_complete,
            technical_score=evaluation["technical_score"],
            communication_score=evaluation["communication_score"],
            improvement_tip=evaluation["improvement_tip"],
        )

    async def get_report(
        self, session_id: str, user: User, db: AsyncSession
    ) -> InterviewReport:
        """Build the full post-interview report with averaged scores and AI feedback."""

        result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == session_id,
                InterviewSession.user_id == user.id,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise NotFoundError("Interview session")

        responses_result = await db.execute(
            select(InterviewResponse)
            .where(InterviewResponse.session_id == session.id)
            .order_by(InterviewResponse.question_index)
        )
        responses = responses_result.scalars().all()

        if not responses:
            raise AppException(
                status_code=400,
                detail="No responses found for this session",
                code="NO_RESPONSES",
            )

        tech_scores = [r.technical_score for r in responses if r.technical_score is not None]
        comm_scores = [r.communication_score for r in responses if r.communication_score is not None]

        avg_tech = round(sum(tech_scores) / len(tech_scores), 1) if tech_scores else 0
        avg_comm = round(sum(comm_scores) / len(comm_scores), 1) if comm_scores else 0
        overall = round((avg_tech + avg_comm) / 2 * 10)  # scale to 0-100

        # Resolve subject name
        subject_name = "General"
        if session.subject_id:
            subj_result = await db.execute(
                select(Subject).where(Subject.id == session.subject_id)
            )
            subj = subj_result.scalar_one_or_none()
            if subj:
                subject_name = subj.name

        # Generate overall AI report
        ai_feedback = await gemini_client.generate_interview_report(
            subject=subject_name,
            responses=[
                {
                    "question": r.ai_question,
                    "answer": r.user_answer,
                    "technical": r.technical_score,
                    "communication": r.communication_score,
                }
                for r in responses
            ],
            avg_technical=avg_tech,
            avg_communication=avg_comm,
        )

        # Identify strong/weak areas from scores
        strong = [r.ai_question[:40] + "…" for r in responses if (r.technical_score or 0) >= 8]
        weak = [r.ai_question[:40] + "…" for r in responses if (r.technical_score or 0) < 5]

        # Persist overall score on session
        session.overall_score = overall
        session.ai_feedback = {
            **(session.ai_feedback or {}),
            "report": ai_feedback,
            "avg_technical": avg_tech,
            "avg_communication": avg_comm,
        }

        return InterviewReport(
            session_id=str(session.id),
            overall_score=overall,
            technical_avg=avg_tech,
            communication_avg=avg_comm,
            confidence_score=avg_comm,  # proxy for now
            responses=[
                {
                    "question": r.ai_question,
                    "answer": r.user_answer,
                    "technical_score": r.technical_score,
                    "communication_score": r.communication_score,
                    "tip": r.improvement_tip,
                }
                for r in responses
            ],
            ai_feedback=ai_feedback,
            strong_areas=strong[:3],
            improvement_areas=weak[:3],
        )


interview_service = InterviewService()

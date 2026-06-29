from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.subject import Subject, Note, Question, CodingProblem
from app.models.progress import QuizAttempt
from app.schemas.subject import NoteCreate, QuestionCreate
from app.services.s3_service import s3_service
from app.services.ocr_service import ocr_service
from app.ai.rag_pipeline import rag_pipeline

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/notes/upload", status_code=201)
async def upload_note(
    subject_slug: str = Form(...),
    title: str = Form(...),
    topic: str = Form(...),
    content: str = Form(""),       # optional if uploading PDF
    file: UploadFile | None = File(None),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a note for a subject.
    - If a PDF/image is attached, OCR extracts the text content.
    - PDF is stored in S3 and indexed into FAISS for AI chat.
    """
    result = await db.execute(select(Subject).where(Subject.slug == subject_slug))
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    pdf_url = None
    final_content = content

    if file:
        file_bytes = await file.read()
        # Extract text via OCR if no manual content provided
        if not content.strip():
            try:
                final_content = ocr_service.extract(file_bytes, file.filename or "upload.pdf")
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

        # Reset file pointer and upload to S3
        import io
        file.file = io.BytesIO(file_bytes)
        try:
            pdf_url = await s3_service.upload_note_pdf(file, subject_slug, title)
        except RuntimeError:
            pass  # S3 upload failure is non-critical — note is still saved

    note = Note(
        subject_id=subject.id,
        title=title,
        topic=topic,
        content=final_content,
        pdf_url=pdf_url,
    )
    db.add(note)
    await db.flush()

    # Re-index all notes for this subject into FAISS
    all_notes_result = await db.execute(
        select(Note.content).where(Note.subject_id == subject.id)
    )
    all_content = [row[0] for row in all_notes_result if row[0]]
    chunk_count = await rag_pipeline.index_notes(subject_slug, all_content)

    return {
        "id": str(note.id),
        "message": f"Note created and indexed ({chunk_count} chunks).",
        "pdf_url": pdf_url,
    }


@router.post("/questions/bulk", status_code=201)
async def bulk_upload_questions(
    questions: list[QuestionCreate],
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Bulk-import questions from a list payload (up to 500 at a time)."""
    if len(questions) > 500:
        raise HTTPException(status_code=400, detail="Maximum 500 questions per request")

    records = [
        Question(
            subject_id=q.subject_id,
            type=q.type,
            difficulty=q.difficulty,
            question_text=q.question_text,
            correct_answer=q.correct_answer,
            options=q.options,
            tags=q.tags,
            is_top_question=q.is_top_question,
        )
        for q in questions
    ]
    db.add_all(records)

    return {"created": len(records), "message": f"{len(records)} questions uploaded."}


@router.get("/analytics")
async def get_analytics(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide analytics for the admin dashboard."""
    from app.models.user import User as UserModel
    from app.models.progress import InterviewSession

    total_users = (await db.execute(select(func.count(UserModel.id)))).scalar()
    total_quizzes = (await db.execute(select(func.count(QuizAttempt.id)))).scalar()
    total_interviews = (await db.execute(select(func.count(InterviewSession.id)))).scalar()
    avg_score = (await db.execute(select(func.avg(QuizAttempt.score_pct)))).scalar()
    total_subjects = (await db.execute(select(func.count(Subject.id)))).scalar()
    total_questions = (await db.execute(select(func.count(Question.id)))).scalar()

    return {
        "total_users": total_users,
        "total_quizzes": total_quizzes,
        "total_interviews": total_interviews,
        "avg_score": round(float(avg_score or 0), 1),
        "total_subjects": total_subjects,
        "total_questions": total_questions,
    }


@router.post("/subjects", status_code=201)
async def create_subject(
    name: str = Form(...),
    slug: str = Form(...),
    emoji: str = Form("📚"),
    description: str = Form(""),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new subject."""
    existing = await db.execute(select(Subject).where(Subject.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Subject slug already exists")

    subject = Subject(name=name, slug=slug, emoji=emoji, description=description)
    db.add(subject)
    await db.flush()
    return {"id": str(subject.id), "slug": slug}

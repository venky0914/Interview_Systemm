from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.progress import ResumeFile
from app.services.resume_service import resume_service

router = APIRouter(prefix="/resume", tags=["Resume Interview"])


@router.post("/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a PDF resume.
    Extracts text via OCR, parses skills/projects/experience using Gemini,
    stores in S3, and returns structured data for the interview setup screen.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 10MB.")

    return await resume_service.upload_and_parse(file, current_user, db)


@router.get("/list")
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all resumes uploaded by the current user."""
    result = await db.execute(
        select(ResumeFile)
        .where(ResumeFile.user_id == current_user.id)
        .order_by(ResumeFile.uploaded_at.desc())
    )
    resumes = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "filename": r.filename,
            "file_url": r.file_url,
            "uploaded_at": r.uploaded_at.isoformat(),
        }
        for r in resumes
    ]

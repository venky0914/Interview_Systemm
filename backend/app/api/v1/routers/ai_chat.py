from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.models.subject import Subject
from app.models.user import User
from app.schemas.quiz import ChatRequest, ChatResponse
from app.ai.rag_pipeline import rag_pipeline

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    RAG-powered AI chat: answers questions strictly from uploaded notes.
    If notes don't contain the answer, returns a clear 'not in notes' message.
    """
    result = await db.execute(select(Subject).where(Subject.slug == payload.subject_slug))
    subject = result.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject")

    answer, sources, is_from_notes = await rag_pipeline.answer(
        subject_slug=payload.subject_slug,
        subject_name=subject.name,
        question=payload.message,
    )

    return ChatResponse(
        answer=answer,
        sources=sources,
        is_from_notes=is_from_notes,
    )

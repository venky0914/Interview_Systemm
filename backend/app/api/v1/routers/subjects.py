from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.models.subject import Subject, UserSubject, Question, Note, CodingProblem
from app.models.user import User
from app.schemas.subject import (
    SubjectOut,
    UserSubjectOut,
    EnrollRequest,
    QuestionOut,
    NoteOut,
    CodingProblemOut,
    CodingProblemDetail,
)

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=list[SubjectOut])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    """Return all active subjects."""
    result = await db.execute(select(Subject).where(Subject.is_active == True))
    return result.scalars().all()


@router.get("/enrolled", response_model=list[SubjectOut])
async def get_enrolled_subjects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return subjects the current user has enrolled in."""
    result = await db.execute(
        select(Subject)
        .join(UserSubject, UserSubject.subject_id == Subject.id)
        .where(UserSubject.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/enroll", status_code=204)
async def enroll(
    payload: EnrollRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enroll current user in one or more subjects."""
    # Fetch already enrolled subject IDs
    result = await db.execute(
        select(UserSubject.subject_id).where(UserSubject.user_id == current_user.id)
    )
    already_enrolled = {str(r) for r in result.scalars()}

    new_enrollments = [
        UserSubject(user_id=current_user.id, subject_id=sid)
        for sid in payload.subject_ids
        if sid not in already_enrolled
    ]
    db.add_all(new_enrollments)


@router.get("/{slug}", response_model=SubjectOut)
async def get_subject(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).where(Subject.slug == slug))
    subject = result.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject")
    return subject


@router.get("/{slug}/notes", response_model=list[NoteOut])
async def get_notes(
    slug: str,
    topic: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    subj = await db.execute(select(Subject).where(Subject.slug == slug))
    subject = subj.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject")

    query = select(Note).where(Note.subject_id == subject.id)
    if topic:
        query = query.where(Note.topic == topic)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{slug}/questions", response_model=list[QuestionOut])
async def get_questions(
    slug: str,
    type: str | None = Query(None),
    difficulty: str | None = Query(None),
    top_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    subj = await db.execute(select(Subject).where(Subject.slug == slug))
    subject = subj.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject")

    query = select(Question).where(Question.subject_id == subject.id)
    if type:
        query = query.where(Question.type == type)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
    if top_only:
        query = query.where(Question.is_top_question == True)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{slug}/coding", response_model=list[CodingProblemOut])
async def get_coding_problems(
    slug: str,
    difficulty: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    subj = await db.execute(select(Subject).where(Subject.slug == slug))
    subject = subj.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject")

    query = select(CodingProblem).where(CodingProblem.subject_id == subject.id)
    if difficulty:
        query = query.where(CodingProblem.difficulty == difficulty)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/coding/{problem_id}", response_model=CodingProblemDetail)
async def get_coding_problem_detail(
    problem_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(CodingProblem).where(CodingProblem.id == problem_id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise NotFoundError("Coding problem")
    return problem

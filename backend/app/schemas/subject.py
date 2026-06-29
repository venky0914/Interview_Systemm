from uuid import UUID
from pydantic import BaseModel


class SubjectOut(BaseModel):
    id: str
    name: str
    slug: str
    emoji: str
    description: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserSubjectOut(BaseModel):
    subject: SubjectOut
    completion_pct: int
    enrolled_at: str

    model_config = {"from_attributes": True}


class EnrollRequest(BaseModel):
    subject_ids: list[str]


class QuestionOut(BaseModel):
    id: str
    subject_id: str
    type: str
    difficulty: str
    question_text: str
    correct_answer: str
    options: list[str] | None
    tags: list[str]
    is_top_question: bool

    model_config = {"from_attributes": True}


class NoteOut(BaseModel):
    id: str
    subject_id: str
    title: str
    content: str
    pdf_url: str | None
    topic: str
    read_count: int
    updated_at: str

    model_config = {"from_attributes": True}


class CodingProblemOut(BaseModel):
    id: str
    subject_id: str
    title: str
    description: str
    difficulty: str
    starter_code: str
    language: str
    # solution_code excluded from list response — only on detail endpoint

    model_config = {"from_attributes": True}


class CodingProblemDetail(CodingProblemOut):
    solution_code: str
    expected_output: str


class NoteCreate(BaseModel):
    subject_id: str
    title: str
    content: str
    topic: str
    pdf_url: str | None = None


class QuestionCreate(BaseModel):
    subject_id: str
    type: str
    difficulty: str
    question_text: str
    correct_answer: str
    options: list[str] | None = None
    tags: list[str] = []
    is_top_question: bool = False

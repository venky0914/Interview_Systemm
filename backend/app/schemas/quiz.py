from pydantic import BaseModel


# ─── Quiz ─────────────────────────────────────────────────────────────────────

class QuizStartRequest(BaseModel):
    subject_ids: list[str]
    type: str          # theory | coding | mixed
    difficulty: str    # easy | medium | hard | mixed
    question_count: int
    timer_minutes: int
    shuffle_questions: bool = True
    shuffle_options: bool = False


class QuizStartResponse(BaseModel):
    attempt_id: str
    questions: list[dict]
    total: int
    timer_seconds: int


class SubmitAnswerRequest(BaseModel):
    question_id: str
    user_answer: str | None
    is_skipped: bool = False
    time_spent_sec: int = 0


class TopicAnalysis(BaseModel):
    topic: str
    total: int
    correct: int
    accuracy: float


class QuizResult(BaseModel):
    attempt_id: str
    score: int
    accuracy: float
    correct_count: int
    wrong_count: int
    skipped_count: int
    time_taken_sec: int
    topic_analysis: list[TopicAnalysis]
    weak_topics: list[str]
    strong_topics: list[str]
    recommended_topics: list[str]
    ai_feedback: str
    leaderboard_rank: int | None


# ─── Code Execution ───────────────────────────────────────────────────────────

class CodeRunRequest(BaseModel):
    problem_id: str
    code: str
    language: str = "python"


class CodeRunResponse(BaseModel):
    output: str
    error: str | None
    passed: bool
    execution_time_ms: int


class SqlRunRequest(BaseModel):
    problem_id: str
    query: str


class SqlRunResponse(BaseModel):
    columns: list[str]
    rows: list[list]
    passed: bool
    error: str | None


# ─── Interview ────────────────────────────────────────────────────────────────

class InterviewStartRequest(BaseModel):
    subject_id: str | None = None
    interview_type: str          # technical | hr | mixed
    difficulty: str
    company: str | None = None
    resume_id: str | None = None


class InterviewStartResponse(BaseModel):
    session_id: str
    first_question: str
    total_questions: int


class InterviewRespondRequest(BaseModel):
    session_id: str
    answer: str
    question_index: int


class InterviewRespondResponse(BaseModel):
    next_question: str | None        # None when interview ends
    is_complete: bool
    technical_score: int | None = None
    communication_score: int | None = None
    improvement_tip: str | None = None


class InterviewReport(BaseModel):
    session_id: str
    overall_score: int
    technical_avg: float
    communication_avg: float
    confidence_score: float
    responses: list[dict]
    ai_feedback: str
    strong_areas: list[str]
    improvement_areas: list[str]


# ─── Progress ─────────────────────────────────────────────────────────────────

class ProgressDashboard(BaseModel):
    current_streak: int
    longest_streak: int
    total_quiz_count: int
    avg_score_pct: float
    coding_accuracy: float
    completion_by_subject: list[dict]
    recent_quizzes: list[dict]
    weak_topics: list[str]
    strong_topics: list[str]
    activity_heatmap: list[dict]


# ─── AI Chat ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    subject_slug: str
    message: str
    conversation_history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    is_from_notes: bool

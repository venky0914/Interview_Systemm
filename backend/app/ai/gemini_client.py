from __future__ import annotations

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

_MODEL = "gemini-1.5-flash"  # Fast model; upgrade to gemini-1.5-pro for higher quality


class GeminiClient:
    """Thin wrapper around the Gemini SDK with retry logic and prompt isolation."""

    def __init__(self) -> None:
        self._model = genai.GenerativeModel(_MODEL)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=8))
    async def _call(self, prompt: str, max_tokens: int = 512) -> str:
        response = await self._model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.7,
            ),
        )
        return response.text.strip()

    # ─── Quiz Feedback ────────────────────────────────────────────────────────

    async def generate_quiz_feedback(
        self,
        score: int,
        weak_topics: list[str],
        strong_topics: list[str],
    ) -> str:
        weak_str = ", ".join(weak_topics) if weak_topics else "none identified"
        strong_str = ", ".join(strong_topics) if strong_topics else "none identified"

        prompt = f"""You are an expert interview coach. A student just completed a quiz.

Score: {score}%
Strong topics: {strong_str}
Weak topics: {weak_str}

Give concise, encouraging, and actionable feedback in 3–4 sentences.
- Acknowledge what they did well.
- Point to specific weak areas to improve.
- Suggest one concrete next step.
Keep the tone positive and motivating. No bullet points, just flowing text."""

        return await self._call(prompt, max_tokens=256)

    # ─── Interview Question Generation ───────────────────────────────────────

    async def generate_interview_questions(
        self,
        subject: str,
        difficulty: str,
        interview_type: str,
        company: str | None,
        count: int = 8,
        resume_context: str | None = None,
    ) -> list[str]:
        company_str = f"for a {company} interview" if company else ""
        resume_str = f"\nResume context: {resume_context[:800]}" if resume_context else ""

        prompt = f"""Generate {count} {difficulty} {interview_type} interview questions 
about {subject} {company_str}.{resume_str}

Rules:
- Questions must be specific, clear, and professional.
- For technical: include conceptual and practical questions.
- For HR: focus on behavior, teamwork, conflict resolution.
- No numbering, no bullets. Return exactly {count} questions separated by '|||'.
"""
        response = await self._call(prompt, max_tokens=1024)
        questions = [q.strip() for q in response.split("|||") if q.strip()]
        return questions[:count]

    # ─── Interview Answer Evaluation ──────────────────────────────────────────

    async def evaluate_interview_answer(
        self,
        question: str,
        answer: str,
        subject: str,
        difficulty: str,
    ) -> dict:
        prompt = f"""You are a strict but fair technical interviewer evaluating a candidate's answer.

Subject: {subject}
Difficulty: {difficulty}
Question: {question}
Candidate Answer: {answer}

Evaluate on these axes (score 0-10 each):
1. Technical Accuracy — Is the answer factually correct and complete?
2. Communication — Is it clear, structured, and easy to understand?

Also provide one specific improvement tip (1–2 sentences max).

Respond ONLY in this exact format (no extra text):
TECHNICAL: <score>
COMMUNICATION: <score>
TIP: <improvement tip>"""

        response = await self._call(prompt, max_tokens=200)
        lines = {line.split(":")[0].strip(): ":".join(line.split(":")[1:]).strip()
                 for line in response.splitlines() if ":" in line}

        def safe_int(val: str, default: int = 5) -> int:
            try:
                return max(0, min(10, int(val.strip())))
            except (ValueError, AttributeError):
                return default

        return {
            "technical_score": safe_int(lines.get("TECHNICAL", "5")),
            "communication_score": safe_int(lines.get("COMMUNICATION", "5")),
            "improvement_tip": lines.get("TIP", "Keep practicing to improve clarity and depth."),
        }

    # ─── Interview Final Report ───────────────────────────────────────────────

    async def generate_interview_report(
        self,
        subject: str,
        responses: list[dict],
        avg_technical: float,
        avg_communication: float,
    ) -> str:
        prompt = f"""You are an expert interview coach writing a post-interview report.

Subject: {subject}
Average Technical Score: {avg_technical}/10
Average Communication Score: {avg_communication}/10
Number of questions answered: {len(responses)}

Write a professional 4–5 sentence interview debrief. Cover:
1. Overall performance summary.
2. Key technical strengths demonstrated.
3. Communication style observed.
4. Top priority area to improve before the next interview.
Keep the tone constructive and professional."""

        return await self._call(prompt, max_tokens=300)

    # ─── RAG Chat (fallback when FAISS has no result) ────────────────────────

    async def answer_from_context(
        self, question: str, context: str, subject: str
    ) -> str:
        prompt = f"""You are an expert study assistant for {subject}.
Use ONLY the following notes to answer the student's question.
If the answer is not in the notes, say exactly: "This topic is not covered in your uploaded notes."

Notes:
{context[:3000]}

Student Question: {question}

Answer concisely and clearly using only the provided notes."""

        return await self._call(prompt, max_tokens=512)


gemini_client = GeminiClient()

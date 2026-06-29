"""
Resume Service

Pipeline:
  1. PDF uploaded → S3 stored
  2. Text extracted via OCR
  3. Gemini parses skills, projects, experience from raw text
  4. ResumeFile record created for later interview use
"""

import json
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import ResumeFile
from app.models.user import User
from app.services.s3_service import s3_service
from app.services.ocr_service import ocr_service
from app.ai.gemini_client import gemini_client


class ResumeService:
    async def upload_and_parse(
        self,
        file: UploadFile,
        user: User,
        db: AsyncSession,
    ) -> dict:
        """Upload resume to S3, extract text, parse structured data with Gemini."""

        file_bytes = await file.read()

        # Step 1: Extract text
        extracted_text = ""
        try:
            extracted_text = ocr_service.extract(file_bytes, file.filename or "resume.pdf")
        except Exception:
            pass  # Use empty string if OCR fails — Gemini may still help

        # Step 2: Parse structure using Gemini
        parsed = await self._parse_resume_with_ai(extracted_text, file.filename or "")

        # Step 3: Upload to S3
        import io
        file.file = io.BytesIO(file_bytes)
        file_url = ""
        try:
            file_url = await s3_service.upload_resume(file, str(user.id))
        except Exception:
            pass

        # Step 4: Persist record
        resume = ResumeFile(
            user_id=user.id,
            file_url=file_url,
            filename=file.filename or "resume.pdf",
            extracted_text=extracted_text,
        )
        db.add(resume)
        await db.flush()

        return {
            "id": str(resume.id),
            "filename": resume.filename,
            "skills": parsed.get("skills", []),
            "projects": parsed.get("projects", []),
            "experience": parsed.get("experience", []),
            "extracted_text": extracted_text[:500],  # preview only
        }

    async def _parse_resume_with_ai(self, text: str, filename: str) -> dict:
        """Use Gemini to extract structured data from resume text."""
        if not text.strip():
            return {"skills": [], "projects": [], "experience": []}

        prompt = f"""Extract structured information from this resume text.

Resume text:
{text[:3000]}

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{{
  "skills": ["skill1", "skill2", ...],
  "projects": ["Project Name 1", "Project Name 2", ...],
  "experience": ["Role at Company (Year)", ...]
}}

Rules:
- skills: list of technical skills, tools, languages (max 20)
- projects: list of project names or brief titles (max 10)
- experience: list of job roles with company and year (max 5)
- If a section is empty, return an empty list []
"""
        try:
            response = await gemini_client._call(prompt, max_tokens=512)
            # Strip any accidental markdown fences
            clean = response.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(clean)
        except Exception:
            return {"skills": [], "projects": [], "experience": []}


resume_service = ResumeService()

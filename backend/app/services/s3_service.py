"""
AWS S3 Service — handles file uploads for notes PDFs and resumes.
All files are stored with structured key prefixes for easy management.
"""

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.core.config import settings

_s3 = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)

_BUCKET = settings.AWS_S3_BUCKET
_CDN_BASE = f"https://{_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com"


class S3Service:
    async def upload_note_pdf(
        self, file: UploadFile, subject_slug: str, note_id: str
    ) -> str:
        """Upload a note PDF and return its public URL."""
        key = f"notes/{subject_slug}/{note_id}.pdf"
        return await self._upload(file, key, content_type="application/pdf")

    async def upload_resume(self, file: UploadFile, user_id: str) -> str:
        """Upload a resume PDF and return its public URL."""
        key = f"resumes/{user_id}/{file.filename}"
        return await self._upload(file, key, content_type="application/pdf")

    async def upload_image(
        self, file: UploadFile, subject_slug: str, filename: str
    ) -> str:
        """Upload a note image asset and return its public URL."""
        ext = filename.rsplit(".", 1)[-1].lower()
        content_type = f"image/{ext}" if ext in {"png", "jpg", "jpeg", "gif", "webp"} else "application/octet-stream"
        key = f"images/{subject_slug}/{filename}"
        return await self._upload(file, key, content_type=content_type)

    async def _upload(
        self, file: UploadFile, key: str, content_type: str
    ) -> str:
        """Internal helper — upload bytes to S3 and return the public URL."""
        content = await file.read()
        try:
            _s3.put_object(
                Bucket=_BUCKET,
                Key=key,
                Body=content,
                ContentType=content_type,
                ACL="public-read",
            )
            return f"{_CDN_BASE}/{key}"
        except ClientError as e:
            raise RuntimeError(f"S3 upload failed: {e}") from e

    def delete(self, key: str) -> None:
        """Delete a file by its S3 key."""
        try:
            _s3.delete_object(Bucket=_BUCKET, Key=key)
        except ClientError:
            pass  # Best-effort deletion


s3_service = S3Service()

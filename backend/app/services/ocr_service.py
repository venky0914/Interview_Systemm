"""
OCR Service — extracts text from uploaded handwritten notes (images/PDFs).

Pipeline:
  1. PDF → per-page images (pdf2image)
  2. Images → text (pytesseract)
  3. Text → FAISS index (via RAG pipeline)

For production: swap Tesseract with Google Vision API or AWS Textract
for significantly better accuracy on handwritten text.
"""

import tempfile
from pathlib import Path

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

try:
    from pdf2image import convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False


def _preprocess_image(img: Image.Image) -> Image.Image:
    """Sharpen and binarize an image to improve OCR accuracy."""
    img = img.convert("L")                                 # grayscale
    img = img.filter(ImageFilter.SHARPEN)
    img = ImageEnhance.Contrast(img).enhance(2.0)         # boost contrast
    img = img.point(lambda x: 0 if x < 140 else 255)     # binarize
    return img


class OcrService:
    def extract_from_image(self, image_bytes: bytes) -> str:
        """Extract text from a single image file (PNG, JPG, etc.)."""
        import io
        img = Image.open(io.BytesIO(image_bytes))
        processed = _preprocess_image(img)
        text = pytesseract.image_to_string(
            processed,
            config="--oem 3 --psm 6",  # LSTM + uniform block of text
        )
        return text.strip()

    def extract_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text from a PDF by rendering each page as an image then OCR-ing it.
        Falls back to empty string if pdf2image is not installed.
        """
        if not PDF2IMAGE_AVAILABLE:
            return ""

        pages = convert_from_bytes(pdf_bytes, dpi=300)
        all_text: list[str] = []
        for page_img in pages:
            processed = _preprocess_image(page_img)
            text = pytesseract.image_to_string(processed, config="--oem 3 --psm 6")
            if text.strip():
                all_text.append(text.strip())

        return "\n\n---\n\n".join(all_text)

    def extract(self, file_bytes: bytes, filename: str) -> str:
        """Auto-detect file type and extract text."""
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext == "pdf":
            return self.extract_from_pdf(file_bytes)
        elif ext in {"png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp"}:
            return self.extract_from_image(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: .{ext}")


ocr_service = OcrService()

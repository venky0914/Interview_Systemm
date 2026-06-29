"""
RAG Pipeline — Retrieval-Augmented Generation for the AI Chat module.

Flow:
  1. Admin uploads notes → text is chunked and embedded → stored in FAISS index per subject.
  2. Student asks a question → question is embedded → top-k chunks retrieved → fed to Gemini.
  3. If no relevant chunks found → Gemini responds with "not in notes" message.
"""

from __future__ import annotations

import os
import pickle
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import settings
from app.ai.gemini_client import gemini_client

FAISS_INDEX_DIR = Path("faiss_indexes")
FAISS_INDEX_DIR.mkdir(exist_ok=True)

_embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=settings.GEMINI_API_KEY,
)

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
    separators=["\n\n", "\n", ".", " "],
)

# In-memory cache: subject_slug → FAISS store
_index_cache: dict[str, FAISS] = {}


def _index_path(subject_slug: str) -> Path:
    return FAISS_INDEX_DIR / subject_slug


def _load_index(subject_slug: str) -> FAISS | None:
    path = _index_path(subject_slug)
    if not path.exists():
        return None
    if subject_slug in _index_cache:
        return _index_cache[subject_slug]
    try:
        store = FAISS.load_local(
            str(path),
            _embeddings,
            allow_dangerous_deserialization=True,
        )
        _index_cache[subject_slug] = store
        return store
    except Exception:
        return None


def _save_index(subject_slug: str, store: FAISS) -> None:
    path = _index_path(subject_slug)
    store.save_local(str(path))
    _index_cache[subject_slug] = store


class RAGPipeline:
    async def index_notes(self, subject_slug: str, notes: list[str]) -> int:
        """Chunk and embed all notes for a subject. Returns chunk count."""
        full_text = "\n\n".join(notes)
        chunks = _splitter.split_text(full_text)

        if not chunks:
            return 0

        # Build or update FAISS index
        existing = _load_index(subject_slug)
        if existing:
            existing.add_texts(chunks)
            _save_index(subject_slug, existing)
        else:
            store = await FAISS.afrom_texts(chunks, _embeddings)
            _save_index(subject_slug, store)

        return len(chunks)

    async def query(
        self, subject_slug: str, question: str, top_k: int = 4
    ) -> tuple[str, list[str]]:
        """
        Retrieve top-k relevant chunks and build a context string.

        Returns:
            (context_text, list_of_source_chunks)
        """
        store = _load_index(subject_slug)
        if not store:
            return "", []

        docs = await store.asimilarity_search(question, k=top_k)
        if not docs:
            return "", []

        sources = [doc.page_content for doc in docs]
        context = "\n\n---\n\n".join(sources)
        return context, sources

    async def answer(
        self, subject_slug: str, subject_name: str, question: str
    ) -> tuple[str, list[str], bool]:
        """
        Full RAG answer flow.

        Returns:
            (answer_text, source_chunks, is_from_notes)
        """
        context, sources = await self.query(subject_slug, question)

        if not context:
            return (
                "This topic is not covered in your uploaded notes.",
                [],
                False,
            )

        answer = await gemini_client.answer_from_context(question, context, subject_name)
        is_from_notes = "not covered" not in answer.lower()
        return answer, sources, is_from_notes


rag_pipeline = RAGPipeline()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import create_tables, AsyncSessionLocal
from app.core.exceptions import register_exception_handlers
from app.middleware.logging import logging_middleware
from app.api.v1 import api_router


async def _seed_subjects():
    """Seed default subjects on first run if table is empty."""
    from app.models.subject import Subject
    from sqlalchemy import select

    DEFAULTS = [
        ("Python", "python", "🐍", "Master Python for data science and engineering interviews"),
        ("SQL", "sql", "💾", "SQL queries, optimization, and database design"),
        ("Excel", "excel", "📊", "Excel formulas, pivot tables, and data analysis"),
        ("Power BI", "power-bi", "📈", "Power BI dashboards and DAX formulas"),
        ("Statistics", "statistics", "📉", "Probability, distributions, and statistical testing"),
        ("Machine Learning", "machine-learning", "🤖", "ML algorithms, model evaluation, and feature engineering"),
        ("Deep Learning", "deep-learning", "🧠", "Neural networks, CNNs, RNNs, and transformers"),
        ("NLP", "nlp", "💬", "Text processing, embeddings, and language models"),
        ("Cloud", "cloud", "☁️", "AWS, GCP, Azure fundamentals and architecture"),
        ("Linux", "linux", "🐧", "Shell scripting, commands, and system administration"),
        ("HR Interview", "hr-interview", "💼", "Behavioral, STAR method, and soft skills"),
        ("Aptitude", "aptitude", "📝", "Quantitative aptitude, logical reasoning, and verbal ability"),
    ]

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Subject).limit(1))
        if result.scalar_one_or_none():
            return  # Already seeded

        for name, slug, emoji, desc in DEFAULTS:
            session.add(Subject(name=name, slug=slug, emoji=emoji, description=desc))
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DEBUG:
        await create_tables()
        await _seed_subjects()
    yield


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered Interview Preparation Platform API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ─── Middleware stack ──────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(logging_middleware)

# ─── Exception handlers ────────────────────────────────────────────────────────
register_exception_handlers(app)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}

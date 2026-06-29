from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.quiz import CodeRunRequest, CodeRunResponse, SqlRunRequest, SqlRunResponse
from app.services.code_execution_service import code_execution_service

router = APIRouter(prefix="/coding", tags=["Coding Practice"])


@router.post("/run", response_model=CodeRunResponse)
async def run_code(
    payload: CodeRunRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute Python code in a sandboxed subprocess.
    Compares output against the problem's expected output.
    Timeout: 8 seconds. Dangerous imports are blocked.
    """
    return await code_execution_service.run_python(payload, db)


@router.post("/run-sql", response_model=SqlRunResponse)
async def run_sql(
    payload: SqlRunRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute a SQL query against a seeded in-memory SQLite database.
    Schema includes: employees, products, orders tables.
    """
    return await code_execution_service.run_sql(payload, db)

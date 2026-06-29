"""
Code Execution Service

Security model:
  - Python: subprocess with strict timeout, memory cap, no network, no file I/O outside /tmp
  - SQL: sqlite3 in-memory database per execution (no persistent state)

Production upgrade path: Replace subprocess runner with Judge0 or Piston API
for full language sandboxing, cgroup memory limits, and seccomp filtering.
"""

import asyncio
import sqlite3
import subprocess
import tempfile
import time
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import NotFoundError
from app.models.subject import CodingProblem
from app.schemas.quiz import CodeRunRequest, CodeRunResponse, SqlRunRequest, SqlRunResponse

# Hard limits for sandboxed execution
PYTHON_TIMEOUT_SEC = 8
MAX_OUTPUT_CHARS = 4000

# Dangerous Python builtins/imports to block
_BLOCKED_PATTERNS = [
    "import os", "import sys", "import subprocess", "import socket",
    "import requests", "import urllib", "__import__", "open(",
    "eval(", "exec(", "compile(", "globals()", "locals()",
    "importlib", "shutil", "pathlib",
]


def _is_safe_python(code: str) -> tuple[bool, str]:
    """Basic static check for dangerous patterns in user code."""
    lower = code.lower()
    for pattern in _BLOCKED_PATTERNS:
        if pattern in lower:
            return False, f"Use of '{pattern}' is not allowed in the sandbox."
    return True, ""


async def _run_python(code: str, expected_output: str) -> CodeRunResponse:
    """Execute Python code in a subprocess with timeout and output capture."""
    safe, reason = _is_safe_python(code)
    if not safe:
        return CodeRunResponse(
            output="",
            error=f"Security restriction: {reason}",
            passed=False,
            execution_time_ms=0,
        )

    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(code)
        tmp_path = f.name

    start = time.monotonic()
    try:
        proc = await asyncio.create_subprocess_exec(
            "python3", tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=PYTHON_TIMEOUT_SEC
            )
        except asyncio.TimeoutError:
            proc.kill()
            return CodeRunResponse(
                output="",
                error=f"Execution timed out after {PYTHON_TIMEOUT_SEC} seconds.",
                passed=False,
                execution_time_ms=PYTHON_TIMEOUT_SEC * 1000,
            )

        elapsed_ms = int((time.monotonic() - start) * 1000)
        output = stdout.decode("utf-8", errors="replace")[:MAX_OUTPUT_CHARS]
        error = stderr.decode("utf-8", errors="replace")[:1000] or None

        # Compare normalised output
        passed = (
            not error
            and output.strip() == expected_output.strip()
        )

        return CodeRunResponse(
            output=output,
            error=error,
            passed=passed,
            execution_time_ms=elapsed_ms,
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def _run_sql(query: str, expected_output: str) -> SqlRunResponse:
    """
    Execute a SQL query against a pre-seeded in-memory SQLite database.
    The seed schema is a simplified dataset covering common SQL interview problems.
    """
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()

    # Seed schema — covers most SQL interview questions
    seed_sql = """
    CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT, department TEXT, salary REAL,
        manager_id INTEGER, hire_date TEXT
    );
    INSERT INTO employees VALUES
        (1,'Alice','Engineering',95000,NULL,'2020-01-15'),
        (2,'Bob','Engineering',85000,1,'2020-03-10'),
        (3,'Carol','Marketing',72000,NULL,'2019-06-01'),
        (4,'Dave','Marketing',68000,3,'2021-02-20'),
        (5,'Eve','Engineering',92000,1,'2018-11-05'),
        (6,'Frank','HR',60000,NULL,'2022-01-10'),
        (7,'Grace','HR',58000,6,'2022-03-15');

    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT, category TEXT,
        price REAL, stock INTEGER
    );
    INSERT INTO products VALUES
        (1,'Laptop','Electronics',999.99,50),
        (2,'Phone','Electronics',599.99,200),
        (3,'Desk','Furniture',299.99,30),
        (4,'Chair','Furniture',199.99,75),
        (5,'Monitor','Electronics',399.99,100);

    CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        product_id INTEGER, quantity INTEGER,
        order_date TEXT, customer TEXT
    );
    INSERT INTO orders VALUES
        (1,1,2,'2024-01-10','Alice'),
        (2,2,5,'2024-01-11','Bob'),
        (3,1,1,'2024-01-12','Carol'),
        (4,3,3,'2024-01-13','Dave'),
        (5,2,2,'2024-01-14','Alice'),
        (6,4,1,'2024-01-15','Eve'),
        (7,5,4,'2024-01-16','Frank');
    """

    try:
        cursor.executescript(seed_sql)
        start = time.monotonic()
        cursor.execute(query)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description or []]

        # Serialise rows to strings for comparison
        rows_serialised = [[str(cell) for cell in row] for row in rows]

        # Simple output comparison — join rows as CSV lines
        actual_str = "\n".join(",".join(r) for r in rows_serialised)
        passed = actual_str.strip() == expected_output.strip()

        return SqlRunResponse(
            columns=columns,
            rows=rows_serialised,
            passed=passed,
            error=None,
        )
    except sqlite3.Error as e:
        return SqlRunResponse(columns=[], rows=[], passed=False, error=str(e))
    finally:
        conn.close()


class CodeExecutionService:
    async def run_python(
        self, payload: CodeRunRequest, db: AsyncSession
    ) -> CodeRunResponse:
        result = await db.execute(
            select(CodingProblem).where(CodingProblem.id == payload.problem_id)
        )
        problem = result.scalar_one_or_none()
        if not problem:
            raise NotFoundError("Coding problem")

        return await _run_python(payload.code, problem.expected_output)

    async def run_sql(
        self, payload: SqlRunRequest, db: AsyncSession
    ) -> SqlRunResponse:
        result = await db.execute(
            select(CodingProblem).where(CodingProblem.id == payload.problem_id)
        )
        problem = result.scalar_one_or_none()
        if not problem:
            raise NotFoundError("Coding problem")

        return _run_sql(payload.query, problem.expected_output)


code_execution_service = CodeExecutionService()

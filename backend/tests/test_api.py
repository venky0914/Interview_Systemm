"""
Basic tests for the InterviewForge API.
Run with: pytest tests/ -v
"""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_health_check():
    """Health endpoint should return 200 OK."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_register_and_login():
    """Register a new user and immediately log in."""
    import uuid
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Register
        reg_resp = await client.post("/api/v1/auth/register", json={
            "full_name": "Test User",
            "email": unique_email,
            "password": "TestPass123",
            "confirm_password": "TestPass123",
        })
        assert reg_resp.status_code == 201, reg_resp.text
        reg_data = reg_resp.json()
        assert "tokens" in reg_data
        assert reg_data["user"]["email"] == unique_email

        token = reg_data["tokens"]["access_token"]

        # Get /me with token
        me_resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == unique_email


@pytest.mark.asyncio
async def test_register_duplicate_email():
    """Registering with an existing email should return 409."""
    import uuid
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "full_name": "Dup User",
        "email": email,
        "password": "DupPass123",
        "confirm_password": "DupPass123",
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r1 = await client.post("/api/v1/auth/register", json=payload)
        assert r1.status_code == 201

        r2 = await client.post("/api/v1/auth/register", json=payload)
        assert r2.status_code == 409


@pytest.mark.asyncio
async def test_subjects_list():
    """Subjects endpoint should return a list of subjects."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Register to get token
        import uuid
        email = f"subj_{uuid.uuid4().hex[:8]}@example.com"
        reg = await client.post("/api/v1/auth/register", json={
            "full_name": "Subj User",
            "email": email,
            "password": "SubjPass123",
            "confirm_password": "SubjPass123",
        })
        token = reg.json()["tokens"]["access_token"]

        resp = await client.get(
            "/api/v1/subjects",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

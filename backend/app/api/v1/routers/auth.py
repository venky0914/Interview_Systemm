from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    GoogleAuthRequest,
    RefreshTokenRequest,
    TokenPair,
    UserOut,
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create a new user account with email and password."""
    return await auth_service.register(payload, db)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password, receive JWT tokens."""
    return await auth_service.login(payload, db)


@router.post("/google", response_model=AuthResponse)
async def google_login(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate using a Google ID token (from Google Sign-In on frontend)."""
    return await auth_service.google_login(payload, db)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    return await auth_service.refresh_tokens(payload.refresh_token, db)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return await auth_service.get_me(current_user)


@router.post("/logout", status_code=204)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint — client should delete cookies on receipt.
    Server-side token invalidation requires a token denylist (Redis — Phase 4).
    """
    return None

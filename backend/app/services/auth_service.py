from datetime import datetime, timezone

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.core.exceptions import ConflictError, UnauthorizedError, NotFoundError
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, GoogleAuthRequest, AuthResponse, TokenPair, UserOut


def _build_token_pair(user_id: str) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(str(user_id)),
        refresh_token=create_refresh_token(str(user_id)),
    )


def _user_to_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_admin=user.is_admin,
        created_at=user.created_at.isoformat(),
    )


class AuthService:
    async def register(self, payload: RegisterRequest, db: AsyncSession) -> AuthResponse:
        # Check duplicate email
        result = await db.execute(select(User).where(User.email == payload.email))
        if result.scalar_one_or_none():
            raise ConflictError("An account with this email already exists")

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
        )
        db.add(user)
        await db.flush()  # get user.id before commit

        return AuthResponse(
            user=_user_to_out(user),
            tokens=_build_token_pair(str(user.id)),
            message="Account created successfully",
        )

    async def login(self, payload: LoginRequest, db: AsyncSession) -> AuthResponse:
        result = await db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()

        if not user or not user.hashed_password:
            raise UnauthorizedError("Invalid email or password")

        if not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedError("Account is deactivated. Please contact support.")

        user.last_login = datetime.now(timezone.utc)

        return AuthResponse(
            user=_user_to_out(user),
            tokens=_build_token_pair(str(user.id)),
            message="Login successful",
        )

    async def google_login(self, payload: GoogleAuthRequest, db: AsyncSession) -> AuthResponse:
        try:
            id_info = id_token.verify_oauth2_token(
                payload.token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            raise UnauthorizedError("Invalid Google token")

        google_id: str = id_info["sub"]
        email: str = id_info["email"]
        full_name: str = id_info.get("name", email.split("@")[0])
        avatar_url: str | None = id_info.get("picture")

        # Find by google_id first, then by email
        result = await db.execute(
            select(User).where(
                (User.google_id == google_id) | (User.email == email)
            )
        )
        user = result.scalar_one_or_none()

        if user:
            # Link google_id if missing
            if not user.google_id:
                user.google_id = google_id
            if not user.avatar_url and avatar_url:
                user.avatar_url = avatar_url
            user.last_login = datetime.now(timezone.utc)
        else:
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                avatar_url=avatar_url,
            )
            db.add(user)
            await db.flush()

        return AuthResponse(
            user=_user_to_out(user),
            tokens=_build_token_pair(str(user.id)),
            message="Google login successful",
        )

    async def refresh_tokens(self, refresh_token: str, db: AsyncSession) -> TokenPair:
        user_id = verify_refresh_token(refresh_token)
        if not user_id:
            raise UnauthorizedError("Invalid or expired refresh token")

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive")

        return _build_token_pair(str(user.id))

    async def get_me(self, user: User) -> UserOut:
        return _user_to_out(user)


auth_service = AuthService()

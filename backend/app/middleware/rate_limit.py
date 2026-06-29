"""
Rate limiting middleware using slowapi.

Default limits per IP:
  - Auth endpoints: 10 requests/minute (prevent brute force)
  - AI endpoints: 30 requests/minute (cost control)
  - General API: 120 requests/minute

Usage in routers:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    from fastapi import Request

    limiter = Limiter(key_func=get_remote_address)

    @router.post("/login")
    @limiter.limit("10/minute")
    async def login(request: Request, ...):
        ...
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance — imported by routers that need per-route limits
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
)

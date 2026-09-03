"""
AI Job Portal — Sliding Window Rate Limiter.
Provides thread-safe in-memory rate limiting with standard RFC 6585 headers:
Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
"""

import math
import threading
import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import HTTPException, Request, Response, status
from jose import jwt

from app.config import settings


class SlidingWindowRateLimiter:
    """Thread-safe in-memory sliding window rate limiter."""

    def __init__(self) -> None:
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def reset(self) -> None:
        """Clear all tracking state (primarily for tests)."""
        with self._lock:
            self._requests.clear()

    def check(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
    ) -> tuple[bool, int, int, int]:
        """Check rate limit for key.

        Returns:
            (allowed: bool, remaining: int, retry_after: int, reset_epoch: int)
        """
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            queue = self._requests[key]

            # Evict timestamps older than the sliding window
            while queue and queue[0] <= window_start:
                queue.popleft()

            if len(queue) >= max_requests:
                oldest = queue[0]
                retry_after = max(1, math.ceil(oldest + window_seconds - now))
                reset_epoch = int(oldest + window_seconds)
                return False, 0, retry_after, reset_epoch

            queue.append(now)
            remaining = max_requests - len(queue)
            reset_epoch = int(now + window_seconds)
            return True, remaining, 0, reset_epoch


rate_limiter_store = SlidingWindowRateLimiter()


# Preset rate limit configurations: (max_requests, window_seconds)
RATE_LIMIT_PRESETS: dict[str, tuple[int, int]] = {
    "ai_expensive": (10, 60),      # 10 requests / 60 seconds (Evaluate, Summarize, Roadmap, Email)
    "ai_interactive": (20, 60),    # 20 requests / 60 seconds (Skills suggest, Experience rewrite)
    "ai_matching": (30, 60),       # 30 requests / 60 seconds (Vector matching requests)
}


def rate_limit(preset_name: str = "ai_expensive") -> Callable:
    """FastAPI Dependency factory enforcing rate limits on endpoints."""
    max_requests, window_seconds = RATE_LIMIT_PRESETS.get(preset_name, (10, 60))

    async def _rate_limit_dependency(request: Request, response: Response) -> None:
        if not settings.RATE_LIMIT_ENABLED:
            return

        # Determine identifier: Authenticated user ID or Client IP
        identifier = None
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                identifier = f"user:{payload.get('sub')}"
            except Exception:
                pass

        if not identifier:
            client_ip = request.client.host if request.client else "127.0.0.1"
            identifier = f"ip:{client_ip}"

        key = f"{identifier}:{preset_name}"
        allowed, remaining, retry_after, reset_epoch = rate_limiter_store.check(
            key, max_requests, window_seconds
        )

        # Set standard rate limit headers on response
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_epoch)

        if not allowed:
            headers = {
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_epoch),
            }
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Bạn đã gửi quá nhiều yêu cầu phân tích AI. Vui lòng thử lại sau {retry_after} giây.",
                headers=headers,
            )

    return _rate_limit_dependency

"""
Tests for AI Rate Limiting & Quota Guard.
Verifies sliding window enforcement, HTTP 429 status, Retry-After header,
and standard X-RateLimit-* headers.
"""

import time

import pytest
from fastapi import Depends, FastAPI, status
from fastapi.testclient import TestClient
from jose import jwt

from app.config import settings
from app.core.rate_limiter import SlidingWindowRateLimiter, rate_limit, rate_limiter_store


@pytest.fixture(autouse=True)
def reset_limiter():
    """Reset rate limiter state before each test."""
    rate_limiter_store.reset()
    settings.RATE_LIMIT_ENABLED = True
    yield
    rate_limiter_store.reset()


def test_sliding_window_basic_flow():
    """Test basic allowance and exhaustion in sliding window."""
    limiter = SlidingWindowRateLimiter()
    key = "test_user:expensive"
    max_req = 3
    window = 10

    # 3 requests allowed
    allowed, remaining, retry_after, reset_epoch = limiter.check(key, max_req, window)
    assert allowed is True
    assert remaining == 2
    assert retry_after == 0

    allowed, remaining, retry_after, reset_epoch = limiter.check(key, max_req, window)
    assert allowed is True
    assert remaining == 1

    allowed, remaining, retry_after, reset_epoch = limiter.check(key, max_req, window)
    assert allowed is True
    assert remaining == 0

    # 4th request must be rejected with retry_after
    allowed, remaining, retry_after, reset_epoch = limiter.check(key, max_req, window)
    assert allowed is False
    assert remaining == 0
    assert retry_after >= 1
    assert retry_after <= window


def test_sliding_window_expiration():
    """Test that timestamps expire after window_seconds."""
    limiter = SlidingWindowRateLimiter()
    key = "test_user:quick_window"
    max_req = 1
    window = 1

    # 1st request allowed
    allowed, _, _, _ = limiter.check(key, max_req, window)
    assert allowed is True

    # 2nd request blocked immediately
    allowed, _, retry_after, _ = limiter.check(key, max_req, window)
    assert allowed is False
    assert retry_after >= 1

    # Wait for window to expire
    time.sleep(1.05)

    # 3rd request should now be allowed
    allowed, remaining, retry_after, _ = limiter.check(key, max_req, window)
    assert allowed is True
    assert remaining == 0


def test_rate_limit_endpoint_integration():
    """Test FastAPI dependency integration with headers and 429 response."""
    test_app = FastAPI()

    @test_app.get("/test-ai-expensive", dependencies=[Depends(rate_limit("ai_expensive"))])
    def expensive_route():
        return {"status": "ok"}

    client = TestClient(test_app)

    # Make 10 allowed requests (ai_expensive limit is 10/60s)
    for i in range(10):
        resp = client.get("/test-ai-expensive", headers={"X-Forwarded-For": "192.168.1.50"})
        assert resp.status_code == status.HTTP_200_OK
        assert "X-RateLimit-Limit" in resp.headers
        assert resp.headers["X-RateLimit-Limit"] == "10"
        assert resp.headers["X-RateLimit-Remaining"] == str(9 - i)

    # 11th request must receive HTTP 429 Too Many Requests
    resp_blocked = client.get("/test-ai-expensive", headers={"X-Forwarded-For": "192.168.1.50"})
    assert resp_blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Retry-After" in resp_blocked.headers
    assert int(resp_blocked.headers["Retry-After"]) >= 1
    assert "X-RateLimit-Remaining" in resp_blocked.headers
    assert resp_blocked.headers["X-RateLimit-Remaining"] == "0"
    data = resp_blocked.json()
    assert "quá nhiều yêu cầu" in data["detail"]


def test_rate_limit_user_isolation():
    """Verify that different users or different IPs do not block each other."""
    test_app = FastAPI()

    @test_app.get("/test-ai", dependencies=[Depends(rate_limit("ai_expensive"))])
    def route():
        return {"status": "ok"}

    client = TestClient(test_app)

    token_user1 = jwt.encode({"sub": "1001", "role": "candidate"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    token_user2 = jwt.encode({"sub": "1002", "role": "candidate"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    # User 1 exhausts their quota
    for _ in range(10):
        client.get("/test-ai", headers={"Authorization": f"Bearer {token_user1}"})

    resp_user1_blocked = client.get("/test-ai", headers={"Authorization": f"Bearer {token_user1}"})
    assert resp_user1_blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    # User 2 is unaffected and succeeds
    resp_user2 = client.get("/test-ai", headers={"Authorization": f"Bearer {token_user2}"})
    assert resp_user2.status_code == status.HTTP_200_OK
    assert resp_user2.headers["X-RateLimit-Remaining"] == "9"


def test_rate_limit_bypass_when_disabled():
    """Verify that setting RATE_LIMIT_ENABLED = False bypasses rate limiting."""
    settings.RATE_LIMIT_ENABLED = False

    test_app = FastAPI()

    @test_app.get("/test-ai-bypass", dependencies=[Depends(rate_limit("ai_expensive"))])
    def route():
        return {"status": "ok"}

    client = TestClient(test_app)

    # Even 15 requests succeed when disabled
    for _ in range(15):
        resp = client.get("/test-ai-bypass")
        assert resp.status_code == status.HTTP_200_OK

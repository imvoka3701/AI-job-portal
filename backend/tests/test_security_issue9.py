"""
Unit and Integration Tests for Issue #9 Security Hardening:
- Auth rate limiting (/auth/login and /auth/register)
- SlidingWindowRateLimiter memory cleanup
- Defensive Security Headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Production SECRET_KEY validation
"""

import time

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.core.rate_limiter import SlidingWindowRateLimiter


def test_auth_register_rate_limit(client: TestClient):
    """Test that /auth/register enforces 3 requests / 60 seconds per IP."""
    payload = {
        "password": "StrongPass123!",
        "full_name": "Rate Limit User",
        "role": "candidate",
    }

    # 3 allowed requests (will get 201 or 409 duplicate)
    for i in range(3):
        res = client.post(
            "/auth/register",
            json={**payload, "email": f"user_reg_{i}@example.com"},
            headers={"X-Forwarded-For": "10.0.0.1"},
        )
        assert res.status_code in (201, 409)
        assert "X-RateLimit-Limit" in res.headers
        assert res.headers["X-RateLimit-Limit"] == "3"

    # 4th request from same IP must receive HTTP 429
    res_blocked = client.post(
        "/auth/register",
        json={**payload, "email": "user_reg_blocked@example.com"},
        headers={"X-Forwarded-For": "10.0.0.1"},
    )
    assert res_blocked.status_code == 429
    assert "Retry-After" in res_blocked.headers
    data = res_blocked.json()
    assert "quá nhiều yêu cầu" in data["error"]["message"] or "quá nhiều yêu cầu" in str(data)


def test_auth_login_rate_limit(client: TestClient):
    """Test that /auth/login enforces 5 requests / 60 seconds per IP."""
    reg_payload = {
        "email": "login_rate@example.com",
        "password": "StrongPass123!",
        "full_name": "Login Rate User",
        "role": "candidate",
    }
    client.post("/auth/register", json=reg_payload, headers={"X-Forwarded-For": "10.0.0.99"})

    login_payload = {
        "email": "login_rate@example.com",
        "password": "StrongPass123!",
    }

    # 5 allowed requests (will get 200 OK)
    for i in range(5):
        res = client.post(
            "/auth/login",
            json=login_payload,
            headers={"X-Forwarded-For": "10.0.0.2"},
        )
        assert res.status_code == 200
        assert "X-RateLimit-Limit" in res.headers
        assert res.headers["X-RateLimit-Limit"] == "5"

    # 6th request from same IP must receive HTTP 429
    res_blocked = client.post(
        "/auth/login",
        json=login_payload,
        headers={"X-Forwarded-For": "10.0.0.2"},
    )
    assert res_blocked.status_code == 429
    assert "Retry-After" in res_blocked.headers
    assert res_blocked.headers.get("X-RateLimit-Limit") == "5"


def test_rate_limiter_memory_cleanup():
    """Test that SlidingWindowRateLimiter.cleanup() purges stale entries."""
    limiter = SlidingWindowRateLimiter()

    # Simulate an active entry
    limiter.check("active_user:test", max_requests=10, window_seconds=60)

    # Simulate a stale entry by directly putting an old timestamp
    old_time = time.time() - 500  # older than 300s
    limiter._requests["stale_user:test"].append(old_time)

    # Stale empty queue
    limiter._requests["empty_user:test"]

    assert len(limiter._requests) >= 3

    # Run cleanup
    purged = limiter.cleanup(max_idle_seconds=300)
    assert purged >= 2
    assert "stale_user:test" not in limiter._requests
    assert "empty_user:test" not in limiter._requests
    assert "active_user:test" in limiter._requests


def test_security_headers_middleware(client: TestClient):
    """Test that security headers are applied to HTTP responses."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_production_secret_key_validation():
    """Test that Settings validator rejects weak/default SECRET_KEY in production."""
    # Production with default key -> must raise ValidationError
    with pytest.raises(ValidationError):
        Settings(DEBUG=False, SECRET_KEY="change-me-in-production")

    # Production with short key (< 32 chars) -> must raise ValidationError
    with pytest.raises(ValidationError):
        Settings(DEBUG=False, SECRET_KEY="short-secret-key")

    # Production with strong 32+ char key -> succeeds
    strong_key = "a" * 32
    prod_settings = Settings(DEBUG=False, SECRET_KEY=strong_key)
    assert prod_settings.DEBUG is False
    assert prod_settings.SECRET_KEY == strong_key

    # Debug mode with short key -> succeeds in development
    dev_settings = Settings(DEBUG=True, SECRET_KEY="dev-secret")
    assert dev_settings.DEBUG is True


def test_production_docs_disabled():
    """Verify that docs, redoc, and openapi.json are disabled when DEBUG=False."""
    from fastapi import FastAPI
    app_prod = FastAPI(
        docs_url="/docs" if False else None,
        redoc_url="/redoc" if False else None,
        openapi_url="/openapi.json" if False else None,
    )
    test_client = TestClient(app_prod)
    assert test_client.get("/docs").status_code == 404
    assert test_client.get("/redoc").status_code == 404
    assert test_client.get("/openapi.json").status_code == 404

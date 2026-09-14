"""Tests for AI Engine & LLM Gateway Security (Giai đoạn D):
1. API Key Redaction & Credential Masking in Exceptions and Audit Logs.
2. Context Window Clamping & Token Quota Guard (Chống Context Bloating / Financial DoS).
3. Defensive LLM JSON Output Parsing (code fences, trailing commas, chatter, smart quotes).
4. Graceful Fallback on Malformed LLM Outputs (prevents unhandled 500 crashes).
5. Embedding Service Input Clamping for vector safety.
"""

from unittest.mock import patch

import pytest

from app.config import settings
from app.core.llm_guard import clamp_text, parse_llm_json
from app.core.secret_masker import mask_secrets
from app.services.ai_audit import ai_audit
from app.services.ai_errors import AIServiceError, ai_http_exception
from app.services.embedding_service import generate_embedding


def test_mask_secrets_redacts_api_keys_and_tokens():
    """Verify that sensitive credentials and tokens are redacted from strings."""
    # 1. Bearer Token
    sample_bearer = "Request authorization failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijk"
    masked_bearer = mask_secrets(sample_bearer)
    assert "Bearer ***REDACTED***" in masked_bearer
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in masked_bearer

    # 2. OpenAI / DeepSeek API Key format (sk-...)
    sample_key = "Connection failed using API key sk-ant-api03-abcdef1234567890abcdef"
    masked_key = mask_secrets(sample_key)
    assert "***REDACTED***" in masked_key
    assert "sk-ant-api03-abcdef1234567890abcdef" not in masked_key

    # 3. Database URL with credentials
    sample_db = "Could not connect to postgresql://postgres:SuperSecretDbPassword123@localhost:5432/aijob"
    masked_db = mask_secrets(sample_db)
    assert "***REDACTED***" in masked_db
    assert "SuperSecretDbPassword123" not in masked_db

    # 4. Configured settings secrets
    if settings.SECRET_KEY and len(settings.SECRET_KEY) >= 8:
        raw_secret_leak = f"System crashed with SECRET_KEY={settings.SECRET_KEY}"
        masked_secret = mask_secrets(raw_secret_leak)
        assert settings.SECRET_KEY not in masked_secret
        assert "***REDACTED***" in masked_secret


def test_ai_http_exception_redacts_leaked_secrets():
    """Verify that ai_http_exception masks any secret present in custom AIServiceError messages."""
    leaked_msg = "Upstream provider error using key sk-test-999888777666555444333"
    custom_exc = AIServiceError(
        code="AI_PROVIDER_ERROR",
        message=leaked_msg,
        status_code=502,
        retryable=True,
    )
    http_exc = ai_http_exception(custom_exc)
    detail_msg = http_exc.detail["message"]
    assert "sk-test-999888777666555444333" not in detail_msg
    assert "***REDACTED***" in detail_msg


def test_ai_audit_masks_secrets_in_logs():
    """Verify that ai_audit log entries have sensitive summaries sanitized before emission."""
    captured_records = []

    with patch.object(ai_audit, "_emit", side_effect=lambda rec: captured_records.append(rec)):
        secret_summary = "error with Bearer secret-auth-token-1234567890"
        ai_audit.log_success(
            user_id=1,
            user_role="employer",
            endpoint="test_endpoint",
            model="deepseek-chat",
            input_summary=secret_summary,
            output_summary=secret_summary,
            started_at=0.0,
        )

        assert len(captured_records) == 1
        emitted = captured_records[0]
        assert "secret-auth-token-1234567890" not in emitted["input_summary"]
        assert "secret-auth-token-1234567890" not in emitted["output_summary"]
        assert "***REDACTED***" in emitted["input_summary"]


def test_clamp_text_prevents_bloated_contexts():
    """Verify that oversized inputs are clamped and short inputs remain intact."""
    # Short text remains untouched
    short_text = "Senior Python Developer with 5 years experience."
    assert clamp_text(short_text, max_chars=100) == short_text

    # Massive text is clamped with suffix
    giant_text = "A" * 50000
    clamped = clamp_text(giant_text, max_chars=1000)
    assert len(clamped) < 50000
    assert clamped.startswith("A" * 1000)
    assert "... [Nội dung đã được cắt bớt" in clamped

    # Empty/None text handling
    assert clamp_text(None) == ""
    assert clamp_text("") == ""


def test_defensive_json_parsing_code_fences_and_smart_quotes():
    """Verify that LLM markdown code fences, trailing commas, and smart quotes are parsed cleanly."""
    raw_markdown_json = (
        "```json\n"
        "{\n"
        '  “title”: “Senior AI Engineer”,\n'
        '  “salary_min”: 30000000,\n'
        '  “salary_max”: 50000000,\n'
        '  “skills”: [“Python”, “FastAPI”, “PostgreSQL”,],\n'
        "}\n"
        "```"
    )

    data = parse_llm_json(raw_markdown_json)
    assert isinstance(data, dict)
    assert data["title"] == "Senior AI Engineer"
    assert data["salary_min"] == 30000000
    assert data["skills"] == ["Python", "FastAPI", "PostgreSQL"]


def test_defensive_json_parsing_chatter_wrapping():
    """Verify that LLM conversational preambles/postscripts are stripped safely."""
    chatty_output = (
        "Here is the evaluation result you asked for:\n\n"
        '{"is_valid": true, "score": 88.5, "feedback": "Strong profile"}\n\n'
        "I hope this helps your hiring team!"
    )

    data = parse_llm_json(chatty_output)
    assert isinstance(data, dict)
    assert data["is_valid"] is True
    assert data["score"] == 88.5
    assert data["feedback"] == "Strong profile"


def test_defensive_json_parsing_fallback_on_corrupt_data():
    """Verify that corrupted LLM outputs gracefully return default or raise AIServiceError."""
    corrupted_output = "I cannot fulfill this request as an AI assistant. Sorry!"

    # 1. With default provided -> returns default gracefully (no crash)
    fallback_default = {"is_valid": False, "reason": "Fallback default"}
    res = parse_llm_json(corrupted_output, default=fallback_default)
    assert res == fallback_default

    # 2. Without default -> raises AIServiceError with HTTP 502 Bad Gateway (not unhandled 500)
    with pytest.raises(AIServiceError) as exc_info:
        parse_llm_json(corrupted_output)
    assert exc_info.value.code == "AI_INVALID_RESPONSE"
    assert exc_info.value.status_code == 502


def test_embedding_service_clamps_giant_inputs():
    """Verify that generate_embedding clamps inputs over 8192 chars without throwing error."""
    giant_resume_text = "Kỹ sư backend Python " * 1000  # ~22,000 characters
    emb = generate_embedding(giant_resume_text)
    assert isinstance(emb, list)
    assert len(emb) == 384  # Matches EMBEDDING_DIM

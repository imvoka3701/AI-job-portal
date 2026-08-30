"""Tests for AI Email Generator service and endpoint."""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.email_generator import email_generator_service


@pytest.mark.skipif(
    not os.getenv("RUN_REAL_LLM"),
    reason="Set RUN_REAL_LLM=1 to run live Deepseek LLM tests (needs network + API key).",
)
class TestEmailGeneratorService:
    @pytest.mark.asyncio
    async def test_fallback_invite_email(self):
        """Test fallback generation produces structured invite email with placeholders."""
        result = await email_generator_service.generate(
            email_type="invite",
            candidate_name="Nguyễn Văn A",
            job_title="Senior Python Developer",
            company_name="TechCorp VN",
        )
        assert result.subject != ""
        assert "Nguyễn Văn A" in result.body or "bạn" in result.body
        assert "Senior Python Developer" in result.body or "TechCorp VN" in result.subject

    @pytest.mark.asyncio
    async def test_fallback_reject_email(self):
        """Test fallback generation produces polite rejection without specific reasons."""
        result = await email_generator_service.generate(
            email_type="reject",
            candidate_name="Trần Thị B",
            job_title="Frontend Developer",
            company_name="TechCorp VN",
        )
        assert result.subject != ""
        assert "cảm ơn" in result.body.lower() or "tiếc" in result.body.lower()

    @pytest.mark.asyncio
    async def test_fallback_offer_email(self):
        """Test fallback generation produces congratulatory offer letter."""
        result = await email_generator_service.generate(
            email_type="offer",
            candidate_name="Lê Văn C",
            job_title="DevOps Engineer",
            company_name="TechCorp VN",
        )
        assert result.subject != ""
        assert "chúc mừng" in result.body.lower() or "trúng tuyển" in result.body.lower()

    @pytest.mark.asyncio
    async def test_invalid_email_type_raises(self):
        """Test invalid email_type raises ValueError."""
        with pytest.raises(ValueError):
            await email_generator_service.generate(
                email_type="invalid_type",
                candidate_name="A",
                job_title="B",
                company_name="C",
            )

"""Structured AI audit logging for bias monitoring and traceability.

Each AI call is logged as a structured JSON record to the 'ai_audit' logger.
Log entries include:
  - timestamp (ISO 8601)
  - user_id / user_role: WHO made the request
  - endpoint: WHICH AI feature was invoked
  - model: WHICH LLM model was called
  - input_summary: NON-PII metadata about the input only (e.g. role, language,
    resume_id, text_len). NEVER pass raw CV/resume text or other personal data.
  - output_summary: truncated preview of the AI output
  - latency_ms: how long the call took
  - success: whether the call succeeded
  - error_code: normalized error code if failed (matches AIServiceError.code)

Purpose:
  - Bias monitoring: detect if AI systematically favors or disfavors patterns
  - Quota tracking: identify which features consume the most LLM calls
  - Quality control: spot hallucination patterns in output summaries
  - Audit evidence for thesis (SDLC, AI ethics)

Usage:
    from app.services.ai_audit import ai_audit

    started = time.monotonic()
    try:
        result = await some_ai_call(...)
        ai_audit.log_success(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="evaluate",
            model=settings.LLM_MODEL,
            input_summary=f"resume_id={resume.id}, text_len={len(resume_text)}",
            output_summary=f"score={result.overall_score}, skills={len(result.skill_analysis)}",
            started_at=started,
        )
    except Exception as exc:
        ai_audit.log_failure(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="evaluate",
            model=settings.LLM_MODEL,
            input_summary=f"resume_id={resume.id}, text_len={len(resume_text)}",
            exc=exc,
            started_at=started,
        )
        raise
"""

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from app.services.ai_errors import normalize_ai_error
from app.services.pii_redactor import pii_redactor

# Dedicated logger — configure a separate file handler in production to isolate
# AI audit logs from the main application log stream.
_logger = logging.getLogger("ai_audit")


class AIAuditLogger:
    """Emits structured JSON audit records for every AI operation."""

    def _emit(self, record: dict) -> None:
        _logger.info(json.dumps(record, ensure_ascii=False))

    def log_success(
        self,
        *,
        user_id: int,
        user_role: str,
        endpoint: str,
        model: str,
        input_summary: str,
        output_summary: str,
        started_at: float,
        raw_input_payload: Any = None,
        raw_output_payload: Any = None,
    ) -> None:
        """Log a successful AI call."""
        self._emit(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "ai_call_success",
                "user_id": user_id,
                "user_role": user_role,
                "endpoint": endpoint,
                "model": model,
                "input_summary": input_summary[:200],
                "output_summary": output_summary[:300],
                "raw_input_payload": pii_redactor.redact_json(raw_input_payload) if raw_input_payload else None,
                "raw_output_payload": pii_redactor.redact_json(raw_output_payload) if raw_output_payload else None,
                "latency_ms": round((time.monotonic() - started_at) * 1000),
                "success": True,
                "error_code": None,
            }
        )

    def log_failure(
        self,
        *,
        user_id: int,
        user_role: str,
        endpoint: str,
        model: str,
        input_summary: str,
        exc: Exception,
        started_at: float,
        raw_input_payload: Any = None,
    ) -> None:
        """Log a failed AI call with the normalized error code."""
        err = normalize_ai_error(exc)
        self._emit(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "ai_call_failure",
                "user_id": user_id,
                "user_role": user_role,
                "endpoint": endpoint,
                "model": model,
                "input_summary": input_summary[:200],
                "output_summary": None,
                "raw_input_payload": pii_redactor.redact_json(raw_input_payload) if raw_input_payload else None,
                "latency_ms": round((time.monotonic() - started_at) * 1000),
                "success": False,
                "error_code": err.code,
                "retryable": err.retryable,
            }
        )


# Module-level singleton — import and use directly.
ai_audit = AIAuditLogger()

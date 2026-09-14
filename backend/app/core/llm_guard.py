"""LLM Guard — Context window protection, token clamping, and defensive JSON parsing.

Guarantees:
1. Massive inputs never exceed token budgets (prevents Context Bloating / Financial DoS).
2. Malformed LLM outputs (markdown fences, trailing commas, chatter) are parsed safely.
3. Fallback degradation without unhandled 500 crashes.
"""

import json
import logging
import re
from typing import Any

from app.services.ai_errors import AIServiceError

logger = logging.getLogger(__name__)

# Smart quote replacement mapping
_SMART_QUOTES_MAP = str.maketrans({
    "“": '"',
    "”": '"',
    "„": '"',
    "‟": '"',
    "‘": "'",
    "’": "'",
    "‚": "'",
    "‛": "'",
})

# Trailing comma regex
_TRAILING_COMMA_REGEX = re.compile(r",\s*([\}\]])")


def clamp_text(
    text: str | None,
    max_chars: int = 10000,
    suffix: str = "\n... [Nội dung đã được cắt bớt để bảo toàn context window]",
) -> str:
    """Clamp text length to prevent context window bloating and financial DoS."""
    if not text:
        return ""
    cleaned = str(text).strip()
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[:max_chars] + suffix


def parse_llm_json(raw_content: str | None, default: Any = None) -> Any:
    """Defensively parse JSON from LLM responses with multi-stage sanitization.

    Handles:
    - Markdown code fences (```json ... ``` or ``` ...)
    - Leading/trailing chatter outside JSON bounds
    - Smart quotes (curly quotes)
    - Trailing commas before closing braces/brackets
    - Graceful fallback default if parsing fails
    """
    if not raw_content or not str(raw_content).strip():
        if default is not None:
            return default
        raise AIServiceError(
            code="AI_INVALID_RESPONSE",
            message="Dịch vụ AI phản hồi nội dung rỗng.",
            status_code=502,
            retryable=True,
        )

    text = str(raw_content).strip()

    # 1. Strip Markdown code fences
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    # 2. Extract balanced JSON block if outer commentary exists
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    first_bracket = text.find("[")
    last_bracket = text.rfind("]")

    # Decide whether object or array is the primary target
    if first_brace != -1 and last_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
        text = text[first_brace : last_brace + 1]
    elif first_bracket != -1 and last_bracket != -1:
        text = text[first_bracket : last_bracket + 1]

    # 3. Normalize smart quotes
    text = text.translate(_SMART_QUOTES_MAP)

    # 4. Clean trailing commas
    text = _TRAILING_COMMA_REGEX.sub(r"\1", text)

    # 5. Parse JSON
    try:
        return json.loads(text)
    except Exception as exc:
        logger.warning("Defensive JSON parse failed on text snippet '%s': %s", text[:120], exc)
        if default is not None:
            return default
        raise AIServiceError(
            code="AI_INVALID_RESPONSE",
            message="Dịch vụ AI trả về dữ liệu không đúng định dạng JSON.",
            status_code=502,
            retryable=True,
        ) from exc

"""Secret Masker — Redacts sensitive credentials, tokens, and API keys.

Protects logs, exception traces, and audit logs from leaking:
- DEEPSEEK_API_KEY, GOOGLE_API_KEY, SECRET_KEY, OPENAI_API_KEY
- Bearer tokens
- OpenAI / DeepSeek format keys (sk-...)
- Database connection strings with passwords
"""

import re
from typing import Any

from app.config import settings

# Patterns for generic secret formats
_BEARER_TOKEN_REGEX = re.compile(r"(Bearer\s+)[a-zA-Z0-9_\-\.]{15,}", re.IGNORECASE)
_SK_KEY_REGEX = re.compile(r"\b(sk-[a-zA-Z0-9_\-]{15,})\b", re.IGNORECASE)
_DB_URL_REGEX = re.compile(
    r"(postgresql(?:\+[a-zA-Z0-9_]+)?://[^:]+:)([^@]+)(@)", re.IGNORECASE
)


def mask_secrets(text: Any) -> str:
    """Mask known secrets and credential patterns in text.

    Guarantees that sensitive environment variables and tokens
    are replaced with '***REDACTED***'.
    """
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)

    sanitized = text

    # 1. Mask specific configured settings secrets if present and long enough
    known_secrets = [
        getattr(settings, "DEEPSEEK_API_KEY", None),
        getattr(settings, "SECRET_KEY", None),
        getattr(settings, "GOOGLE_API_KEY", None),
    ]

    for secret in known_secrets:
        if secret and isinstance(secret, str) and len(secret.strip()) >= 8:
            sanitized = sanitized.replace(secret.strip(), "***REDACTED***")

    # 2. Mask Bearer tokens
    sanitized = _BEARER_TOKEN_REGEX.sub(r"\1***REDACTED***", sanitized)

    # 3. Mask sk-... pattern API keys
    sanitized = _SK_KEY_REGEX.sub("***REDACTED***", sanitized)

    # 4. Mask Database credentials in connection URLs
    sanitized = _DB_URL_REGEX.sub(r"\1***REDACTED***\3", sanitized)

    return sanitized

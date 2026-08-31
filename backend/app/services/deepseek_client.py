"""Deepseek API client for LLM-powered AI features.

Ghi log mọi lần gọi API vào bảng ai_call_logs.
Việc ghi log được bọc trong try/except riêng — KHÔNG bao giờ làm lỗi luồng chính.
"""

import asyncio
import logging
import time

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Token pricing (Deepseek V3 — update when prices change) ─────────────────
_PRICE_INPUT_PER_1M = 0.27  # USD per 1M input tokens
_PRICE_OUTPUT_PER_1M = 1.10  # USD per 1M output tokens


def _calc_cost(input_tokens: int | None, output_tokens: int | None) -> float | None:
    if input_tokens is None or output_tokens is None:
        return None
    return (input_tokens * _PRICE_INPUT_PER_1M + output_tokens * _PRICE_OUTPUT_PER_1M) / 1_000_000


class DeepseekClient:
    def __init__(self) -> None:
        self.base_url = settings.DEEPSEEK_BASE_URL.rstrip("/")
        # The httpx.AsyncClient binds to the event loop that is running when it
        # is created. Creating it once at import time (module singleton) means
        # it stays bound to whatever loop existed then; when a different loop
        # runs later (e.g. Starlette TestClient spins up a fresh loop per
        # request), the old client's connection pool raises
        # "RuntimeError: Event loop is closed". So we create the client lazily
        # and rebind it whenever the running loop changes or the client closed.
        self._client: httpx.AsyncClient | None = None
        self._client_loop: asyncio.AbstractEventLoop | None = None

    def _get_client(self) -> httpx.AsyncClient:
        loop = asyncio.get_running_loop()
        if self._client is None or self._client.is_closed or self._client_loop is not loop:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(30.0, connect=10.0),
            )
            self._client_loop = loop
        return self._client

    async def create_chat_completion(
        self,
        messages: list[dict[str, str]],
        model: str,
        response_format: dict | None = {"type": "json_object"},
        *,
        feature: str | None = None,
        user_id: int | None = None,
        related_id: int | None = None,
        db=None,  # sqlalchemy Session — optional, skipped if None
    ) -> dict:
        payload = {
            "model": model,
            "messages": messages,
        }
        if response_format is not None:
            payload["response_format"] = response_format

        client = self._get_client()
        start_ms = time.monotonic()
        status = "success"
        error_msg: str | None = None
        response_data: dict = {}

        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            response_data = response.json()
            return response_data
        except Exception as exc:
            status = "failed"
            error_msg = str(exc)[:500]
            raise
        finally:
            duration_ms = int((time.monotonic() - start_ms) * 1000)
            # ── Log to DB — never let this break the main flow ────────────────
            if db is not None and feature is not None:
                try:
                    usage = response_data.get("usage", {})
                    input_tok = usage.get("prompt_tokens") or None
                    output_tok = usage.get("completion_tokens") or None
                    cost = _calc_cost(input_tok, output_tok)

                    from app.models.ai_call_log import AICallLog, AICallStatus

                    log = AICallLog(
                        feature=feature,
                        user_id=user_id,
                        related_id=related_id,
                        input_tokens=input_tok,
                        output_tokens=output_tok,
                        cost_usd=cost,
                        status=AICallStatus(status),
                        error_message=error_msg,
                        duration_ms=duration_ms,
                    )
                    db.add(log)
                    db.commit()
                except Exception as log_exc:
                    logger.warning("Failed to write AI call log: %s", log_exc)


deepseek_client = DeepseekClient()

"""Deepseek API client for LLM-powered AI features.

Tích hợp:
1. Intelligent SHA-256 Caching: Tiết kiệm 100% token cho truy vấn trùng lặp.
2. Exponential Backoff Retry: Tự động thử lại khi lỗi mạng tạm thời (ConnectTimeout, 502, 503).
3. Circuit Breaker: Ngắt mạch tự động khi lỗi liên tiếp để bảo vệ tài khoản API.
4. Ghi log mọi lần gọi API vào bảng ai_call_logs.
"""

import asyncio
import copy
import hashlib
import json
import logging
import time
from typing import Any

import httpx
from fastapi import status

from app.config import settings
from app.core.secret_masker import mask_secrets
from app.services.ai_errors import AIServiceError

logger = logging.getLogger(__name__)

# ── Token pricing (Deepseek V3 — update when prices change) ─────────────────
_PRICE_INPUT_PER_1M = 0.27  # USD per 1M input tokens
_PRICE_OUTPUT_PER_1M = 1.10  # USD per 1M output tokens


def _calc_cost(input_tokens: int | None, output_tokens: int | None) -> float | None:
    if input_tokens is None or output_tokens is None:
        return None
    return (input_tokens * _PRICE_INPUT_PER_1M + output_tokens * _PRICE_OUTPUT_PER_1M) / 1_000_000


class AICache:
    """In-memory thread-safe cache based on SHA-256 hash of LLM input."""

    def __init__(self, ttl_seconds: int = 86400) -> None:
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, tuple[float, dict]] = {}

    def _hash_key(self, model: str, messages: list[dict[str, Any]], response_format: Any) -> str:
        data = {"m": model, "msgs": messages, "rf": response_format}
        serialized = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def get(self, model: str, messages: list[dict[str, Any]], response_format: Any) -> dict | None:
        key = self._hash_key(model, messages, response_format)
        if key in self._cache:
            ts, resp = self._cache[key]
            if time.time() - ts < self.ttl_seconds:
                return copy.deepcopy(resp)
            del self._cache[key]
        return None

    def set(self, model: str, messages: list[dict[str, Any]], response_format: Any, response_data: dict) -> None:
        key = self._hash_key(model, messages, response_format)
        # Giới hạn kích thước cache 1000 items để bảo toàn RAM
        if len(self._cache) > 1000:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][0])
            del self._cache[oldest_key]
        self._cache[key] = (time.time(), copy.deepcopy(response_data))

    def clear(self) -> None:
        self._cache.clear()


class CircuitBreaker:
    """Circuit breaker pattern to protect API budget and fail fast."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout_seconds: float = 30.0) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout_seconds
        self.consecutive_failures = 0
        self.last_failure_time: float = 0.0

    def is_open(self) -> bool:
        if self.consecutive_failures >= self.failure_threshold:
            if time.time() - self.last_failure_time < self.recovery_timeout:
                return True
            # Thử lại (Half-open)
            return False
        return False

    def record_success(self) -> None:
        self.consecutive_failures = 0
        self.last_failure_time = 0.0

    def record_failure(self) -> None:
        self.consecutive_failures += 1
        self.last_failure_time = time.time()


class DeepseekClient:
    def __init__(self) -> None:
        self.base_url = settings.DEEPSEEK_BASE_URL.rstrip("/")
        self._client: httpx.AsyncClient | None = None
        self._client_loop: asyncio.AbstractEventLoop | None = None
        self.cache = AICache(ttl_seconds=86400)
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout_seconds=30.0)

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
        messages: list[dict[str, Any]],
        model: str,
        response_format: dict | None = {"type": "json_object"},
        *,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | dict[str, Any] | None = None,
        feature: str | None = None,
        user_id: int | None = None,
        related_id: int | None = None,
        db=None,  # sqlalchemy Session — optional, skipped if None
        use_cache: bool = True,
    ) -> dict:
        # 1. Kiểm tra Circuit Breaker (Fail fast nếu đang gặp sự cố liên tiếp)
        if self.circuit_breaker.is_open():
            raise AIServiceError(
                code="AI_CIRCUIT_OPEN",
                message="Dịch vụ AI đang tạm thời gián đoạn để tự phục hồi. Vui lòng thử lại sau ít giây.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                retryable=True,
            )

        # 2. Kiểm tra Intelligent Cache (Chỉ áp dụng cho các request không có tool calling)
        if use_cache and not tools:
            cached_result = self.cache.get(model, messages, response_format)
            if cached_result is not None:
                logger.info("AI Cache HIT for feature=%s", feature)
                return cached_result

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
        }
        if response_format is not None:
            payload["response_format"] = response_format
        if tools is not None:
            payload["tools"] = tools
            if tool_choice is not None:
                payload["tool_choice"] = tool_choice

        client = self._get_client()
        start_ms = time.monotonic()
        status_label = "success"
        error_msg: str | None = None
        response_data: dict = {}

        # 3. Thực thi gọi API với Exponential Backoff Retry (Tối đa 2 lần thử lại)
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                response = await client.post("/chat/completions", json=payload)
                response.raise_for_status()
                response_data = response.json()
                self.circuit_breaker.record_success()

                # Lưu vào cache nếu thành công
                if use_cache and not tools:
                    self.cache.set(model, messages, response_format, response_data)

                return response_data

            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as net_err:
                if attempt < max_retries:
                    backoff = 1.0 * (attempt + 1)
                    logger.warning("AI network error (%s). Retrying in %ss (attempt %s/%s)...", net_err, backoff, attempt + 1, max_retries)
                    await asyncio.sleep(backoff)
                    continue
                status_label = "failed"
                error_msg = mask_secrets(str(net_err))[:500]
                self.circuit_breaker.record_failure()
                raise

            except httpx.HTTPStatusError as http_err:
                # Retry nếu server upstream 502/503/504
                if http_err.response.status_code in (502, 503, 504) and attempt < max_retries:
                    backoff = 1.0 * (attempt + 1)
                    logger.warning("AI HTTP %s error. Retrying in %ss...", http_err.response.status_code, backoff)
                    await asyncio.sleep(backoff)
                    continue
                status_label = "failed"
                error_msg = mask_secrets(str(http_err))[:500]
                self.circuit_breaker.record_failure()
                raise

            except Exception as exc:
                status_label = "failed"
                error_msg = mask_secrets(str(exc))[:500]
                self.circuit_breaker.record_failure()
                raise

            finally:
                if status_label == "success" or attempt == max_retries:
                    duration_ms = int((time.monotonic() - start_ms) * 1000)
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
                                status=AICallStatus(status_label),
                                error_message=error_msg,
                                duration_ms=duration_ms,
                            )
                            db.add(log)
                            db.commit()
                        except Exception as log_exc:
                            logger.warning("Failed to write AI call log: %s", log_exc)


deepseek_client = DeepseekClient()


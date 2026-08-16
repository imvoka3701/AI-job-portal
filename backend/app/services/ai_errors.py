"""Stable, user-safe error contract for AI provider operations."""

import json

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError


class AIServiceError(Exception):
    def __init__(self, *, code: str, message: str, status_code: int, retryable: bool) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.retryable = retryable


def normalize_ai_error(exc: Exception | None) -> AIServiceError:
    if isinstance(exc, AIServiceError):
        return exc

    if isinstance(exc, httpx.TimeoutException):
        return AIServiceError(
            code="AI_TIMEOUT",
            message="Dịch vụ AI phản hồi quá thời gian. Vui lòng thử lại.",
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            retryable=True,
        )

    if isinstance(exc, httpx.HTTPStatusError):
        provider_status = exc.response.status_code
        if provider_status == status.HTTP_429_TOO_MANY_REQUESTS:
            return AIServiceError(
                code="AI_QUOTA_EXCEEDED",
                message="Dịch vụ AI đang giới hạn lượt dùng. Vui lòng thử lại sau.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                retryable=True,
            )

        return AIServiceError(
            code="AI_PROVIDER_UNAVAILABLE",
            message="Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=provider_status >= 500,
        )

    if isinstance(exc, httpx.RequestError):
        return AIServiceError(
            code="AI_PROVIDER_UNAVAILABLE",
            message="Không thể kết nối dịch vụ AI. Vui lòng thử lại sau.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=True,
        )

    if isinstance(exc, (json.JSONDecodeError, ValidationError, ValueError, KeyError, IndexError)):
        return AIServiceError(
            code="AI_INVALID_RESPONSE",
            message="Dịch vụ AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.",
            status_code=status.HTTP_502_BAD_GATEWAY,
            retryable=True,
        )

    return AIServiceError(
        code="AI_PROVIDER_UNAVAILABLE",
        message="Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.",
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        retryable=True,
    )


def ai_http_exception(exc: Exception) -> HTTPException:
    error = normalize_ai_error(exc)
    return HTTPException(
        status_code=error.status_code,
        detail={
            "code": error.code,
            "message": error.message,
            "retryable": error.retryable,
        },
    )

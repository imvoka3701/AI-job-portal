"""AI suggestions for structured CV Builder sections."""

import json
import logging
import re
from time import perf_counter
from typing import TypeVar

from pydantic import BaseModel

from app.config import settings
from app.schemas.ai import (
    CvExperienceSuggestionResponse,
    CvSkillsSuggestionResponse,
    CvSummarySuggestionResponse,
)
from app.services.ai_errors import normalize_ai_error
from app.services.deepseek_client import deepseek_client

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)
MAX_RETRIES = 2


class CvSuggestionService:
    @staticmethod
    def _parse_response(content: str, response_model: type[T]) -> T:
        cleaned = content.strip()
        fenced = re.fullmatch(
            r"```(?:json)?\s*(.*?)\s*```", cleaned, flags=re.DOTALL | re.IGNORECASE
        )
        if fenced:
            cleaned = fenced.group(1).strip()
        return response_model.model_validate(json.loads(cleaned))

    async def _request(self, *, task: str, instruction: str, response_model: type[T]) -> T:
        last_error: Exception | None = None
        for attempt in range(1 + MAX_RETRIES):
            started_at = perf_counter()
            try:
                response = await deepseek_client.create_chat_completion(
                    messages=[
                        {
                            "role": "system",
                            "content": "Bạn là trợ lý viết CV. Chỉ trả JSON đúng schema được yêu cầu, không bịa thông tin cá nhân, không đưa quyết định tuyển dụng.",
                        },
                        {"role": "user", "content": instruction},
                    ],
                    model=settings.LLM_MODEL,
                )
                content = response.get("choices", [])[0].get("message", {}).get("content", "")
                if not content:
                    raise ValueError("Empty response from Deepseek")
                result = self._parse_response(content, response_model)
                logger.info(
                    "CV AI task=%s completed in %.2fs attempt=%d",
                    task,
                    perf_counter() - started_at,
                    attempt + 1,
                )
                return result
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "CV AI task=%s attempt=%d/%d failed after %.2fs error=%s",
                    task,
                    attempt + 1,
                    1 + MAX_RETRIES,
                    perf_counter() - started_at,
                    type(exc).__name__,
                )
        raise normalize_ai_error(last_error)

    async def suggest_summary(
        self, *, current_text: str, target_role: str, language: str
    ) -> CvSummarySuggestionResponse:
        return await self._request(
            task="summary",
            instruction=(
                f'JSON schema: {{"suggestion":"...", "rationale":"..."}}. Viết phần summary CV cho vị trí "{target_role}" bằng {language}. '
                f"Nội dung hiện tại (có thể rỗng): {current_text}. Không thêm số liệu hoặc kinh nghiệm không có trong nội dung."
            ),
            response_model=CvSummarySuggestionResponse,
        )

    async def rewrite_experience(
        self, *, experience_text: str, target_role: str, language: str, job_context: str = ""
    ) -> CvExperienceSuggestionResponse:
        job_hint = f" Ngữ cảnh công việc mục tiêu: {job_context[:400]}." if job_context else ""
        return await self._request(
            task="experience",
            instruction=(
                f'JSON schema: {{"bullets":["..."], "rationale":"..."}}. Viết lại tối đa 5 bullet kinh nghiệm theo hướng thành tựu cho vị trí "{target_role}" bằng {language}.{job_hint} '
                f"Nội dung gốc: {experience_text}. Chỉ dùng thông tin đã cung cấp, không bịa số liệu."
            ),
            response_model=CvExperienceSuggestionResponse,
        )

    async def suggest_skills(
        self, *, current_skills: list[str], target_role: str, job_context: str, language: str
    ) -> CvSkillsSuggestionResponse:
        return await self._request(
            task="skills",
            instruction=(
                f'JSON schema: {{"skills":["..."], "rationale":"..."}}. Gợi ý tối đa 10 kỹ năng phù hợp với vị trí "{target_role}" bằng {language}. '
                f"Kỹ năng hiện có: {current_skills}. Context công việc: {job_context}. Chỉ đề xuất kỹ năng liên quan, không khẳng định người dùng đã có kỹ năng đó."
            ),
            response_model=CvSkillsSuggestionResponse,
        )


cv_suggestion_service = CvSuggestionService()

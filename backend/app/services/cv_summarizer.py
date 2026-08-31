"""CV Summarizer Service — summarizes a CV against a specific job posting.

Uses Deepseek to produce:
  - fit_points: Concrete points where the CV matches the job requirements.
  - questions: Topics to probe in an interview (gaps, ambiguities).
  - summary: A 2-3 sentence overall summary.

Retries up to 2 times if JSON parsing fails.
"""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.schemas.ai import CVSummarizeResponse
from app.services.ai_errors import normalize_ai_error
from app.services.deepseek_client import deepseek_client
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


class CVSummarizerService:
    def __init__(self):
        self.client = deepseek_client

    async def summarize(
        self,
        *,
        cv_text: str,
        job_description: str,
        db: Session | None = None,
    ) -> CVSummarizeResponse:
        system_prompt = get_system_prompt(AIFeature.SUMMARIZE_CV, db=db)
        user_prompt = (
            f"Mô tả vị trí: {job_description}\n"
            f"CV ứng viên: {cv_text}\n"
            f"Hãy tóm tắt điểm phù hợp và điểm cần hỏi thêm."
        )

        last_error: Exception | None = None

        for attempt in range(1 + MAX_RETRIES):
            try:
                response = await self.client.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=settings.LLM_MODEL,
                )

                content = response.get("choices", [])[0].get("message", {}).get("content", "")
                if not content:
                    raise ValueError("Empty response from Deepseek.")

                result = CVSummarizeResponse.model_validate_json(content)
                return result

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "CV summarize attempt %d/%d failed: %s",
                    attempt + 1, 1 + MAX_RETRIES, exc,
                )
                if attempt < MAX_RETRIES:
                    continue

        raise normalize_ai_error(last_error)


cv_summarizer_service = CVSummarizerService()

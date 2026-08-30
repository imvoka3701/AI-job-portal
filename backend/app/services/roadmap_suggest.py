"""Roadmap Suggestion Service — calls LLM API to suggest career roadmaps.

Retries up to 2 times if JSON parsing fails. Raises RuntimeError if all attempts fail.
"""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.schemas.ai import RoadmapResponse, RoadmapStep
from app.services.deepseek_client import deepseek_client
from app.services.ai_errors import normalize_ai_error
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


class RoadmapSuggestService:
    def __init__(self):
        self.client = deepseek_client

    async def suggest(
        self,
        *,
        resume_text: str,
        parsed_skills: list[str],
        target_role: str,
        db: Session | None = None,
    ) -> RoadmapResponse:
        system_prompt = get_system_prompt(AIFeature.ROADMAP, db=db)

        user_prompt = (
            f"CV hiện tại của tôi: {resume_text}\n"
            f"Kỹ năng hiện có: {', '.join(parsed_skills)}\n"
            f"Vai trò mục tiêu: {target_role}\n\n"
            f"Hãy tạo một lộ trình sự nghiệp chi tiết để tôi đạt được vai trò mục tiêu."
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

                response_content = response.get("choices", [])[0].get("message", {}).get("content")
                if not response_content:
                    raise ValueError("Empty response content from Deepseek.")

                roadmap_data = RoadmapResponse.model_validate_json(response_content)
                return roadmap_data

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Roadmap suggestion attempt %d/%d failed: %s",
                    attempt + 1,
                    1 + MAX_RETRIES,
                    exc,
                )
                if attempt < MAX_RETRIES:
                    continue

        raise normalize_ai_error(last_error)


roadmap_suggest_service = RoadmapSuggestService()

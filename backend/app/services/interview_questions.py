"""Interview Questions Service — generates targeted interview questions.

HR selects specific skills to assess. The LLM generates questions that are
focused on those exact skills, based on the JD and the candidate's CV.

Each question includes:
  - question: The actual question to ask.
  - purpose: What the interviewer is trying to evaluate.
  - skill_related: Which of the requested skills this targets.

Retries up to 2 times if JSON parsing fails.
"""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.schemas.ai import InterviewQuestionsResponse
from app.services.ai_errors import normalize_ai_error
from app.services.deepseek_client import deepseek_client
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)

MAX_RETRIES = 2

# NOTE: Prompt gốc đã được chuyển sang prompt_loader.py::HARDCODED_FALLBACK_PROMPTS[AIFeature.INTERVIEW_QUESTIONS]
# để làm fallback tập trung. Không cần định nghĩa lại ở đây.


class InterviewQuestionsService:
    def __init__(self):
        self.client = deepseek_client

    async def generate(
        self,
        *,
        cv_text: str,
        job_description: str,
        skills_to_assess: list[str],
        db: Session | None = None,
    ) -> InterviewQuestionsResponse:
        system_prompt = get_system_prompt(AIFeature.INTERVIEW_QUESTIONS, db=db)

        skills_list = ", ".join(skills_to_assess)
        user_prompt = (
            f"Mô tả vị trí tuyển dụng:\n{job_description}\n\n"
            f"CV ứng viên:\n{cv_text}\n\n"
            f"Kỹ năng cần đánh giá khi phỏng vấn: {skills_list}\n\n"
            f"Hãy tạo câu hỏi phỏng vấn cho TỪNG kỹ năng trong danh sách trên. "
            f"Tối thiểu 2 câu hỏi cho mỗi kỹ năng. "
            f"Mỗi câu hỏi phải kèm mục đích đánh giá (purpose) và tên kỹ năng (skill_related)."
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
                    feature=AIFeature.INTERVIEW_QUESTIONS,
                    db=db,
                )

                content = response.get("choices", [])[0].get("message", {}).get("content", "")
                if not content:
                    raise ValueError("Empty response from Deepseek.")

                result = InterviewQuestionsResponse.model_validate_json(content)
                return result

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Interview questions attempt %d/%d failed: %s",
                    attempt + 1, 1 + MAX_RETRIES, exc,
                )
                if attempt < MAX_RETRIES:
                    continue

        raise normalize_ai_error(last_error)


interview_questions_service = InterviewQuestionsService()

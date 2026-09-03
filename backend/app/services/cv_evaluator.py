"""CV Evaluator Service — calls LLM API to evaluate resume quality.

Retries up to 2 times if JSON parsing fails. Raises RuntimeError if all attempts fail.
"""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.schemas.ai import CVEvaluationResponse
from app.services.ai_errors import normalize_ai_error
from app.services.deepseek_client import deepseek_client
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


class CVEvaluatorService:
    def __init__(self):
        self.client = deepseek_client

    async def evaluate(
        self,
        *,
        resume_text: str,
        db: Session | None = None,
    ) -> CVEvaluationResponse:
        system_prompt = get_system_prompt(AIFeature.CV_EVALUATE, db=db)

        user_prompt = f"Hãy đánh giá CV sau:\n{resume_text}"

        last_error: Exception | None = None

        for attempt in range(1 + MAX_RETRIES):
            try:
                response = await self.client.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=settings.LLM_MODEL,
                    response_format={"type": "json_object"},
                    feature=AIFeature.CV_EVALUATE,
                    db=db,
                )

                response_content = response.get("choices", [])[0].get("message", {}).get("content")
                if not response_content:
                    raise ValueError("Empty response content from Deepseek.")

                evaluation_data = CVEvaluationResponse.model_validate_json(response_content)
                return evaluation_data

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "CV evaluation attempt %d/%d failed: %s",
                    attempt + 1,
                    1 + MAX_RETRIES,
                    exc,
                )
                if attempt < MAX_RETRIES:
                    continue

        raise normalize_ai_error(last_error)

    async def validate_is_cv(self, resume_text: str) -> bool:
        """Thực hiện kiểm tra nhanh xem văn bản có phải là CV hợp lệ không."""
        text_clean = resume_text.strip()
        # Heuristic: nếu văn bản quá ngắn (dưới 100 ký tự) thì không thể là CV hoàn chỉnh
        if len(text_clean) < 100:
            logger.info("CV validation rejected: text length too short (%d chars)", len(text_clean))
            return False

        system_prompt = (
            "Bạn là một hệ thống kiểm duyệt tài liệu tuyển dụng chuyên nghiệp. "
            "Nhiệm vụ của bạn là kiểm tra xem đoạn văn bản sau có phải là một hồ sơ xin việc (CV/Resume) thực thụ, có cấu trúc nội dung hay không.\n"
            "Tiêu chuẩn bắt buộc của một CV hợp lệ:\n"
            "- Phải thể hiện thông tin ứng viên (họ tên, học vấn, kinh nghiệm làm việc, hoặc kỹ năng chuyên môn chi tiết).\n"
            "- KHÔNG chấp nhận các đoạn văn bản cụt lủn chỉ có 1-2 câu sơ sài, văn bản rác, code ngẫu nhiên, hoặc tài liệu không liên quan.\n"
            "Chỉ trả lời chính xác duy nhất một từ: 'YES' nếu là CV hợp lệ, hoặc 'NO' nếu không phải CV hoặc quá cụt lủn."
        )

        # Chỉ lấy 2000 ký tự đầu tiên để kiểm tra cho nhanh
        user_prompt = f"Văn bản:\n{text_clean[:2000]}"

        try:
            response = await self.client.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=settings.LLM_MODEL,
                response_format=None,
            )
            response_content = (
                response.get("choices", [])[0].get("message", {}).get("content", "").strip().upper()
            )

            # Chỉ coi là hợp lệ nếu phản hồi có YES rõ ràng và KHÔNG chứa NO
            if "YES" in response_content and "NO" not in response_content:
                return True

            return False
        except Exception as exc:
            logger.warning("Failed to validate CV with LLM: %s", exc)
            raise normalize_ai_error(exc)


cv_evaluator_service = CVEvaluatorService()

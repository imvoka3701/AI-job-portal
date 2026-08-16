"""CV Evaluator Service — calls LLM API to evaluate resume quality.

Retries up to 2 times if JSON parsing fails. Raises RuntimeError if all attempts fail.
"""

import logging

from app.config import settings
from app.schemas.ai import CVEvaluationResponse
from app.services.deepseek_client import deepseek_client
from app.services.ai_errors import normalize_ai_error

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


class CVEvaluatorService:
    def __init__(self):
        self.client = deepseek_client

    async def evaluate(self, *, resume_text: str) -> CVEvaluationResponse:
        system_prompt = (
            "Bạn là một chuyên gia đánh giá CV. Hãy phân tích CV được cung cấp và đưa ra đánh giá toàn diện, bao gồm:\n"
            "- overall_score: Điểm tổng thể từ 0.0 đến 10.0.\n"
            "- summary: Tóm tắt ngắn gọn về điểm mạnh và điểm yếu của CV.\n"
            "- suggestions: Các gợi ý cụ thể để cải thiện CV.\n"
            "- skill_analysis: object với key là tên kỹ năng, value là điểm số từ 0.0 đến 10.0.\n"
            "QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ, không được thêm markdown hay text bên ngoài JSON."
        )

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
        """Thực hiện một cuộc gọi LLM nhanh để xác định xem văn bản có phải là CV không."""
        system_prompt = (
            "Bạn là một hệ thống kiểm duyệt tài liệu. "
            "Nhiệm vụ của bạn là kiểm tra xem đoạn văn bản sau đây có phải là một hồ sơ xin việc (CV/Resume) hợp lệ hay không. "
            "Chỉ trả lời chính xác 'YES' hoặc 'NO' (không có dấu câu hoặc văn bản nào khác)."
        )
        
        # Chỉ lấy 1500 ký tự đầu tiên để kiểm tra cho nhanh
        user_prompt = f"Văn bản:\n{resume_text[:1500]}"
        
        try:
            response = await self.client.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=settings.LLM_MODEL,
                response_format=None,
            )
            response_content = response.get("choices", [])[0].get("message", {}).get("content", "").strip().upper()
            
            # Nếu LLM trả lời rõ ràng là NO thì coi là không hợp lệ
            if "NO" in response_content and "YES" not in response_content:
                return False
                
            return True
        except Exception as exc:
            logger.warning("Failed to validate CV with LLM: %s", exc)
            raise normalize_ai_error(exc)


cv_evaluator_service = CVEvaluatorService()

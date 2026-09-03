"""CV Evaluator Service — calls LLM API to evaluate resume quality.

Retries up to 2 times if JSON parsing fails. Raises RuntimeError if all attempts fail.
"""

import json
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

    async def validate_cv_structure(self, resume_text: str) -> tuple[bool, str]:
        """Xác thực xem văn bản có tuân theo định dạng CV chuẩn trên thị trường hay không.

        Returns:
            (is_valid, message):
                is_valid = True nếu đúng format CV.
                is_valid = False kèm thông điệp giải thích lý do cụ thể và hướng dẫn người dùng.
        """
        text_clean = resume_text.strip()
        if len(text_clean) < 100:
            return (
                False,
                "Nội dung hồ sơ quá ngắn (dưới 100 ký tự). Vui lòng tải lên file CV hoàn chỉnh có thông tin cá nhân, kinh nghiệm và kỹ năng.",
            )

        # Heuristic format check: kiểm tra sự xuất hiện của các từ khóa section phổ biến trong CV
        cv_section_keywords = [
            "kinh nghiệm", "experience", "kinh nghiem", "làm việc", "work", "dự án", "project", "du an",
            "học vấn", "education", "hoc van", "đào tạo", "bằng cấp", "kỹ năng", "skill", "skills", "ky nang",
            "mục tiêu", "objective", "summary", "giới thiệu", "thông tin liên hệ", "contact", "email", "điện thoại"
        ]
        text_lower = text_clean.lower()
        matched_keywords = [kw for kw in cv_section_keywords if kw in text_lower]

        # Nếu hoàn toàn không có bất kỳ từ khóa chuyên mục CV nào
        if len(matched_keywords) < 2:
            return (
                False,
                "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường (thiếu các phần mục cơ bản: "
                "Thông tin cá nhân, Kinh nghiệm làm việc, Học vấn hoặc Kỹ năng). "
                "Vui lòng tải lên file CV hợp lệ hoặc sử dụng CV Builder để tạo CV chuẩn ATS.",
            )

        system_prompt = (
            "Bạn là một hệ thống AI thẩm định hồ sơ tuyển dụng chuyên nghiệp (B2B ATS Validator). "
            "Nhiệm vụ của bạn là nhận diện xem đoạn văn bản sau có tuân theo bất kỳ định dạng CV/Resume tiêu chuẩn nào trên thị trường tuyển dụng hay không.\n\n"
            "TIÊU CHÍ ĐỊNH DẠNG CV HỢP LỆ:\n"
            "- Phải có thông tin ứng viên (họ tên/chức danh/liên hệ) kết hợp với quá trình học vấn, lịch sử làm việc, hoặc kỹ năng chuyên môn.\n\n"
            "CÁC TRƯỜNG HỢP BẮT BUỘC COI LÀ KHÔNG HỢP LỆ (is_valid = false):\n"
            "- Văn bản tùy tiện, code lập trình, đề thi, bài viết kỹ thuật, hợp đồng, hóa đơn, bài báo, tài liệu hành chính.\n"
            "- Đoạn văn bản cụt lủn chỉ gồm vài gạch đầu dòng từ khóa rời rạc, không có thông tin ứng viên.\n"
            "- Bất kỳ nội dung nào không thể xác định là một bản hồ sơ ứng tuyển xin việc thực thụ.\n\n"
            "QUY ĐỊNH ĐẦU RA: Bắt buộc trả về đúng định dạng JSON:\n"
            "{\n"
            '  "is_valid": true hoặc false,\n'
            '  "reason": "Lý do súc tích bằng tiếng Việt nếu không hợp lệ (hướng dẫn cụ thể những gì đang thiếu), hoặc chuỗi rỗng nếu hợp lệ"\n'
            "}\n"
            "QUAN TRỌNG: Chỉ trả về duy nhất JSON hợp lệ, không có markdown hay bất kỳ văn bản nào bên ngoài."
        )

        user_prompt = f"Văn bản cần thẩm định:\n{text_clean[:2000]}"

        try:
            response = await self.client.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=settings.LLM_MODEL,
                response_format={"type": "json_object"},
            )
            content = response.get("choices", [])[0].get("message", {}).get("content", "").strip()
            data = json.loads(content)
            is_valid = bool(data.get("is_valid", False))
            reason = str(data.get("reason") or "").strip()

            if not is_valid:
                if not reason:
                    reason = (
                        "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường. "
                        "Vui lòng tải lên file CV hợp lệ có đầy đủ thông tin cá nhân, kinh nghiệm và kỹ năng."
                    )
                return False, reason

            return True, ""
        except Exception as exc:
            logger.warning("Failed to validate CV format with LLM: %s", exc)
            if len(matched_keywords) >= 3:
                return True, ""
            return (
                False,
                "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường. Vui lòng kiểm tra lại file CV của bạn.",
            )

    async def validate_is_cv(self, resume_text: str) -> bool:
        """Thực hiện kiểm tra nhanh xem văn bản có phải là CV hợp lệ không."""
        is_valid, reason = await self.validate_cv_structure(resume_text)
        self._last_reject_reason = reason
        return is_valid


cv_evaluator_service = CVEvaluatorService()

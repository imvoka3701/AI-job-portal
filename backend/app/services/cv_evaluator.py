"""CV Evaluator Service — calls LLM API to evaluate resume quality.

Retries up to 2 times if JSON parsing fails. Raises RuntimeError if all attempts fail.
"""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.core.llm_guard import clamp_text, parse_llm_json
from app.models.ai_call_log import AIFeature
from app.schemas.ai import CVEvaluationResponse
from app.services.ai_errors import normalize_ai_error
from app.services.cv_format_validator import validate_cv_heuristic
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
        from app.core.prompt_armor import sanitize_prompt_text

        system_prompt = get_system_prompt(AIFeature.CV_EVALUATE, db=db)
        sanitized_cv = sanitize_prompt_text(resume_text, max_length=15000)
        user_prompt = f"Hãy đánh giá CV sau:\n{sanitized_cv}"

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

    async def validate_cv_structure(
        self,
        resume_text: str,
        db: Session | None = None,
    ) -> tuple[bool, str]:
        """Xác thực 2 tầng xem văn bản có tuân theo định dạng CV chuẩn trên thị trường hay không.

        Tầng 1: Heuristic regex liên hệ (Email/SĐT) + từ khóa chuyên môn (0 cost, offline).
        Tầng 2: LLM DeepSeek phân tích ngữ nghĩa chuyên sâu nếu qua Tầng 1.

        Returns:
            (is_valid, message):
                is_valid = True nếu đúng format CV.
                is_valid = False kèm thông điệp giải thích lý do cụ thể và hướng dẫn người dùng.
        """
        # ── TẦNG 0: Prompt Armor security check (chống Prompt Injection trong CV) ──
        from app.core.prompt_armor import detect_prompt_injection

        is_injection, threat_type = detect_prompt_injection(resume_text)
        if is_injection:
            logger.warning("Prompt injection detected in CV text: threat=%s", threat_type)
            return (
                False,
                "Hồ sơ chứa chỉ thị can thiệp bất hợp pháp hoặc câu lệnh độc hại. "
                "Vui lòng tải lên CV ứng tuyển thực tế.",
            )

        # ── TẦNG 1: Heuristic fast-check (không tốn token AI) ────────────────
        heuristic_result = validate_cv_heuristic(resume_text)
        if not heuristic_result.is_valid:
            logger.info("CV rejected at Tier 1 heuristic: %s", heuristic_result.reason)
            return False, heuristic_result.reason

        text_clean = clamp_text(resume_text, max_chars=4000)

        # ── TẦNG 2: LLM structured format validation ────────────────────────
        system_prompt = (
            "Bạn là Giám đốc Tuyển dụng và Hệ thống AI Thẩm định Hồ sơ Ứng tuyển B2B (Enterprise ATS Validator). "
            "Nhiệm vụ tối thượng của bạn là phân tích xem đoạn văn bản được cung cấp có phải là một BẢN HỒ SƠ ỨNG TUYỂN XIN VIỆC (CV / Resume) hợp lệ của một cá nhân hay không, "
            "nhằm loại bỏ hoàn toàn các tài liệu không hợp lệ (hóa đơn, bài báo nghiên cứu, tài liệu kỹ thuật, hợp đồng, biên lai...).\n\n"
            "TIÊU CHÍ BẮT BUỘC CỦA MỘT CV HỢP LỆ (Dựa trên chuẩn ATS và TopCV/LinkedIn):\n"
            "1. Danh tính cá nhân ứng viên: Phải có họ tên người cụ thể kèm thông tin liên hệ và/hoặc chức danh mục tiêu ứng tuyển.\n"
            "2. Mục đích ứng tuyển xin việc: Văn bản phải thể hiện rõ mục đích giới thiệu năng lực bản thân của một cá nhân để xin việc.\n"
            "3. Lịch sử chuyên môn & Dòng thời gian: Phải có quá trình học vấn (trường lớp/bằng cấp) HOẶC lịch sử kinh nghiệm làm việc (công ty/vị trí/dự án) kèm kỹ năng.\n\n"
            "CÁC TRƯỜNG HỢP BẮT BUỘC TỪ CHỐI (is_valid = false):\n"
            "- Hóa đơn giá trị gia tăng, biên lai thu tiền, thông báo cước dịch vụ.\n"
            "- Bài báo nghiên cứu khoa học, tài liệu học thuật, luận văn tốt nghiệp.\n"
            "- Hợp đồng kinh tế, hợp đồng đào tạo, biên bản bàn giao, thỏa thuận dịch vụ.\n"
            "- Tài liệu đặc tả kỹ thuật phần mềm, hướng dẫn sử dụng, checklist dự án, mã nguồn lập trình.\n"
            "- Bất kỳ tài liệu nào không phải là hồ sơ xin việc của một ứng viên cá nhân.\n\n"
            "QUY ĐỊNH ĐẦU RA (Bắt buộc trả về đúng định dạng JSON duy nhất):\n"
            "{\n"
            '  "is_valid": true hoặc false,\n'
            '  "detected_document_type": "cv" | "invoice" | "academic_paper" | "contract" | "technical_doc" | "other",\n'
            '  "reason": "Lý do súc tích bằng tiếng Việt nêu rõ loại tài liệu phát hiện và phần thông tin CV đang thiếu (chuỗi rỗng nếu là CV hợp lệ)"\n'
            "}\n"
            "QUAN TRỌNG: Chỉ trả về duy nhất JSON hợp lệ, không có markdown hay bất kỳ văn bản nào bên ngoài."
        )

        user_prompt = f"Văn bản cần thẩm định:\n{text_clean[:4000]}"

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
            content = response.get("choices", [])[0].get("message", {}).get("content", "").strip()
            data = parse_llm_json(content, default={"is_valid": False, "reason": "Không thể phân tích phản hồi từ AI."})
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
            # Offline fallback: requires contact + timeline + at least 3 professional sections to qualify
            if heuristic_result.has_timeline and len(heuristic_result.detected_groups) >= 3:
                return True, ""
            return (
                False,
                "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường. Vui lòng kiểm tra lại file CV của bạn.",
            )

    async def validate_is_cv(
        self,
        resume_text: str,
        db: Session | None = None,
    ) -> tuple[bool, str]:
        """Thực hiện kiểm tra xem văn bản có phải là CV hợp lệ không (2 tầng).

        Returns:
            (is_valid, reason): Tuple trực tiếp, loại bỏ biến trạng thái singleton.
        """
        return await self.validate_cv_structure(resume_text, db=db)


cv_evaluator_service = CVEvaluatorService()

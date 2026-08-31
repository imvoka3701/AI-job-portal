"""Email Generator Service — drafts professional Vietnamese emails for HR.

Generates three types:
  - invite: Interview invitation with date/time/location placeholders.
  - reject: Polite rejection — NO specific reasons, maintains goodwill.
  - offer: Job offer congratulations with next-step guidance.

All outputs are DRAFTS — HR must review and send manually.
Retries up to 2 times if JSON parsing fails.

ARCHITECTURE NOTE — Persona + Hardcoded rules:
  The system prompt sent to Deepseek = Persona (from DB) + EMAIL_TYPE_SYSTEM_RULES (hardcoded).
  - Persona: editable by Admin via UI (/admin/ai/prompts). Controls tone, language, style.
  - EMAIL_TYPE_SYSTEM_RULES: NOT in DB, NOT editable via Admin UI. Hardcoded in this file.
    Ensures type-specific rules — especially reject safety constraints (no reasons, no
    discriminatory language) — are ALWAYS in system prompt position and cannot be removed
    by Admin accidentally. This is intentional design, not a missing feature.
"""

import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.schemas.ai import GenerateEmailResponse
from app.services.ai_errors import normalize_ai_error
from app.services.deepseek_client import deepseek_client
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)

MAX_RETRIES = 2

# NOTE: INVITE_SYSTEM_PROMPT, REJECT_SYSTEM_PROMPT, OFFER_SYSTEM_PROMPT gốc đã được
# tách thành Persona chung (DB) + EMAIL_TYPE_SYSTEM_RULES bên dưới (hardcode).

# ── Type-specific rules — HARDCODED, luôn gắn vào system prompt ──────────────────
# QUAN TRỌNG: "reject" chứa ràng buộc pháp lý — KHÔNG được chuyển vào DB hay user_prompt.
EMAIL_TYPE_SYSTEM_RULES: dict[str, str] = {
    "invite": (
        "\n\nLoại email: MỜI PHỎNG VẤN.\n"
        "- Đề cập tên ứng viên và vị trí ứng tuyển từ dữ liệu được cung cấp.\n"
        "- Dùng placeholder [Ngày giờ], [Địa điểm/Hình thức] — KHÔNG tự bịa thời gian cụ thể.\n"
        "- Kết thúc bằng lời nhắn mong phản hồi xác nhận."
    ),
    "reject": (
        "\n\nLoại email: TỪ CHỐI ỨNG VIÊN.\n"
        "RÀNG BUỘC AN TOÀN — BẮT BUỘC TUYỆT ĐỐI:\n"
        "- KHÔNG nêu lý do cụ thể nào (tránh rủi ro pháp lý về phân biệt đối xử).\n"
        "- KHÔNG đề cập đến tuổi tác, giới tính, dân tộc, tôn giáo, tình trạng hôn nhân, "
        "hoặc bất kỳ đặc điểm cá nhân nào.\n"
        "- Giữ thiện chí, mời ứng tuyển các vị trí phù hợp trong tương lai."
    ),
    "offer": (
        "\n\nLoại email: THÔNG BÁO TRÚNG TUYỂN.\n"
        "- Giọng điệu chúc mừng, phấn khởi, chuyên nghiệp.\n"
        "- Đề cập tên ứng viên và vị trí trúng tuyển.\n"
        "- Dùng placeholder [Ngày bắt đầu], [Mức lương và chế độ] — KHÔNG tự bịa số liệu.\n"
        "- Hướng dẫn bước tiếp theo: xác nhận nhận việc, liên hệ HR, chuẩn bị hồ sơ."
    ),
}


class EmailGeneratorService:
    def __init__(self):
        self.client = deepseek_client

    async def generate(
        self,
        *,
        email_type: str,
        candidate_name: str,
        job_title: str,
        company_name: str,
        cv_summary: str | None = None,
        db: Session | None = None,
    ) -> GenerateEmailResponse:
        if email_type not in EMAIL_TYPE_SYSTEM_RULES:
            raise ValueError(
                f"Invalid email_type: {email_type}. "
                f"Must be one of: {list(EMAIL_TYPE_SYSTEM_RULES.keys())}"
            )

        # Persona từ DB (Admin chỉnh được) + type rules hardcode (không qua Admin UI)
        # Cả hai đều nằm trong system prompt — đảm bảo ràng buộc reject có authority cao nhất.
        persona = get_system_prompt(AIFeature.GENERATE_EMAIL, db=db)
        effective_system = persona + EMAIL_TYPE_SYSTEM_RULES[email_type]

        user_prompt = (
            f"Thông tin:\n"
            f"- Ứng viên: {candidate_name}\n"
            f"- Vị trí ứng tuyển: {job_title}\n"
            f"- Công ty: {company_name}\n"
        )
        if cv_summary:
            user_prompt += f"- Tóm tắt hồ sơ ứng viên: {cv_summary}\n"

        user_prompt += f"\nHãy soạn email loại '{email_type}' cho ứng viên này."

        last_error: Exception | None = None

        for attempt in range(1 + MAX_RETRIES):
            try:
                response = await self.client.create_chat_completion(
                    messages=[
                        {"role": "system", "content": effective_system},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=settings.LLM_MODEL,
                    feature=AIFeature.GENERATE_EMAIL,
                    db=db,
                )

                content = response.get("choices", [])[0].get("message", {}).get("content", "")
                if not content:
                    raise ValueError("Empty response from Deepseek.")

                result = GenerateEmailResponse.model_validate_json(content)
                return result

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Email generation attempt %d/%d failed: %s",
                    attempt + 1, 1 + MAX_RETRIES, exc,
                )
                if attempt < MAX_RETRIES:
                    continue

        raise normalize_ai_error(last_error)


email_generator_service = EmailGeneratorService()

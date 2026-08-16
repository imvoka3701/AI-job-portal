"""Email Generator Service — drafts professional Vietnamese emails for HR.

Generates three types:
  - invite: Interview invitation with date/time/location placeholders.
  - reject: Polite rejection — NO specific reasons, maintains goodwill.
  - offer: Job offer congratulations with next-step guidance.

All outputs are DRAFTS — HR must review and send manually.
Retries up to 2 times if JSON parsing fails.
"""

import logging

from app.config import settings
from app.schemas.ai import GenerateEmailResponse
from app.services.deepseek_client import deepseek_client
from app.services.ai_errors import normalize_ai_error

logger = logging.getLogger(__name__)

MAX_RETRIES = 2

INVITE_SYSTEM_PROMPT = (
    "Bạn là trợ lý nhân sự chuyên nghiệp. Hãy soạn email mời phỏng vấn bằng tiếng Việt.\n\n"
    "Yêu cầu:\n"
    "- Xưng hô 'bạn' với ứng viên (trung tính, không đoán giới tính từ tên).\n"
    "- Giọng điệu chuyên nghiệp, thân thiện.\n"
    "- Đề cập tên ứng viên và vị trí ứng tuyển từ dữ liệu được cung cấp.\n"
    "- Dùng placeholder [Ngày giờ], [Địa điểm/Hình thức] cho thông tin lịch phỏng vấn (KHÔNG tự bịa thời gian cụ thể).\n"
    "- Kết thúc với lời nhắn mong phản hồi xác nhận.\n\n"
    "QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ với cấu trúc:\n"
    '{"subject": "tiêu đề email", "body": "nội dung email (có thể nhiều dòng, dùng \\\\n ngăn cách)"}'
)

REJECT_SYSTEM_PROMPT = (
    "Bạn là trợ lý nhân sự chuyên nghiệp. Hãy soạn email từ chối ứng viên bằng tiếng Việt.\n\n"
    "Yêu cầu TUYỆT ĐỐI:\n"
    "- Xưng hô 'bạn' với ứng viên (trung tính, không đoán giới tính từ tên).\n"
    "- KHÔNG nêu lý do cụ thể nào (tránh rủi ro pháp lý về phân biệt đối xử).\n"
    "- KHÔNG đề cập đến tuổi tác, giới tính, dân tộc, tôn giáo, tình trạng hôn nhân, hoặc bất kỳ đặc điểm cá nhân nào.\n"
    "- Giọng điệu lịch sự, tôn trọng, giữ thiện chí.\n"
    "- Bày tỏ mong muốn giữ liên lạc và mời ứng tuyển các vị trí phù hợp trong tương lai.\n"
    "- Đề cập tên ứng viên và vị trí đã ứng tuyển.\n\n"
    "QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ với cấu trúc:\n"
    '{"subject": "tiêu đề email", "body": "nội dung email (có thể nhiều dòng, dùng \\\\n ngăn cách)"}'
)

OFFER_SYSTEM_PROMPT = (
    "Bạn là trợ lý nhân sự chuyên nghiệp. Hãy soạn email thông báo trúng tuyển bằng tiếng Việt.\n\n"
    "Yêu cầu:\n"
    "- Xưng hô 'bạn' với ứng viên (trung tính, không đoán giới tính từ tên).\n"
    "- Giọng điệu chúc mừng, phấn khởi, chuyên nghiệp.\n"
    "- Đề cập tên ứng viên và vị trí trúng tuyển.\n"
    "- Dùng placeholder [Ngày bắt đầu], [Mức lương và chế độ] cho thông tin cụ thể (KHÔNG tự bịa số liệu).\n"
    "- Hướng dẫn các bước tiếp theo: xác nhận nhận việc, liên hệ HR, chuẩn bị hồ sơ.\n"
    "- Kết thúc với lời chúc thành công.\n\n"
    "QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ với cấu trúc:\n"
    '{"subject": "tiêu đề email", "body": "nội dung email (có thể nhiều dòng, dùng \\\\n ngăn cách)"}'
)

TYPE_PROMPTS = {
    "invite": INVITE_SYSTEM_PROMPT,
    "reject": REJECT_SYSTEM_PROMPT,
    "offer": OFFER_SYSTEM_PROMPT,
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
    ) -> GenerateEmailResponse:
        if email_type not in TYPE_PROMPTS:
            raise ValueError(f"Invalid email_type: {email_type}. Must be one of: {list(TYPE_PROMPTS.keys())}")

        system_prompt = TYPE_PROMPTS[email_type]

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
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=settings.LLM_MODEL,
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

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

from app.config import settings
from app.schemas.ai import InterviewQuestionsResponse
from app.services.deepseek_client import deepseek_client
from app.services.ai_errors import normalize_ai_error

logger = logging.getLogger(__name__)

MAX_RETRIES = 2

SYSTEM_PROMPT = (
    "Bạn là chuyên gia phỏng vấn kỹ thuật giàu kinh nghiệm. "
    "Nhiệm vụ của bạn là tạo câu hỏi phỏng vấn CHUYÊN SÂU, bám sát vào các kỹ năng cụ thể được yêu cầu.\n\n"
    "Nguyên tắc:\n"
    "- Mỗi câu hỏi phải tập trung vào MỘT kỹ năng cụ thể trong danh sách skills_to_assess.\n"
    "- Câu hỏi phải kiểm tra được năng lực THỰC TẾ (không hỏi lý thuyết thuộc lòng).\n"
    "- Dựa vào CV để điều chỉnh độ khó: nếu CV thể hiện kinh nghiệm với kỹ năng đó → hỏi sâu hơn. "
    "Nếu CV không đề cập đến kỹ năng đó → hỏi để đánh giá mức độ hiểu biết cơ bản.\n"
    "- purpose phải nêu rõ mục đích: câu hỏi này nhằm kiểm tra ĐIỀU GÌ.\n\n"
    "Trả về JSON có cấu trúc:\n"
    '{"questions": [\n'
    '  {"question": "nội dung câu hỏi",\n'
    '   "purpose": "mục đích đánh giá (1 câu ngắn gọn)",\n'
    '   "skill_related": "tên kỹ năng trong danh sách"}\n'
    ']}\n'
    "QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ, không thêm markdown hoặc text bên ngoài JSON."
)


class InterviewQuestionsService:
    def __init__(self):
        self.client = deepseek_client

    async def generate(
        self,
        *,
        cv_text: str,
        job_description: str,
        skills_to_assess: list[str],
    ) -> InterviewQuestionsResponse:
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
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=settings.LLM_MODEL,
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

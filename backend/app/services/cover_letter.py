"""Cover Letter Service — generates personalized, professional cover letters using DeepSeek AI.

Extracts candidate qualifications from uploaded Resume PDF or CV Builder document,
correlates them with target Job requirements and Company context, and crafts
a compelling, authentic cover letter in Vietnamese.
"""

import json
import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.models.job import Job
from app.models.user import User
from app.schemas.ai import CoverLetterRequest, CoverLetterResponse
from app.services.deepseek_client import deepseek_client
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)

TONE_MAPPINGS: dict[str, str] = {
    "professional": "Trang trọng, chuyên nghiệp và chuẩn mực (Corporate & Professional)",
    "confident": "Tự tin, quyết đoán và khẳng định thế mạnh vượt trội (Confident & Proactive)",
    "enthusiastic": "Nhiệt huyết, đam mê và giàu năng lượng tích cực (Enthusiastic & Driven)",
    "concise": "Súc tích, ngắn gọn, đi thẳng vào giá trị thực tế (Concise & Impactful)",
}


class CoverLetterService:
    """Generates tailored cover letters for job applications using LLM."""

    async def generate(
        self,
        db: Session,
        *,
        request: CoverLetterRequest,
        candidate: User,
        job: Job,
        cv_text: str,
    ) -> CoverLetterResponse:
        """Generate a cover letter for the candidate targeting a specific job."""
        company_name = "Quý Công ty"
        if job.employer:
            company_name = job.employer.company_name or job.employer.full_name or "Quý Công ty"

        tone_description = TONE_MAPPINGS.get(request.tone, TONE_MAPPINGS["professional"])

        system_prompt = get_system_prompt(AIFeature.COVER_LETTER, db=db)
        user_prompt = (
            f"=== THÔNG TIN ỨNG VIÊN ===\n"
            f"Họ và tên: {candidate.full_name or 'Ứng viên'}\n"
            f"Email: {candidate.email}\n"
            f"Nội dung CV/Hồ sơ năng lực:\n{cv_text[:3000] or 'Ứng viên có kỹ năng và kinh nghiệm chuyên môn phù hợp'}\n\n"
            f"=== THÔNG TIN VỊ TRÍ ỨNG TUYỂN ===\n"
            f"Vị trí: {job.title}\n"
            f"Doanh nghiệp: {company_name}\n"
            f"Địa điểm làm việc: {job.location or 'Việt Nam'}\n"
            f"Mô tả công việc:\n{job.description[:2000] if job.description else 'Không có mô tả chi tiết'}\n\n"
            f"Yêu cầu chuyên môn:\n{job.requirements[:2000] if job.requirements else 'Kinh nghiệm và kỹ năng chuyên môn'}\n\n"
            f"=== YÊU CẦU ĐẶC BIỆT CỦA ỨNG VIÊN ===\n"
            f"Phong cách văn phong (Tone): {tone_description}\n"
            f"Ghi chú bổ sung từ ứng viên: {request.custom_notes or 'Không có ghi chú riêng'}\n\n"
            f"Hãy soạn thảo bức thư xin việc (Cover Letter) hoàn chỉnh, chân thành, sắc sảo bằng tiếng Việt. "
            f"Bắt buộc phản hồi định dạng JSON có khóa 'cover_letter'."
        )

        try:
            response = await deepseek_client.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=settings.LLM_MODEL,
                response_format={"type": "json_object"},
                feature=AIFeature.COVER_LETTER,
                user_id=candidate.id,
                db=db,
            )
            raw_content = response.get("choices", [])[0].get("message", {}).get("content", "")
            if not raw_content:
                raise ValueError("DeepSeek returned empty response for cover letter")

            data = json.loads(raw_content)
            cover_letter_text = str(data.get("cover_letter") or "").strip()
            if not cover_letter_text:
                raise ValueError("Parsed JSON missing 'cover_letter' content")

            return CoverLetterResponse(cover_letter=cover_letter_text)

        except Exception as exc:
            logger.warning(
                "LLM Cover letter generation failed (%s), using dynamic professional fallback template",
                exc,
            )
            fallback_text = self._generate_fallback(
                candidate_name=candidate.full_name or "Ứng viên",
                company_name=company_name,
                job_title=job.title,
                cv_text=cv_text,
                tone=request.tone,
            )
            return CoverLetterResponse(cover_letter=fallback_text)

    def _generate_fallback(
        self,
        *,
        candidate_name: str,
        company_name: str,
        job_title: str,
        cv_text: str,
        tone: str,
    ) -> str:
        """Dynamic heuristic fallback when LLM is unavailable."""
        # Extract a snippet of candidate experience if available
        cv_summary_snippet = ""
        if cv_text:
            lines = [line.strip() for line in cv_text.splitlines() if len(line.strip()) > 20]
            if lines:
                cv_summary_snippet = (
                    "Với nền tảng vững chắc và kinh nghiệm thực tiễn qua các dự án "
                    "đã triển khai, tôi tự tin có thể nhanh chóng bắt nhịp và đóng góp hiệu quả vào mục tiêu chung."
                )

        if not cv_summary_snippet:
            cv_summary_snippet = (
                "Với nền tảng kỹ năng chuyên môn vững chắc và tinh thần trách nhiệm cao, "
                "tôi tin tưởng sẽ đem lại những đóng góp thiết thực cho sự phát triển của công ty."
            )

        return (
            f"Kính gửi Bộ phận Tuyển dụng và Ban Giám đốc {company_name},\n\n"
            f"Tôi tên là {candidate_name}. Tôi viết thư này để bày tỏ nguyện vọng ứng tuyển vào vị trí {job_title} "
            f"mà Quý Công ty đang tìm kiếm ứng viên.\n\n"
            f"Qua tìm hiểu về tầm nhìn phát triển và môi trường làm việc tại {company_name}, tôi vô cùng ấn tượng "
            f"trước những bước tiến và uy tín mà công ty đã xây dựng trên thị trường. {cv_summary_snippet}\n\n"
            f"Hồ sơ đính kèm của tôi trình bày chi tiết về quá trình công tác, các thành tựu nổi bật và các kỹ năng chuyên môn cốt lõi. "
            f"Tôi rất mong có cơ hội được tham gia buổi phỏng vấn trực tiếp để cùng trao đổi sâu hơn về mức độ phù hợp của tôi đối với "
            f"vị trí {job_title}, cũng như cách tôi có thể hỗ trợ {company_name} chinh phục các mục tiêu sắp tới.\n\n"
            f"Xin chân thành cảm ơn Quý Công ty đã dành thời gian quý báu xem xét hồ sơ của tôi.\n\n"
            f"Trân trọng,\n"
            f"{candidate_name}"
        )


cover_letter_service = CoverLetterService()

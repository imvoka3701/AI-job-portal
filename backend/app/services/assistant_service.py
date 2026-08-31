"""AI Assistant Copilot Service for JobPortal — 24/7 Diplomatic Customer Advisor & Retention Specialist."""

import json
import logging
import re
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.job import Job
from app.models.user import User
from app.schemas.assistant import (
    AssistantChatResponse,
    AssistantQuickSuggestion,
    ChatContext,
    ChatMessage,
    EmbeddedCard,
)
from app.services.deepseek_client import deepseek_client

logger = logging.getLogger(__name__)

DIPLOMATIC_SYSTEM_PROMPT = """Bạn là "JobPortal AI Advisor" — Cố vấn Tuyển dụng & Phát triển Sự nghiệp 24/7 cao cấp của nền tảng "AI Job Portal".

TÔN CHỈ & BẢN SẮC ỨNG XỬ (DIPLOMATIC PERSONA & IDENTITY):
1. TRUNG THỰC & ĐĨNH ĐẠC: Bạn là Trí tuệ Nhân tạo chuyên nghiệp, không giả danh con người một cách khiên cưỡng. Bạn giao tiếp với phong thái của một "Nhà Ngoại Giao Số" — ấm áp, thấu cảm, lịch thiệp, tôn trọng và sắc bén về chuyên môn nhân sự.
2. SỨ MỆNH KÉP:
   - Am tường 100% nghiệp vụ và công nghệ của AI Job Portal (AI Matching qua Vector pgvector, CV Builder 5 mẫu chuẩn ATS, bộ trắc nghiệm MBTI & MI 80 câu, hệ thống ATS phân quyền B2B).
   - Tư vấn giải pháp, tạo giá trị thực tế và GIỮ CHÂN KHÁCH HÀNG (Customer Retention & Value Delivery).

NGHIỆP VỤ ỨNG XỬ THEO 3 NHÓM ĐỐI TƯỢNG:
A. VỚI KHÁCH VÃNG LAI (GUEST / POTENTIAL CLIENTS):
   - Chào đón ân cần, gỡ bỏ sự e ngại ban đầu.
   - Nhấn mạnh vào giá trị trải nghiệm miễn phí: làm test MBTI/MI 0 đồng, tạo CV chuẩn ATS trực tuyến không giới hạn.
   - Khéo léo mời đăng ký tài khoản để lưu trữ dữ liệu lâu dài chỉ với 30 giây (không chèo kéo, luôn tôn trọng quyền lựa chọn).

B. VỚI ỨNG VIÊN (CANDIDATE / JOB SEEKERS):
   - Đóng vai trò như Cố vấn Sự nghiệp (Career Mentor): thấu hiểu nỗi lo rớt CV, thiếu kinh nghiệm, hoặc bế tắc tìm việc.
   - Hướng dẫn cụ thể: tối ưu từ khóa ATS, mẹo đàm phán lương khéo léo, bí quyết trả lời phỏng vấn theo phương pháp STAR.
   - Trích dẫn công việc thực tế đang mở trên sàn để ứng viên tự tin nộp hồ sơ.

C. VỚI NHÀ TUYỂN DỤNG & DOANH NGHIỆP (EMPLOYER / ENTERPRISE):
   - Giao tiếp với vị thế đối tác B2B (HR Tech Consultant): thấu hiểu nỗi đau chi phí tuyển dụng cao, mất thời gian lọc CV rác.
   - Hướng dẫn tận tình: viết JD chuẩn SEO & thu hút nhân tài, sử dụng hệ thống ATS phân quyền 5 cấp độ (Owner, HR, Trưởng bộ phận, PV, Viewer), chấm điểm AI Match tự động.
   - Giới thiệu trải nghiệm Sandbox và các gói dịch vụ linh hoạt (Khởi nghiệp, Tăng trưởng, Doanh nghiệp).

NGHỆ THUẬT NGOẠI GIAO TRƯỚC TÌNH HUỐNG HÓC BÚA:
- Khi bị so sánh với nền tảng khác (TopCV, VietnamWorks, LinkedIn): Công nhận điểm mạnh của đối thủ một cách lịch thiệp, sau đó chỉ ra thế mạnh độc bản của AI Job Portal (AI Matching sâu bằng vector embedding ngữ nghĩa, tích hợp trắc nghiệm tâm lý hướng nghiệp MBTI/MI chuẩn khoa học).
- Khi khách hàng phàn nàn / chưa hài lòng: Lắng nghe chân thành, không tranh cãi, không đổ lỗi, đưa ra giải pháp khắc phục ngay lập tức và ghi nhận phản hồi để nâng cấp.
- Khi gặp câu hỏi đùa cợt / ngoài lề: Đối đáp hóm hỉnh, thông minh, sau đó khéo léo dẫn dắt câu chuyện quay lại chủ đề công việc và phát triển sự nghiệp.

THÔNG TIN NGƯỜI DÙNG & NGỮ CẢNH HIỆN TẠI:
- Vai trò người dùng: {role_desc}
- Trang đang xem: {current_path}
{job_context}
{candidate_context}

DANH SÁCH VIỆC LÀM THỰC TẾ ĐANG MỞ TRÊN SÀN (NẾU CÓ):
{jobs_data}

HỆ SINH THÁI CÔNG CỤ CỦA NỀN TẢNG:
1. CV Builder (/cv-builder): 5 template chuẩn quốc tế, tự động lưu, AI gợi ý kỹ năng.
2. Trắc nghiệm MBTI (/tools/mbti): 40 câu hỏi phân tích 4 nhóm tính cách và gợi ý việc làm.
3. Trắc nghiệm Đa trí tuệ MI (/tools/mi): 40 câu hỏi phân tích 8 loại hình thông minh.
4. Lịch sử bài test (/tools/assessments/history).
5. Khám phá việc làm (/jobs).
6. Cổng Nhà tuyển dụng (/employer và /employer/dashboard).

QUY CÁCH PHẢN HỒI:
- Trình bày định dạng Markdown đẹp mắt, có cấu trúc: [Lời chào & Thấu cảm] -> [Giải pháp / Lời khuyên chuyên môn] -> [Hành động tiếp theo / Thẻ liên kết] -> [Câu hỏi mở duyên dáng].
- BẮT BUỘC TRẢ VỀ JSON THEO SCHEMA SAU:
{{
  "reply": "Nội dung phản hồi chi tiết bằng Markdown...",
  "suggested_cards": [
    {{
      "card_type": "job" hoặc "tool" hoặc "action",
      "title": "Tiêu đề thẻ",
      "subtitle": "Mô tả phụ hoặc mức lương / địa điểm",
      "url": "Đường dẫn URL liên quan (ví dụ: /jobs/12 hoặc /tools/mbti)",
      "meta": {{ "key": "value" }}
    }}
  ],
  "suggested_followups": [
    "Câu hỏi gợi ý thông minh 1",
    "Câu hỏi gợi ý thông minh 2",
    "Câu hỏi gợi ý thông minh 3"
  ]
}}
"""


def _get_relevant_jobs(db: Session, query_text: str, limit: int = 4) -> List[Job]:
    """Search for relevant active jobs in database based on user query keywords."""
    try:
        keywords = [
            k.strip() for k in re.findall(r"[\w\+]+", query_text.lower()) if len(k.strip()) > 2
        ]
        if not keywords:
            return db.scalars(
                select(Job).where(Job.is_active.is_(True)).order_by(Job.id.desc()).limit(limit)
            ).all()

        filters = [Job.is_active.is_(True)]
        keyword_conditions = []
        for kw in keywords[:4]:
            keyword_conditions.append(Job.title.ilike(f"%{kw}%"))
            keyword_conditions.append(Job.description.ilike(f"%{kw}%"))
            keyword_conditions.append(Job.location.ilike(f"%{kw}%"))

        if keyword_conditions:
            filters.append(or_(*keyword_conditions))

        stmt = select(Job).where(*filters).order_by(Job.id.desc()).limit(limit)
        jobs = db.scalars(stmt).all()
        if not jobs:
            jobs = db.scalars(
                select(Job).where(Job.is_active.is_(True)).order_by(Job.id.desc()).limit(limit)
            ).all()
        return jobs
    except Exception as exc:
        logger.warning(f"Error fetching jobs for assistant: {exc}")
        return []


class AssistantService:
    async def process_chat(
        self,
        messages: List[ChatMessage],
        context: Optional[ChatContext],
        current_user: Optional[User],
        db: Session,
    ) -> AssistantChatResponse:
        """Process chat message with diplomatic persona & contextual knowledge."""
        last_user_message = next((m.content for m in reversed(messages) if m.role == "user"), "")

        role = (
            context.role
            if context and context.role
            else (current_user.role if current_user else "guest")
        )
        role_map = {
            "candidate": "Ứng viên tìm việc (Candidate)",
            "employer": "Nhà tuyển dụng / Đại diện Doanh nghiệp (Employer)",
            "admin": "Quản trị viên hệ thống (Admin)",
            "guest": "Khách vãng lai quan tâm đến nền tảng (Guest)",
        }
        role_desc = role_map.get(role, "Người dùng hệ thống")

        current_path = context.current_path if context else "/"
        job_context = ""
        if context and context.selected_job_id:
            job = db.get(Job, context.selected_job_id)
            if job:
                job_context = f"- Đang quan tâm công việc ID #{job.id}: {job.title} ({job.location or 'Toàn quốc'}), Lương: {job.salary_min or 'Thoả thuận'} - {job.salary_max or 'Thoả thuận'} triệu VNĐ."

        candidate_context = ""
        if current_user and current_user.role == "candidate":
            candidate_context = (
                f"- Tên ứng viên: {current_user.full_name}, Email: {current_user.email}."
            )

        relevant_jobs = _get_relevant_jobs(db, last_user_message, limit=4)
        jobs_data_lines = []
        for j in relevant_jobs:
            jobs_data_lines.append(
                f"- [ID #{j.id}] {j.title} | Địa điểm: {j.location or 'Toàn quốc'} | Loại: {j.job_type.value} | Lương: {j.salary_min or 'Thoả thuận'}-{j.salary_max or 'Thoả thuận'} triệu VNĐ | Link: /jobs/{j.id}"
            )
        jobs_data = (
            "\n".join(jobs_data_lines)
            if jobs_data_lines
            else "Hiện không có tin tuyển dụng nào trực tiếp phù hợp."
        )

        system_prompt = DIPLOMATIC_SYSTEM_PROMPT.format(
            role_desc=role_desc,
            current_path=current_path,
            job_context=job_context,
            candidate_context=candidate_context,
            jobs_data=jobs_data,
        )

        payload_messages = [{"role": "system", "content": system_prompt}]
        for m in messages[-8:]:
            payload_messages.append({"role": m.role, "content": m.content})

        try:
            raw_response = await deepseek_client.create_chat_completion(
                messages=payload_messages,
                model=settings.LLM_MODEL,
                response_format={"type": "json_object"},
            )
            content_str = raw_response["choices"][0]["message"]["content"]
            parsed_data = json.loads(content_str)

            reply = parsed_data.get("reply", "Tôi có thể hỗ trợ gì thêm cho bạn?")
            suggested_cards_raw = parsed_data.get("suggested_cards", [])
            suggested_followups = parsed_data.get("suggested_followups", [])

            cards: List[EmbeddedCard] = []
            for c in suggested_cards_raw:
                if isinstance(c, dict) and "title" in c and "url" in c:
                    cards.append(
                        EmbeddedCard(
                            card_type=c.get("card_type", "info"),
                            title=c.get("title", ""),
                            subtitle=c.get("subtitle"),
                            url=c.get("url", ""),
                            meta=c.get("meta"),
                        )
                    )

            # Auto-attach relevant cards if user asks about jobs or assessments
            if not cards and any(
                w in last_user_message.lower()
                for w in ["việc", "job", "tuyển", "lương", "react", "python", "dev"]
            ):
                for j in relevant_jobs[:2]:
                    cards.append(
                        EmbeddedCard(
                            card_type="job",
                            title=j.title,
                            subtitle=f"{j.location or 'Toàn quốc'} · {j.job_type.value.replace('_', '-').capitalize()}",
                            url=f"/jobs/{j.id}",
                            meta={
                                "id": j.id,
                                "salary": f"{j.salary_min or 'Thương lượng'} - {j.salary_max or ''}",
                            },
                        )
                    )
            elif not cards and any(
                w in last_user_message.lower()
                for w in ["mbti", "tính cách", "trí tuệ", "mi", "hướng nghiệp"]
            ):
                cards.append(
                    EmbeddedCard(
                        card_type="tool",
                        title="Trắc Nghiệm Tính Cách MBTI",
                        subtitle="40 câu hỏi chuẩn hóa · Khám phá thế mạnh tính cách",
                        url="/tools/mbti",
                    )
                )
                cards.append(
                    EmbeddedCard(
                        card_type="tool",
                        title="Trắc Nghiệm Đa Trí Tuệ MI",
                        subtitle="Phân loại 8 loại hình thông minh & nghề phù hợp",
                        url="/tools/mi",
                    )
                )
            elif not cards and any(
                w in last_user_message.lower() for w in ["cv", "hồ sơ", "resume", "mẫu cv"]
            ):
                cards.append(
                    EmbeddedCard(
                        card_type="tool",
                        title="Interactive CV Builder",
                        subtitle="5 mẫu chuẩn ATS quốc tế · AI gợi ý kỹ năng",
                        url="/cv-builder",
                    )
                )

            return AssistantChatResponse(
                reply=reply,
                suggested_cards=cards,
                suggested_followups=suggested_followups,
            )

        except Exception as e:
            logger.error(f"DeepSeek AI Diplomatic Assistant error: {e}")
            fallback_cards: List[EmbeddedCard] = []
            if relevant_jobs:
                for j in relevant_jobs[:2]:
                    fallback_cards.append(
                        EmbeddedCard(
                            card_type="job",
                            title=j.title,
                            subtitle=f"{j.location or 'Toàn quốc'}",
                            url=f"/jobs/{j.id}",
                        )
                    )

            fallback_reply = (
                "Kính chào bạn! Tôi là **JobPortal AI Advisor** — Cố vấn Tuyển dụng & Phát triển Sự nghiệp 24/7. "
                "Rất hân hạnh được đồng hành cùng bạn.\n\n"
                "Bạn đang quan tâm đến:\n"
                "- 🔍 **Tìm kiếm cơ hội việc làm** phù hợp với năng lực và mức lương kỳ vọng.\n"
                "- 📄 **Thiết kế CV chuẩn ATS** hoàn toàn miễn phí với [CV Builder](/cv-builder).\n"
                "- 🧭 **Khám phá bản thân** qua trắc nghiệm tính cách [MBTI](/tools/mbti) và [Đa trí tuệ MI](/tools/mi).\n"
                "- 🏢 **Giải pháp tuyển dụng tối ưu cho Doanh nghiệp** qua [Cổng Nhà tuyển dụng](/employer).\n\n"
                "Hãy chia sẻ mong muốn của bạn, tôi sẽ đưa ra giải pháp phù hợp nhất!"
            )

            return AssistantChatResponse(
                reply=fallback_reply,
                suggested_cards=fallback_cards,
                suggested_followups=[
                    "Gợi ý việc làm phù hợp với tôi",
                    "Hướng dẫn tạo CV chuẩn ATS",
                    "Khám phá bài test MBTI & MI",
                    "Tìm hiểu giải pháp tuyển dụng Doanh nghiệp",
                ],
            )

    def get_quick_suggestions(
        self, path: str, role: Optional[str]
    ) -> List[AssistantQuickSuggestion]:
        """Return context-sensitive diplomatic prompt chips."""
        if role == "employer" or "/employer" in path:
            return [
                AssistantQuickSuggestion(
                    label="Soạn thảo JD chuẩn thu hút",
                    prompt="Tôi muốn đăng tuyển vị trí mới. Bạn hãy giúp tôi soạn thảo một bản mô tả công việc (JD) thu hút và chuẩn SEO nhé.",
                    category="employer_jd",
                ),
                AssistantQuickSuggestion(
                    label="Bộ câu hỏi phỏng vấn kỹ thuật",
                    prompt="Gợi ý giúp tôi 5 câu hỏi phỏng vấn chuyên môn và tình huống thực tế để đánh giá năng lực ứng viên.",
                    category="interview",
                ),
                AssistantQuickSuggestion(
                    label="Tối ưu chi phí & thời gian tuyển",
                    prompt="Làm thế nào để hệ thống AI Matching và ATS của JobPortal giúp doanh nghiệp tôi tiết kiệm 70% thời gian tuyển dụng?",
                    category="general",
                ),
                AssistantQuickSuggestion(
                    label="Trải nghiệm Sandbox tuyển dụng",
                    prompt="Tôi muốn tìm hiểu các gói dịch vụ và trải nghiệm tính năng quản trị tuyển dụng của JobPortal.",
                    category="general",
                ),
            ]
        elif "/tools" in path or "mbti" in path or "mi" in path:
            return [
                AssistantQuickSuggestion(
                    label="Tại sao nên test MBTI trước khi tìm việc?",
                    prompt="Bài trắc nghiệm MBTI giúp tôi định vị thế mạnh và tìm kiếm môi trường văn hóa doanh nghiệp phù hợp như thế nào?",
                    category="tools",
                ),
                AssistantQuickSuggestion(
                    label="Ứng dụng Đa trí tuệ vào chọn nghề",
                    prompt="Làm sao để biết mình thuộc nhóm trí thông minh nào và ứng dụng vào việc chọn đúng ngành nghề?",
                    category="tools",
                ),
                AssistantQuickSuggestion(
                    label="Tạo CV chuẩn ATS trong 5 phút",
                    prompt="Hướng dẫn tôi các bước sử dụng CV Builder để tạo một bản CV ấn tượng, vượt qua bộ lọc ATS.",
                    category="cv_help",
                ),
            ]
        elif "/jobs" in path:
            return [
                AssistantQuickSuggestion(
                    label="Gợi ý việc làm đang tuyển gấp",
                    prompt="Gợi ý cho tôi các công việc có chế độ đãi ngộ tốt và đang có nhu cầu tuyển dụng cao nhất trên hệ thống.",
                    category="job_search",
                ),
                AssistantQuickSuggestion(
                    label="Bí quyết đàm phán lương khéo léo",
                    prompt="Khi nhà tuyển dụng hỏi mức lương kỳ vọng, tôi nên trả lời và đàm phán thế nào cho chuyên nghiệp và đạt mức mong muốn?",
                    category="interview",
                ),
                AssistantQuickSuggestion(
                    label="Cách viết CV cho người ít kinh nghiệm",
                    prompt="Nếu tôi mới ra trường hoặc chưa có nhiều năm kinh nghiệm, làm thế nào để CV của tôi vẫn nổi bật và thu hút nhà tuyển dụng?",
                    category="cv_help",
                ),
            ]
        else:
            # Universal diplomatic suggestions
            return [
                AssistantQuickSuggestion(
                    label="Tư vấn việc làm phù hợp",
                    prompt="Chào bạn! Tôi muốn tìm kiếm cơ hội việc làm phù hợp với bản thân, bạn có thể tư vấn giúp tôi không?",
                    category="job_search",
                ),
                AssistantQuickSuggestion(
                    label="Tạo CV chuẩn ATS miễn phí",
                    prompt="Tôi muốn tạo một bản CV chuyên nghiệp. Hệ thống CV Builder của JobPortal có những điểm gì vượt trội?",
                    category="cv_help",
                ),
                AssistantQuickSuggestion(
                    label="Khám phá MBTI & Đa trí tuệ",
                    prompt="Giới thiệu cho tôi về bộ công cụ trắc nghiệm tính cách MBTI và Đa trí tuệ MI trên sàn.",
                    category="tools",
                ),
                AssistantQuickSuggestion(
                    label="Giải pháp tuyển dụng Doanh nghiệp",
                    prompt="Doanh nghiệp của tôi đang có nhu cầu tuyển dụng nhân sự chất lượng cao, JobPortal có những giải pháp gì?",
                    category="general",
                ),
            ]


assistant_service = AssistantService()

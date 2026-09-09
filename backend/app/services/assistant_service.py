"""AI Assistant Copilot Service for JobPortal — 24/7 Diplomatic Customer Advisor & Retention Specialist."""

import json
import logging
import re
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
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
from app.services.prompt_loader import HARDCODED_FALLBACK_PROMPTS, get_system_prompt

logger = logging.getLogger(__name__)

DIPLOMATIC_SYSTEM_PROMPT = HARDCODED_FALLBACK_PROMPTS.get(AIFeature.ASSISTANT_CHAT, "")


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
            candidate_context = f"- Tên ứng viên: {current_user.full_name}."

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

        system_prompt_template = get_system_prompt(AIFeature.ASSISTANT_CHAT, db=db)
        system_prompt = system_prompt_template.format(
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
                feature=AIFeature.ASSISTANT_CHAT,
                user_id=current_user.id if current_user else None,
                db=db,
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

            # Guest conversion: Soft CTA Register Card
            if (not current_user or role == "guest") and not any(c.url == "/register" for c in cards):
                if any(
                    w in last_user_message.lower()
                    for w in [
                        "đăng ký",
                        "tài khoản",
                        "lưu",
                        "save",
                        "đăng nhập",
                        "chuối",
                        "mua",
                        "bán",
                        "bắt đầu",
                        "miễn phí",
                        "giá",
                        "tiền",
                    ]
                ) or not cards:
                    cards.append(
                        EmbeddedCard(
                            card_type="action",
                            title="Đăng ký tài khoản miễn phí (30s)",
                            subtitle="Lưu trữ CV chuẩn ATS & Kết quả bài test trắc nghiệm",
                            url="/register",
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

            if (not current_user or role == "guest") and not any(c.url == "/register" for c in fallback_cards):
                fallback_cards.append(
                    EmbeddedCard(
                        card_type="action",
                        title="Đăng ký tài khoản miễn phí (30s)",
                        subtitle="Lưu trữ CV chuẩn ATS & Kết quả bài test trắc nghiệm",
                        url="/register",
                    )
                )

            fallback_followups = [
                "Gợi ý việc làm phù hợp với tôi",
                "Hướng dẫn tạo CV chuẩn ATS",
                "Khám phá bài test MBTI & MI",
                "Tìm hiểu giải pháp tuyển dụng Doanh nghiệp",
            ]
            if not current_user or role == "guest":
                fallback_followups.insert(0, "Đăng ký tài khoản nhận tư vấn miễn phí")

            fallback_reply = (
                "Kính chào bạn! Tôi là **JobPortal AI Advisor** — Cố vấn Tuyển dụng & Phát triển Sự nghiệp 24/7. "
                "Rất hân hạnh được đồng hành cùng bạn.\n\n"
                "Bạn đang quan tâm đến:\n"
                "- 🔍 **Tìm kiếm cơ hội việc làm** phù hợp với năng lực và mức lương kỳ vọng.\n"
                "- 📄 **Thiết kế CV chuẩn ATS** hoàn toàn miễn phí với [CV Builder](/cv-builder).\n"
                "- 🧭 **Khám phá bản thân** qua trắc nghiệm tính cách [MBTI](/tools/mbti) và [Đa trí tuệ MI](/tools/mi).\n"
                "- 🏢 **Giải pháp tuyển dụng tối ưu cho Doanh nghiệp** qua [Cổng Nhà tuyển dụng](/employer).\n\n"
            )
            if not current_user or role == "guest":
                fallback_reply += (
                    "💡 **Mẹo nhỏ:** Bạn có thể dành 30 giây [Đăng ký tài khoản miễn phí](/register) "
                    "để lưu vĩnh viễn mẫu CV chuẩn ATS, theo dõi trạng thái ứng tuyển và lưu lại kết quả bài test tính cách nhé!\n\n"
                )
            fallback_reply += "Hãy chia sẻ mong muốn của bạn, tôi sẽ đưa ra giải pháp phù hợp nhất!"

            return AssistantChatResponse(
                reply=fallback_reply,
                suggested_cards=fallback_cards,
                suggested_followups=fallback_followups,
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

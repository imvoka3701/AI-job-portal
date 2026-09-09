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
from app.services.assistant_knowledge import get_contextual_knowledge
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
    @staticmethod
    def _parse_response(content_str: str) -> tuple[str, list, list]:
        """Robustly parse JSON response from DeepSeek, handling unescaped quotes/newlines/markdown."""
        cleaned = content_str.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        # 1. Try standard JSON parsing with strict=False (handles unescaped control chars like newlines)
        try:
            data = json.loads(cleaned, strict=False)
            if isinstance(data, dict):
                return (
                    str(data.get("reply") or "").strip(),
                    data.get("suggested_cards", []) or [],
                    data.get("suggested_followups", []) or [],
                )
        except Exception as json_err:
            logger.warning(
                "Standard json.loads failed on assistant response (%s). Attempting regex fallback.",
                json_err,
            )

        # 2. Regex fallback for unescaped quotes in reply string
        reply = ""
        cards: list = []
        followups: list = []

        reply_match = re.search(
            r'"reply"\s*:\s*"(.*?)(?:"\s*,\s*"suggested_cards"|"\s*,\s*"suggested_followups"|"\s*\}\s*$)',
            cleaned,
            re.DOTALL,
        )
        if reply_match:
            reply = reply_match.group(1).replace(r"\"", '"').replace(r"\n", "\n").strip()
        elif not cleaned.startswith("{"):
            reply = cleaned

        cards_match = re.search(r'"suggested_cards"\s*:\s*(\[.*?\])', cleaned, re.DOTALL)
        if cards_match:
            try:
                cards = json.loads(cards_match.group(1), strict=False)
            except Exception:
                cards = []

        followups_match = re.search(r'"suggested_followups"\s*:\s*(\[.*?\])', cleaned, re.DOTALL)
        if followups_match:
            try:
                followups = json.loads(followups_match.group(1), strict=False)
            except Exception:
                followups = []

        # 3. Final fallback: If reply is still empty, clean raw text directly
        if not reply and len(cleaned) > 10:
            reply = re.sub(r'^\s*\{\s*"reply"\s*:\s*"?', "", cleaned).rstrip('"} \n\r')

        return reply or "Tôi có thể hỗ trợ gì thêm cho bạn?", cards, followups

    async def process_chat(
        self,
        messages: List[ChatMessage],
        context: Optional[ChatContext],
        current_user: Optional[User],
        db: Session,
    ) -> AssistantChatResponse:
        """Process chat message with diplomatic persona & contextual knowledge."""
        last_user_message = next((m.content for m in reversed(messages) if m.role == "user"), "")

        # Security hardening: Role is cryptographically bound to verified JWT identity
        if current_user:
            role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        else:
            # Unauthenticated callers can only be "guest" or preview "candidate", never "employer" or "admin"
            requested_role = context.role if context and context.role else "guest"
            role = requested_role if requested_role == "candidate" else "guest"

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

        system_knowledge = get_contextual_knowledge(
            role=role, current_path=current_path, user_query=last_user_message
        )
        system_prompt_template = get_system_prompt(AIFeature.ASSISTANT_CHAT, db=db)

        format_dict = {
            "role_desc": role_desc,
            "current_path": current_path,
            "job_context": job_context,
            "candidate_context": candidate_context,
            "jobs_data": jobs_data,
            "system_knowledge": system_knowledge,
        }
        try:
            system_prompt = system_prompt_template.format(**format_dict)
        except (KeyError, IndexError):
            system_prompt = system_prompt_template
            for k, v in format_dict.items():
                system_prompt = system_prompt.replace(f"{{{k}}}", str(v))

        if system_knowledge and system_knowledge not in system_prompt:
            system_prompt += f"\n\n---\n\nTRI THỨC CHUYÊN SÂU HỆ THỐNG:\n{system_knowledge}"

        payload_messages = [{"role": "system", "content": system_prompt}]
        for m in messages[-8:]:
            payload_messages.append({"role": m.role, "content": m.content})

        # Agentic Tool Definitions & Dispatcher
        from app.services.assistant_tools import ASSISTANT_TOOLS_DEFINITIONS, dispatch_tool_call

        try:
            # Turn 1: Call DeepSeek with tools enabled (response_format=None to permit tool_calls)
            raw_response = await deepseek_client.create_chat_completion(
                messages=payload_messages,
                model=settings.LLM_MODEL,
                response_format=None,
                tools=ASSISTANT_TOOLS_DEFINITIONS,
                tool_choice="auto",
                feature=AIFeature.ASSISTANT_CHAT,
                user_id=current_user.id if current_user else None,
                db=db,
            )

            choice_msg = raw_response["choices"][0]["message"]
            tool_calls = choice_msg.get("tool_calls")
            cards: List[EmbeddedCard] = []

            if tool_calls:
                payload_messages.append(choice_msg)
                for tc in tool_calls:
                    fn_name = tc.get("function", {}).get("name", "")
                    fn_args_raw = tc.get("function", {}).get("arguments", "{}")
                    try:
                        fn_args = json.loads(fn_args_raw) if isinstance(fn_args_raw, str) else fn_args_raw
                    except Exception:
                        fn_args = {}

                    tool_res = dispatch_tool_call(
                        tool_name=fn_name,
                        tool_args=fn_args,
                        db=db,
                        current_user=current_user,
                    )

                    # Auto-construct real job cards if search_live_jobs was called
                    if fn_name == "search_live_jobs" and isinstance(tool_res, dict) and "jobs" in tool_res:
                        for j in tool_res["jobs"][:3]:
                            cards.append(
                                EmbeddedCard(
                                    card_type="job",
                                    title=j["title"],
                                    subtitle=f"{j['company']} • {j['location']} • {j['salary']}",
                                    url=j["url"],
                                    meta=j,
                                )
                            )
                    elif fn_name == "get_candidate_applications" and isinstance(tool_res, dict) and "applications" in tool_res:
                        for a in tool_res["applications"][:3]:
                            cards.append(
                                EmbeddedCard(
                                    card_type="info",
                                    title=f"Đơn: {a['job_title']}",
                                    subtitle=f"{a['company']} • Trạng thái: {a['status_display']}",
                                    url=a["url"],
                                    meta=a,
                                )
                            )

                    payload_messages.append({
                        "role": "tool",
                        "tool_call_id": tc.get("id"),
                        "content": json.dumps(tool_res, ensure_ascii=False),
                    })

                # Turn 2: Synthesize final answer in JSON format
                turn2_resp = await deepseek_client.create_chat_completion(
                    messages=payload_messages,
                    model=settings.LLM_MODEL,
                    response_format={"type": "json_object"},
                    feature=AIFeature.ASSISTANT_CHAT,
                    user_id=current_user.id if current_user else None,
                    db=db,
                )
                content_str = turn2_resp["choices"][0]["message"]["content"]
            else:
                content_str = choice_msg.get("content", "")

            reply, suggested_cards_raw, suggested_followups = self._parse_response(content_str)

            for c in suggested_cards_raw:
                if isinstance(c, dict) and "title" in c and "url" in c:
                    if not any(existing.url == c.get("url") for existing in cards):
                        cards.append(
                            EmbeddedCard(
                                card_type=c.get("card_type", "info"),
                                title=c.get("title", ""),
                                subtitle=c.get("subtitle"),
                                url=c.get("url", ""),
                                meta=c.get("meta"),
                            )
                        )

            # Smart Auto-attach Cards based on User Role & Query
            query_lower = last_user_message.lower()

            # A. Employer Solutions Engineering Cards
            if role == "employer" or "/employer" in current_path:
                if any(
                    w in query_lower
                    for w in [
                        "team",
                        "nhóm",
                        "phân quyền",
                        "rbac",
                        "thành viên",
                        "interviewer",
                        "lead",
                        "viewer",
                    ]
                ):
                    if not any(c.url == "/employer/team" for c in cards):
                        cards.append(
                            EmbeddedCard(
                                card_type="tool",
                                title="Quản lý Đội ngũ & Phân quyền RBAC",
                                subtitle="Phân quyền 5 cấp bậc: Owner, HR, Lead, Interviewer, Viewer",
                                url="/employer/team",
                            )
                        )
                if any(
                    w in query_lower
                    for w in ["jd", "đăng tin", "tạo tin", "tuyển dụng mới", "mô tả"]
                ):
                    if not any(c.url == "/employer/jobs/new" for c in cards):
                        cards.append(
                            EmbeddedCard(
                                card_type="tool",
                                title="Soạn Thảo Tin Tuyển Dụng (AI JD)",
                                subtitle="AI sinh JD chuẩn SEO & ATS theo tên vị trí trong 5s",
                                url="/employer/jobs/new",
                            )
                        )
                if any(
                    w in query_lower
                    for w in ["ứng viên", "ats", "kanban", "excel", "csv", "bom", "sàng lọc"]
                ):
                    if not any(c.url == "/employer/candidates" for c in cards):
                        cards.append(
                            EmbeddedCard(
                                card_type="tool",
                                title="Quản trị ATS Kanban & Xuất Excel UTF-8 BOM",
                                subtitle="5 giai đoạn phễu tuyển dụng · Bộ lọc AI Match · Xuất CSV không vỡ font",
                                url="/employer/candidates",
                            )
                        )
                if any(
                    w in query_lower for w in ["phỏng vấn", "lịch", "interview", "ics", "calendar"]
                ):
                    if not any(c.url == "/employer/interviews" for c in cards):
                        cards.append(
                            EmbeddedCard(
                                card_type="tool",
                                title="Quản lý Lịch Phỏng Vấn Doanh Nghiệp",
                                subtitle="Đồng bộ tự động Google Calendar & Tải file .ics chuẩn RFC 5545",
                                url="/employer/interviews",
                            )
                        )
                if any(
                    w in query_lower
                    for w in ["tích xanh", "xác minh", "verified", "gpkd", "cài đặt"]
                ):
                    if not any(c.url == "/employer/settings" for c in cards):
                        cards.append(
                            EmbeddedCard(
                                card_type="tool",
                                title="Cài đặt Doanh Nghiệp & Xác Minh GPKD",
                                subtitle="Tải Giấy phép kinh doanh để nhận Tích xanh Doanh nghiệp uy tín",
                                url="/employer/settings",
                            )
                        )

            # B. Candidate Career Cards
            if any(w in query_lower for w in ["cv", "hồ sơ", "resume", "mẫu cv", "cv builder"]):
                if not any(c.url in ["/cv-builder", "/cv", "/cv/new"] for c in cards):
                    cards.append(
                        EmbeddedCard(
                            card_type="tool",
                            title="Interactive CV Builder (5 Mẫu ATS)",
                            subtitle="Chuẩn ATS quốc tế · AI gợi ý kỹ năng · Xuất PDF vector",
                            url="/cv-builder",
                        )
                    )
            if any(w in query_lower for w in ["mbti", "tính cách"]):
                if not any(c.url == "/tools/mbti" for c in cards):
                    cards.append(
                        EmbeddedCard(
                            card_type="tool",
                            title="Trắc Nghiệm Tính Cách MBTI",
                            subtitle="40 câu hỏi chuẩn hóa · 16 nhóm tính cách & văn hóa công ty",
                            url="/tools/mbti",
                        )
                    )
            if any(w in query_lower for w in ["mi", "đa trí tuệ", "thông minh"]):
                if not any(c.url == "/tools/mi" for c in cards):
                    cards.append(
                        EmbeddedCard(
                            card_type="tool",
                            title="Trắc Nghiệm Đa Trí Tuệ MI",
                            subtitle="Phân loại 8 loại hình thông minh & ngành nghề phù hợp",
                            url="/tools/mi",
                        )
                    )
            if any(w in query_lower for w in ["lộ trình", "roadmap"]):
                if not any(c.url == "/ai/roadmap" for c in cards):
                    cards.append(
                        EmbeddedCard(
                            card_type="tool",
                            title="AI Career Roadmap (Lộ Trình Sự Nghiệp)",
                            subtitle="Vạch rõ từng bước học tập & kỹ năng cần trau dồi theo tháng",
                            url="/ai/roadmap",
                        )
                    )
            if any(w in query_lower for w in ["matching", "so khớp", "điểm match"]):
                if not any(c.url in ["/ai/matching", "/ai/match"] for c in cards):
                    cards.append(
                        EmbeddedCard(
                            card_type="tool",
                            title="AI CV Matching Engine",
                            subtitle="So khớp ngữ nghĩa vector CV và JD · Điểm 3 trục & Deal-breakers",
                            url="/ai/matching",
                        )
                    )

            # Relevant Jobs card fallback
            if not cards and any(
                w in query_lower
                for w in ["việc", "job", "tuyển", "lương", "react", "python", "dev", "làm"]
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

            # C. Guest Conversion Card
            if (not current_user or role == "guest") and not any(
                c.url == "/register" for c in cards
            ):
                if (
                    any(
                        w in query_lower
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
                    )
                    or not cards
                ):
                    cards.append(
                        EmbeddedCard(
                            card_type="action",
                            title="Đăng ký tài khoản miễn phí (30s)",
                            subtitle="Lưu trữ CV chuẩn ATS & Kết quả bài test trắc nghiệm vĩnh viễn",
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

            if (not current_user or role == "guest") and not any(
                c.url == "/register" for c in fallback_cards
            ):
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

            user_topic = last_user_message[:60].strip() if last_user_message else "tư vấn việc làm"
            fallback_reply = (
                f"Chào bạn! Tôi là **JobPortal AI Copilot & Solutions Engineer**. Tôi đã ghi nhận yêu cầu của bạn về: **'{user_topic}'**.\n\n"
                "Hệ thống phân tích AI đang tạm thời có lượng truy cập cao trong giây lát. "
                "Trong lúc đó, bạn có thể truy cập nhanh các tính năng cốt lõi dưới đây:\n"
                "- 🔍 **Sàn việc làm:** Khám phá hàng trăm vị trí hot đang tuyển dụng trên [Sàn việc làm](/jobs).\n"
                "- 📄 **Thiết kế CV chuẩn ATS:** Tạo hồ sơ chuyên nghiệp miễn phí với 5 mẫu quốc tế tại [CV Builder](/cv-builder).\n"
                "- 🧭 **Khám phá bản thân:** Làm bài trắc nghiệm tính cách [MBTI](/tools/mbti) và [Đa trí tuệ MI](/tools/mi).\n"
                "- 🏢 **Giải pháp Doanh nghiệp:** Quản trị phễu tuyển dụng tự động qua [Cổng Nhà tuyển dụng](/employer).\n\n"
            )
            if not current_user or role == "guest":
                fallback_reply += (
                    "💡 **Mẹo nhỏ:** Bạn có thể dành 30 giây [Đăng ký tài khoản miễn phí](/register) "
                    "để lưu vĩnh viễn hồ sơ và nhận thông báo việc làm phù hợp tự động nhé!\n\n"
                )
            fallback_reply += (
                "Bạn có thể gửi lại câu hỏi hoặc chọn một trong các gợi ý bên dưới để tiếp tục!"
            )

            return AssistantChatResponse(
                reply=fallback_reply,
                suggested_cards=fallback_cards,
                suggested_followups=fallback_followups,
            )

    def get_quick_suggestions(
        self, path: str, role: Optional[str]
    ) -> List[AssistantQuickSuggestion]:
        """Return context-sensitive diplomatic & solutions engineer prompt chips."""
        if role == "employer" or "/employer" in path:
            return [
                AssistantQuickSuggestion(
                    label="Soạn JD tuyển dụng thông minh (AI JD)",
                    prompt="Tôi muốn đăng tuyển vị trí mới. Bạn hãy giúp tôi soạn thảo một bản mô tả công việc (JD) thu hút và chuẩn SEO nhé.",
                    category="employer_jd",
                ),
                AssistantQuickSuggestion(
                    label="Cách phân quyền Tech Lead phỏng vấn (RBAC)?",
                    prompt="Làm thế nào để phân quyền cho Tech Lead vào xem CV và chấm điểm phỏng vấn nhưng không được sửa tin tuyển dụng hay xóa ứng viên?",
                    category="interview",
                ),
                AssistantQuickSuggestion(
                    label="Xuất danh sách ứng viên ATS Excel không lỗi font",
                    prompt="Làm sao để xuất danh sách ứng viên từ bảng Kanban ra file Excel trên máy tính Windows mà không bị vỡ font Tiếng Việt?",
                    category="general",
                ),
                AssistantQuickSuggestion(
                    label="Cơ chế tính điểm AI CV Matching & Deal-breakers?",
                    prompt="Hệ thống AI Matching so khớp CV và JD dựa trên những tiêu chí nào và tính điểm 3 trụ cột ra sao?",
                    category="general",
                ),
                AssistantQuickSuggestion(
                    label="Quy trình xin cấp Tích xanh Verified",
                    prompt="Doanh nghiệp của tôi cần chuẩn bị giấy tờ gì và làm theo các bước nào tại mục Cài đặt để được cấp Tích xanh Đã xác minh?",
                    category="general",
                ),
            ]
        elif any(p in path for p in ["/cv", "/tools", "mbti", "mi"]):
            return [
                AssistantQuickSuggestion(
                    label="Bí quyết tạo CV đạt trên 85 điểm ATS",
                    prompt="Hướng dẫn tôi các bước sử dụng CV Builder để tạo một bản CV chuẩn ATS, tối ưu từ khóa kỹ năng và xuất file PDF sắc nét.",
                    category="cv_help",
                ),
                AssistantQuickSuggestion(
                    label="Ứng dụng kết quả MBTI vào chọn việc",
                    prompt="Sau khi làm trắc nghiệm MBTI ra nhóm tính cách của mình, làm thế nào để tìm công việc có môi trường văn hóa phù hợp?",
                    category="tools",
                ),
                AssistantQuickSuggestion(
                    label="Xem lộ trình phát triển kỹ năng AI",
                    prompt="Làm sao để sử dụng tính năng Career Roadmap vạch ra lộ trình học tập và hoàn thiện kỹ năng theo mục tiêu nghề nghiệp?",
                    category="tools",
                ),
            ]
        elif "/jobs" in path:
            return [
                AssistantQuickSuggestion(
                    label="Gợi ý việc làm phù hợp nhất",
                    prompt="Gợi ý cho tôi các công việc có chế độ đãi ngộ tốt và đang có nhu cầu tuyển dụng cao nhất trên sàn việc làm.",
                    category="job_search",
                ),
                AssistantQuickSuggestion(
                    label="Bí quyết đàm phán lương khéo léo",
                    prompt="Khi nhà tuyển dụng hỏi mức lương kỳ vọng, tôi nên trả lời và đàm phán thế nào cho chuyên nghiệp và đạt mức mong muốn?",
                    category="interview",
                ),
                AssistantQuickSuggestion(
                    label="Cách viết thư ứng tuyển (Cover Letter) AI",
                    prompt="Hệ thống có tính năng hỗ trợ tôi tự động tạo một bức thư ứng tuyển (Cover Letter) cá nhân hóa cho công việc này không?",
                    category="cv_help",
                ),
            ]
        else:
            # Universal diplomatic suggestions for Guests & General Users
            return [
                AssistantQuickSuggestion(
                    label="Hệ sinh thái JobPortal có gì vượt trội?",
                    prompt="Giới thiệu cho tôi những tính năng đột phá của nền tảng AI Job Portal dành cho Ứng viên và Doanh nghiệp tuyển dụng.",
                    category="general",
                ),
                AssistantQuickSuggestion(
                    label="Tạo CV chuẩn ATS miễn phí (5 mẫu)",
                    prompt="Tôi muốn tạo một bản CV chuyên nghiệp. Hệ thống CV Builder của JobPortal hỗ trợ những mẫu nào và có miễn phí không?",
                    category="cv_help",
                ),
                AssistantQuickSuggestion(
                    label="Trắc nghiệm MBTI & Đa trí tuệ MI",
                    prompt="Bộ công cụ trắc nghiệm tính cách MBTI và Đa trí tuệ MI trên sàn giúp tôi khám phá tiềm năng bản thân như thế nào?",
                    category="tools",
                ),
                AssistantQuickSuggestion(
                    label="Giải pháp tuyển dụng Doanh nghiệp B2B",
                    prompt="Doanh nghiệp của tôi đang cần tuyển dụng nhân tài công nghệ, JobPortal có giải pháp ATS và AI Matching như thế nào?",
                    category="general",
                ),
            ]


assistant_service = AssistantService()

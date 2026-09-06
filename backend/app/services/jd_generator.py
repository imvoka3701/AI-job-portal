"""JD Generator Service — generates intelligent, multi-industry Job Descriptions using LLM.

Enriches the generation prompt with Company Tenancy context and industry specifics.
Provides robust heuristic fallbacks across industries if the LLM API is unavailable.
"""

import json
import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.models.company import Company
from app.models.job import JobCategory
from app.schemas.ai import GenerateJDRequest, GenerateJDResponse
from app.services.deepseek_client import deepseek_client
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)

# Heuristic salary benchmarks (in VND) by experience level in Vietnam market
SALARY_BENCHMARKS: dict[str, tuple[int, int]] = {
    "intern": (3000000, 6000000),
    "fresher": (8000000, 14000000),
    "junior": (12000000, 20000000),
    "middle": (20000000, 35000000),
    "senior": (35000000, 60000000),
    "lead": (50000000, 90000000),
    "manager": (45000000, 80000000),
    "director": (80000000, 150000000),
}


class JDGeneratorService:
    """Service for AI-powered multi-industry job description generation."""

    async def generate_jd(
        self,
        db: Session,
        *,
        request: GenerateJDRequest,
        company: Company | None = None,
        user_id: int | None = None,
    ) -> GenerateJDResponse:
        """Generate a complete, customized Job Description for any industry and role."""
        # 1. Resolve Industry and Category
        industry_name = request.industry or ""
        resolved_category_id = request.category_id

        if resolved_category_id:
            cat = db.query(JobCategory).filter(JobCategory.id == resolved_category_id).first()
            if cat:
                industry_name = cat.name
        elif industry_name:
            cat = db.query(JobCategory).filter(JobCategory.name.ilike(f"%{industry_name}%")).first()
            if cat:
                resolved_category_id = cat.id

        # 2. Build Company Context
        company_info_lines = []
        if company:
            company_info_lines.append(f"- Tên doanh nghiệp: {company.name}")
            if company.industry:
                company_info_lines.append(f"- Lĩnh vực hoạt động: {company.industry}")
            if company.company_size:
                company_info_lines.append(f"- Quy mô: {company.company_size}")
            if company.description:
                company_info_lines.append(f"- Giới thiệu công ty: {company.description[:300]}")
            if company.address:
                company_info_lines.append(f"- Trụ sở: {company.address}")
        company_context_str = "\n".join(company_info_lines) if company_info_lines else "Doanh nghiệp tiêu chuẩn tại Việt Nam"

        # 3. Build Prompt
        system_prompt = get_system_prompt(AIFeature.GENERATE_JD, db=db)
        user_prompt = (
            f"=== THÔNG TIN YÊU CẦU TUYỂN DỤNG ===\n"
            f"Chức danh cần tuyển: {request.job_title}\n"
            f"Ngành nghề / Lĩnh vực: {industry_name or 'Đa ngành'}\n"
            f"Cấp bậc vị trí: {request.experience_level}\n"
            f"Hình thức làm việc: {request.job_type}\n"
            f"Phong cách văn phong: {request.tone}\n"
            f"Địa điểm làm việc: {request.location or (company.address if company else 'Việt Nam')}\n"
            f"Ghi chú bổ sung từ HR: {request.key_notes or 'Không có ghi chú riêng'}\n\n"
            f"=== THÔNG TIN DOANH NGHIỆP TUYỂN DỤNG ===\n"
            f"{company_context_str}\n\n"
            f"Hãy soạn thảo toàn bộ bản JD (Tiêu đề, Mô tả công việc, Yêu cầu ứng viên, Quyền lợi/Đãi ngộ, Bộ kỹ năng gợi ý, và Mức lương ước tính) theo chuẩn JSON được quy định."
        )

        # 4. Call LLM with graceful fallback
        try:
            response = await deepseek_client.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=settings.LLM_MODEL,
                response_format={"type": "json_object"},
                feature=AIFeature.GENERATE_JD,
                user_id=user_id,
                db=db,
            )
            raw_content = response.get("choices", [])[0].get("message", {}).get("content", "")
            if not raw_content:
                raise ValueError("Empty LLM response")

            data = json.loads(raw_content)

            # Fallback benchmark salary if LLM omits or gives 0
            bench_min, bench_max = SALARY_BENCHMARKS.get(request.experience_level.lower(), (15000000, 30000000))
            salary_min = int(data.get("salary_min") or bench_min)
            salary_max = int(data.get("salary_max") or bench_max)

            # Clean formatting
            skills = [str(s).strip() for s in data.get("suggested_skills", []) if str(s).strip()]
            if not skills:
                skills = [request.job_title, industry_name] if industry_name else [request.job_title]

            return GenerateJDResponse(
                title=data.get("title") or request.job_title,
                description=str(data.get("description") or "").strip(),
                requirements=str(data.get("requirements") or "").strip(),
                benefits=str(data.get("benefits") or "").strip(),
                suggested_skills=skills,
                salary_min=salary_min,
                salary_max=salary_max,
                job_type=request.job_type,
                experience_level=request.experience_level,
                suggested_category_id=resolved_category_id,
            )

        except Exception as exc:
            logger.warning("LLM JD generation failed (%s), falling back to dynamic heuristic template", exc)
            return self._heuristic_fallback(
                request=request,
                industry_name=industry_name,
                category_id=resolved_category_id,
                company=company,
            )

    def _heuristic_fallback(
        self,
        *,
        request: GenerateJDRequest,
        industry_name: str,
        category_id: int | None,
        company: Company | None,
    ) -> GenerateJDResponse:
        """Generate high-quality structured JD fallback based on industry and level."""
        level = request.experience_level.lower()
        bench_min, bench_max = SALARY_BENCHMARKS.get(level, (15000000, 30000000))
        comp_name = company.name if company else "Công ty chúng tôi"
        role = request.job_title

        desc = (
            f"• Chịu trách nhiệm thực thi và quản lý các công việc chuyên môn liên quan đến vị trí {role} tại {comp_name}.\n"
            f"• Xây dựng quy trình làm việc chuẩn hóa, đảm bảo hiệu suất và tiến độ công việc trong lĩnh vực {industry_name or 'chuyên trách'}.\n"
            f"• Phối hợp chặt chẽ với các phòng ban nội bộ và đối tác để hoàn thành các mục tiêu kinh doanh/vận hành.\n"
            f"• Báo cáo định kỳ kết quả công việc và đề xuất các giải pháp cải tiến hiệu quả hoạt động."
        )

        reqs = (
            f"• Tốt nghiệp Đại học/Cao đẳng các chuyên ngành liên quan đến {industry_name or 'vị trí tuyển dụng'}.\n"
            f"• Có kinh nghiệm làm việc thực tế ở vị trí {role} tương đương cấp bậc {request.experience_level.capitalize()}.\n"
            f"• Kỹ năng giao tiếp, giải quyết vấn đề và tư duy phản biện tốt.\n"
            f"• Thành thạo các công cụ chuyên ngành và tin học văn phòng.\n"
            f"• Tinh thần trách nhiệm cao, chủ động trong công việc và có khả năng làm việc nhóm."
        )

        benefits = (
            f"• Mức lương cạnh tranh từ {bench_min // 1_000_000} - {bench_max // 1_000_000} triệu VND, xét tăng lương định kỳ theo năng lực.\n"
            f"• Đóng BHXH, BHYT, BHTN đầy đủ theo quy định của Luật Lao động.\n"
            f"• Thưởng tháng lương thứ 13, thưởng hiệu suất công việc và các dịp lễ, Tết.\n"
            f"• Môi trường làm việc chuyên nghiệp, văn hóa doanh nghiệp cởi mở, tôn trọng sự phát triển cá nhân.\n"
            f"• Cơ hội thăng tiến rõ ràng lên các vị trí quản lý cao hơn."
        )

        suggested_skills = [
            role,
            industry_name or "Chuyên môn ngành",
            "Kỹ năng giải quyết vấn đề",
            "Làm việc nhóm",
            "Tư duy chiến lược",
        ]

        return GenerateJDResponse(
            title=role,
            description=desc,
            requirements=reqs,
            benefits=benefits,
            suggested_skills=suggested_skills,
            salary_min=bench_min,
            salary_max=bench_max,
            job_type=request.job_type,
            experience_level=request.experience_level,
            suggested_category_id=category_id,
        )


jd_generator_service = JDGeneratorService()

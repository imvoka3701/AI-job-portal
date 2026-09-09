"""CV Parser Service — extracts structured metadata from resume text using LLM.

Parses CV content to identify:
  - Industry / field of work
  - Desired role / target position
  - Key skills (top 10)
  - Experience level (fresher/junior/middle/senior/lead)
  - Desired location

Uses a 2-tier approach:
  1. LLM extraction with structured JSON output
  2. Heuristic fallback if LLM is unavailable
"""

import json
import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.services.deepseek_client import deepseek_client

logger = logging.getLogger(__name__)

# Industry mapping — maps LLM output to existing job_categories slugs
INDUSTRY_CATEGORY_MAP: dict[str, str] = {
    # IT variations
    "it": "it-phan-mem",
    "công nghệ thông tin": "it-phan-mem",
    "phần mềm": "it-phan-mem",
    "software": "it-phan-mem",
    "technology": "it-phan-mem",
    "lập trình": "it-phan-mem",
    "it - phần mềm": "it-phan-mem",
    # Business
    "kinh doanh": "kinh-doanh",
    "sales": "kinh-doanh",
    "business": "kinh-doanh",
    "thương mại": "kinh-doanh",
    # Marketing
    "marketing": "marketing",
    "digital marketing": "marketing",
    "truyền thông": "marketing",
    # Accounting / Finance
    "kế toán": "ke-toan",
    "tài chính": "ke-toan",
    "finance": "ke-toan",
    "accounting": "ke-toan",
    "ngân hàng": "ke-toan",
    # Design
    "thiết kế": "thiet-ke",
    "design": "thiet-ke",
    "ui/ux": "thiet-ke",
    "đồ họa": "thiet-ke",
    "graphic": "thiet-ke",
}

# Heuristic keywords for basic industry detection
INDUSTRY_KEYWORDS: dict[str, list[str]] = {
    "IT - Phần mềm": [
        "python",
        "java",
        "javascript",
        "react",
        "angular",
        "vue",
        "node",
        "fastapi",
        "django",
        "flask",
        "sql",
        "database",
        "api",
        "backend",
        "frontend",
        "fullstack",
        "devops",
        "docker",
        "kubernetes",
        "cloud",
        "ai",
        "machine learning",
        "deep learning",
        "typescript",
        "golang",
        "c++",
        "c#",
        ".net",
        "aws",
        "gcp",
        "azure",
        "git",
        "cicd",
        "microservices",
        "rest",
        "graphql",
        "linux",
        "agile",
        "scrum",
    ],
    "Marketing": [
        "marketing",
        "seo",
        "sem",
        "content",
        "social media",
        "facebook ads",
        "google ads",
        "email marketing",
        "branding",
        "pr",
        "digital",
        "campaign",
        "analytics",
        "kol",
        "influencer",
        "copywriting",
    ],
    "Kế toán": [
        "kế toán",
        "thuế",
        "tax",
        "sap",
        "excel",
        "báo cáo tài chính",
        "hóa đơn",
        "sổ sách",
        "audit",
        "kiểm toán",
        "ngân hàng",
        "tín dụng",
        "finance",
        "accounting",
        "bookkeeping",
        "payroll",
    ],
    "Kinh doanh": [
        "kinh doanh",
        "sales",
        "bán hàng",
        "khách hàng",
        "doanh số",
        "revenue",
        "b2b",
        "b2c",
        "account manager",
        "business development",
        "partnership",
        "kpi",
        "target",
        "negotiation",
        "crm",
    ],
    "Thiết kế": [
        "photoshop",
        "illustrator",
        "figma",
        "sketch",
        "adobe",
        "ui",
        "ux",
        "thiết kế",
        "design",
        "wireframe",
        "prototype",
        "graphic",
        "canva",
        "after effects",
        "premiere",
        "motion",
        "3d",
        "blender",
    ],
}

# Experience level keywords
EXPERIENCE_KEYWORDS: dict[str, list[str]] = {
    "fresher": ["fresher", "sinh viên", "mới ra trường", "thực tập", "intern", "0 năm"],
    "junior": ["junior", "1 năm", "2 năm", "1-2 năm", "dưới 2 năm"],
    "middle": ["middle", "3 năm", "4 năm", "3-5 năm", "mid-level"],
    "senior": ["senior", "5 năm", "6 năm", "7 năm", "8 năm", "5+ năm", "trên 5 năm"],
    "lead": ["lead", "manager", "trưởng nhóm", "quản lý", "director", "head", "cto", "vp"],
}


class CVMetadata:
    """Structured result from CV parsing."""

    __slots__ = ("industry", "desired_role", "key_skills", "experience_level", "desired_location")

    def __init__(
        self,
        industry: str = "",
        desired_role: str | None = None,
        key_skills: list[str] | None = None,
        experience_level: str = "fresher",
        desired_location: str | None = None,
    ):
        self.industry = industry
        self.desired_role = desired_role
        self.key_skills = key_skills or []
        self.experience_level = experience_level
        self.desired_location = desired_location


class CVParserService:
    """Extracts structured metadata from CV text using LLM with heuristic fallback."""

    def __init__(self):
        self.client = deepseek_client

    async def parse_cv_metadata(
        self,
        raw_text: str,
        *,
        db: Session | None = None,
    ) -> CVMetadata:
        """Parse CV text and extract structured metadata.

        Uses LLM for accurate extraction with heuristic fallback.

        Args:
            raw_text: The extracted text content of the CV.
            db: Optional database session for logging AI calls.

        Returns:
            CVMetadata with industry, role, skills, level, location.
        """
        text_clean = raw_text.strip()
        if not text_clean:
            return CVMetadata()

        # Try LLM extraction first
        try:
            return await self._parse_with_llm(text_clean[:3000], db=db)
        except Exception as exc:
            logger.warning("LLM CV parsing failed, using heuristic fallback: %s", exc)
            return self._parse_with_heuristic(text_clean)

    async def _parse_with_llm(
        self,
        text: str,
        *,
        db: Session | None = None,
    ) -> CVMetadata:
        """Extract CV metadata using LLM structured JSON output."""
        system_prompt = (
            "Bạn là hệ thống AI chuyên phân tích CV ứng viên. "
            "Phân tích đoạn CV sau và trích xuất thông tin có cấu trúc.\n\n"
            "BẮT BUỘC trả về đúng JSON format sau:\n"
            "{\n"
            '  "industry": "Ngành nghề chính (ví dụ: IT - Phần mềm, Kế toán, Marketing, Kinh doanh, Thiết kế, Y tế, Giáo dục, Xây dựng...)",\n'
            '  "desired_role": "Vị trí/chức danh mà ứng viên nhắm tới (parse từ Mục tiêu nghề nghiệp hoặc infer từ kinh nghiệm gần nhất)",\n'
            '  "key_skills": ["skill1", "skill2", ...],\n'
            '  "experience_level": "fresher | junior | middle | senior | lead",\n'
            '  "desired_location": "Địa điểm mong muốn nếu có trong CV, null nếu không rõ"\n'
            "}\n\n"
            "QUY TẮC:\n"
            "- industry: Chọn ngành nghề PHÙ HỢP NHẤT dựa trên kinh nghiệm và kỹ năng chính.\n"
            "- key_skills: Trích xuất tối đa 10 kỹ năng quan trọng nhất, ưu tiên hard skills.\n"
            "- experience_level: Infer từ số năm kinh nghiệm hoặc độ phức tạp công việc.\n"
            "  + 0-1 năm → fresher, 1-3 năm → junior, 3-5 năm → middle, 5-8 năm → senior, 8+ năm hoặc quản lý → lead.\n"
            "- Chỉ trả về JSON, KHÔNG kèm markdown hay văn bản bên ngoài.\n"
        )

        response = await self.client.create_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"CV cần phân tích:\n{text}"},
            ],
            model=settings.LLM_MODEL,
            response_format={"type": "json_object"},
            feature=AIFeature.CV_PARSE,
            db=db,
        )

        content = response.get("choices", [])[0].get("message", {}).get("content", "").strip()
        data = json.loads(content)

        return CVMetadata(
            industry=str(data.get("industry", "")).strip(),
            desired_role=data.get("desired_role"),
            key_skills=data.get("key_skills", [])[:10],
            experience_level=self._normalize_experience_level(
                str(data.get("experience_level", "fresher"))
            ),
            desired_location=data.get("desired_location"),
        )

    def _parse_with_heuristic(self, text: str) -> CVMetadata:
        """Fallback: extract basic metadata using keyword matching."""
        text_lower = text.lower()

        # Detect industry
        industry = ""
        best_score = 0
        for ind, keywords in INDUSTRY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > best_score:
                best_score = score
                industry = ind

        # Detect experience level
        experience_level = "fresher"
        for level in ["lead", "senior", "middle", "junior", "fresher"]:
            if any(kw in text_lower for kw in EXPERIENCE_KEYWORDS[level]):
                experience_level = level
                break

        # Extract skills — find matching keywords from the detected industry
        key_skills: list[str] = []
        if industry and industry in INDUSTRY_KEYWORDS:
            key_skills = [kw for kw in INDUSTRY_KEYWORDS[industry] if kw in text_lower][:10]

        return CVMetadata(
            industry=industry,
            desired_role=None,
            key_skills=key_skills,
            experience_level=experience_level,
            desired_location=None,
        )

    @staticmethod
    def _normalize_experience_level(level: str) -> str:
        """Normalize LLM output to valid experience level enum."""
        normalized = level.lower().strip()
        valid = {"fresher", "junior", "middle", "senior", "lead"}
        return normalized if normalized in valid else "fresher"

    @staticmethod
    def resolve_category_id(
        industry: str,
        db: Session,
    ) -> int | None:
        """Map a parsed industry string to an existing job_categories.id.

        Performs a case-insensitive lookup against the INDUSTRY_CATEGORY_MAP
        and then resolves the slug to an actual DB record.
        """
        if not industry:
            return None

        slug = INDUSTRY_CATEGORY_MAP.get(industry.lower().strip())
        if not slug:
            # Try partial matching
            for key, s in INDUSTRY_CATEGORY_MAP.items():
                if key in industry.lower():
                    slug = s
                    break

        if not slug:
            return None

        from app.models.job import JobCategory

        cat = db.query(JobCategory).filter(JobCategory.slug == slug).first()
        return cat.id if cat else None


cv_parser_service = CVParserService()

"""CV Format Validator — Tier 1 Heuristic Pre-check (Fast, Offline, 0-AI-Cost).

Analyzes extracted text from uploaded documents to determine whether it follows
a recognizable CV/Resume structure before invoking LLM or storing files on disk.

Tier 1 criteria:
  1. Minimum text length (>= 100 characters).
  2. Contact information is MANDATORY (Email regex OR Phone number regex).
  3. At least 1 of 3 core professional sections: Experience, Education, or Skills.
"""

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Minimum character count for a meaningful CV text
MIN_CV_TEXT_LENGTH = 100

# Regex patterns for contact information
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
# Matches Vietnamese and international phone number formats (with spaces, dots, dashes)
PHONE_REGEX = re.compile(r"(?:(?:\+?84)|0)(?:\s*[\.-]?\s*\d){9,10}\b")

# Section keywords (Vietnamese with & without diacritics, and English)
SECTION_KEYWORDS: dict[str, list[str]] = {
    "experience": [
        "kinh nghiệm",
        "kinh nghiem",
        "kinh nghiệm làm việc",
        "kinh nghiem lam viec",
        "quá trình làm việc",
        "qua trinh lam viec",
        "lịch sử làm việc",
        "lich su lam viec",
        "kinh nghiệm thực tế",
        "dự án",
        "du an",
        "project",
        "projects",
        "experience",
        "work experience",
        "employment history",
        "work history",
        "professional experience",
        "career history",
    ],
    "education": [
        "học vấn",
        "hoc van",
        "trình độ học vấn",
        "trinh do hoc van",
        "bằng cấp",
        "bang cap",
        "đào tạo",
        "dao tao",
        "giáo dục",
        "giao duc",
        "education",
        "academic background",
        "academic qualification",
        "qualifications",
        "university",
        "đại học",
        "dai hoc",
        "cao đẳng",
        "bachelor",
        "master",
        "gpa",
    ],
    "skills": [
        "kỹ năng",
        "ky nang",
        "kỹ năng chuyên môn",
        "ky nang chuyen mon",
        "kỹ năng mềm",
        "ky nang mem",
        "chuyên môn",
        "chuyen mon",
        "skills",
        "technical skills",
        "core competencies",
        "competencies",
        "tech stack",
        "công nghệ",
        "cong nghe",
        "abilities",
        "chứng chỉ",
        "chung chi",
        "certificate",
        "certifications",
    ],
}

GROUP_LABELS_VN: dict[str, str] = {
    "contact": "Thông tin liên hệ (Email/Số điện thoại)",
    "experience": "Kinh nghiệm làm việc",
    "education": "Học vấn / Bằng cấp",
    "skills": "Kỹ năng chuyên môn / Chứng chỉ",
}


def normalize_vietnamese_pdf_text(text: str) -> str:
    """Normalize text extracted from PDFs with broken Vietnamese glyph kerning.

    Tools like TopCV, Canva, and Word frequently output PDF streams where accented
    Vietnamese characters are separated from adjacent letters by spaces
    (e.g., 'nghi ệ m', 'HỌ C V Ấ N', 'kinh nghi ệ m l àm vi ệ c').
    This collapses orphaned single letters back into their parent words.
    """
    import unicodedata

    norm = unicodedata.normalize("NFC", text)
    for _ in range(3):
        norm = re.sub(
            r"([A-Za-zÀ-ỹ0-9])\s+([A-Za-zÀ-ỹ0-9])(?=[\s\.,:;\n\(\)\-–—]|$)",
            r"\1\2",
            norm,
        )
    return norm


@dataclass
class CVHeuristicResult:
    is_valid: bool
    reason: str = ""
    has_contact: bool = False
    detected_groups: list[str] = field(default_factory=list)
    missing_groups: list[str] = field(default_factory=list)
    matched_keywords: dict[str, list[str]] = field(default_factory=dict)


def validate_cv_heuristic(text: str | None) -> CVHeuristicResult:
    """Fast, offline pre-check for standard CV format without LLM API calls.

    Returns:
        CVHeuristicResult with boolean validation outcome, user-facing explanation,
        and matched/missing section categories.
    """
    if not text:
        return CVHeuristicResult(
            is_valid=False,
            reason="Nội dung hồ sơ trống. Vui lòng tải lên file CV có văn bản đọc được.",
            missing_groups=list(GROUP_LABELS_VN.keys()),
        )

    text_clean = text.strip()
    if len(text_clean) < MIN_CV_TEXT_LENGTH:
        return CVHeuristicResult(
            is_valid=False,
            reason=(
                f"Nội dung hồ sơ quá ngắn (dưới {MIN_CV_TEXT_LENGTH} ký tự). "
                "Vui lòng tải lên file CV hoàn chỉnh có thông tin cá nhân, kinh nghiệm và kỹ năng."
            ),
            missing_groups=list(GROUP_LABELS_VN.keys()),
        )

    # 1. Contact Information Check (Mandatory)
    has_email = bool(EMAIL_REGEX.search(text_clean))
    has_phone = bool(PHONE_REGEX.search(text_clean))
    has_contact = has_email or has_phone

    # 2. Section Keywords Check (checking both raw and normalized text)
    text_lower = text_clean.lower()
    norm_lower = normalize_vietnamese_pdf_text(text_clean).lower()

    matched_keywords: dict[str, list[str]] = {}
    detected_groups: list[str] = []
    missing_groups: list[str] = []

    if has_contact:
        detected_groups.append("contact")
    else:
        missing_groups.append("contact")

    for group, keywords in SECTION_KEYWORDS.items():
        found = [kw for kw in keywords if (kw in text_lower or kw in norm_lower)]
        if found:
            detected_groups.append(group)
            matched_keywords[group] = found
        else:
            missing_groups.append(group)

    # Professional groups are experience, education, skills
    professional_detected = [g for g in detected_groups if g != "contact"]

    # Rule: contact is MANDATORY + at least 1 professional group (experience, education, skills)
    if not has_contact:
        return CVHeuristicResult(
            is_valid=False,
            reason=(
                "Hồ sơ tải lên thiếu thông tin liên hệ bắt buộc (Email hoặc Số điện thoại). "
                "Vui lòng bổ sung thông tin liên hệ để nhà tuyển dụng có thể kết nối với bạn."
            ),
            has_contact=False,
            detected_groups=detected_groups,
            missing_groups=missing_groups,
            matched_keywords=matched_keywords,
        )

    if len(professional_detected) == 0:
        missing_labels = [GROUP_LABELS_VN[g] for g in ["experience", "education", "skills"]]
        return CVHeuristicResult(
            is_valid=False,
            reason=(
                "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường (thiếu các mục chuyên môn: "
                f"{', '.join(missing_labels)}). "
                "Vui lòng tải lên file CV hợp lệ hoặc sử dụng CV Builder để tạo CV chuẩn ATS."
            ),
            has_contact=True,
            detected_groups=detected_groups,
            missing_groups=missing_groups,
            matched_keywords=matched_keywords,
        )

    return CVHeuristicResult(
        is_valid=True,
        reason="",
        has_contact=True,
        detected_groups=detected_groups,
        missing_groups=missing_groups,
        matched_keywords=matched_keywords,
    )

"""Document Chunker Service — Section-based Semantic Chunking for Resumes, CV Documents, and Jobs.

Implements Chapter 7 principles:
- No naive fixed-size splitting that breaks project/experience context.
- Preserves semantic boundaries: each work experience, project, skill block, or job requirement is an independent chunk.
- Attaches rich metadata (role, company, period, skills, section) for hybrid search filtering.
"""

import json
import logging
import re

from app.models.cv_document import CvDocument
from app.models.job import Job
from app.models.resume import Resume
from app.schemas.rag import DocumentChunkCreate

logger = logging.getLogger(__name__)

MAX_CHUNK_CHARACTERS = 1500
OVERLAP_CHARACTERS = 150
MIN_CHUNK_CHARACTERS = 40


def _split_text_with_overlap(text: str, max_chars: int = MAX_CHUNK_CHARACTERS, overlap: int = OVERLAP_CHARACTERS) -> list[str]:
    """Fallback recursive splitter on sentence/paragraph boundaries for unusually long sections."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + max_chars
        if end >= len(text):
            chunks.append(text[start:].strip())
            break

        # Try to find paragraph break or sentence break
        split_pos = text.rfind("\n\n", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = text.rfind("\n", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = text.rfind(". ", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = end

        chunk = text[start:split_pos].strip()
        if chunk:
            chunks.append(chunk)
        start = max(start + 1, split_pos - overlap)

    return chunks


class DocumentChunkerService:
    """Service to segment documents into semantic chunks for vector indexing and RAG."""

    @staticmethod
    def validate_cv_document_for_rag(cv_doc: CvDocument) -> tuple[bool, str]:
        """Guardrail 1: Validate CV Builder document structure & quality before RAG indexing.

        Rejects empty drafts, stub documents, or CVs lacking professional skills/experience.
        """
        content = cv_doc.content_json or {}
        if not isinstance(content, dict) or not content:
            return False, "Nội dung CV Builder rỗng (chưa nhập dữ liệu)"

        personal = content.get("personal", {})
        if not isinstance(personal, dict):
            return False, "Thiếu thông tin cá nhân cơ bản"

        name = (personal.get("full_name") or "").strip()
        headline = (personal.get("headline") or "").strip()
        summary = (personal.get("summary") or "").strip()

        if not name and not headline:
            return False, "Thiếu họ tên và chức danh nghề nghiệp"

        skills = content.get("skills", [])
        experience = content.get("experience", [])
        projects = content.get("projects", [])
        education = content.get("education", [])

        skill_count = len(skills) if isinstance(skills, list) else (1 if skills else 0)
        exp_count = len(experience) if isinstance(experience, list) else (1 if experience else 0)
        proj_count = len(projects) if isinstance(projects, list) else (1 if projects else 0)
        edu_count = len(education) if isinstance(education, list) else (1 if education else 0)

        # Must have at least skills, experience, projects, or education
        if skill_count < 2 and exp_count == 0 and proj_count == 0 and edu_count == 0:
            return False, "CV Builder chưa có đủ kỹ năng (tối thiểu 2) hoặc kinh nghiệm/dự án/học vấn thực tế"

        # Content length check (excluding json syntax)
        total_text_len = len(name) + len(headline) + len(summary)
        if isinstance(skills, list):
            total_text_len += sum(len(str(s)) for s in skills)
        if isinstance(experience, list):
            for exp in experience:
                if isinstance(exp, dict):
                    total_text_len += (
                        len(str(exp.get("role", "")))
                        + len(str(exp.get("company", "")))
                        + len(str(exp.get("description", "")))
                    )
        if isinstance(projects, list):
            for p in projects:
                if isinstance(p, dict):
                    total_text_len += len(str(p.get("name", ""))) + len(str(p.get("description", "")))

        if total_text_len < MIN_CHUNK_CHARACTERS:
            return False, f"Nội dung CV Builder quá ngắn ({total_text_len} ký tự, yêu cầu tối thiểu {MIN_CHUNK_CHARACTERS} ký tự)"

        return True, "Hợp lệ"

    @staticmethod
    def chunk_cv_document(cv_doc: CvDocument) -> list[DocumentChunkCreate]:
        """Convert a structured CV Builder document into granular semantic chunks."""
        chunks: list[DocumentChunkCreate] = []
        content = cv_doc.content_json or {}
        chunk_idx = 0

        # Candidate Context Prefix for Enrichment
        personal = content.get("personal", {})
        cand_name = (personal.get("full_name") or "").strip() if isinstance(personal, dict) else ""
        cand_headline = (personal.get("headline") or "").strip() if isinstance(personal, dict) else ""
        ctx_prefix = f"Ứng viên: {cand_name}" if cand_name else "Ứng viên"
        if cand_headline:
            ctx_prefix += f" ({cand_headline})"

        # 1. Personal & Executive Summary
        if isinstance(personal, dict):
            summary_parts = []
            if personal.get("full_name"):
                summary_parts.append(f"Họ và tên: {personal['full_name']}")
            if personal.get("headline"):
                summary_parts.append(f"Vị trí chuyên môn: {personal['headline']}")
            if personal.get("summary"):
                summary_parts.append(f"Tóm tắt năng lực: {personal['summary']}")
            if personal.get("location"):
                summary_parts.append(f"Địa điểm: {personal['location']}")

            summary_text = "\n".join(summary_parts)
            if summary_parts and len(summary_text) >= MIN_CHUNK_CHARACTERS:
                chunks.append(
                    DocumentChunkCreate(
                        document_type="cv_document",
                        document_id=cv_doc.id,
                        company_id=None,
                        user_id=cv_doc.user_id,
                        section_type="summary",
                        chunk_index=chunk_idx,
                        content=summary_text,
                        metadata_json=json.dumps({
                            "title": cv_doc.title,
                            "headline": personal.get("headline"),
                        }, ensure_ascii=False),
                    )
                )
                chunk_idx += 1

        # 2. Work Experience (Each job position = 1 distinct semantic chunk with context enrichment)
        experience_list = content.get("experience", [])
        if isinstance(experience_list, list):
            for exp in experience_list:
                if not isinstance(exp, dict):
                    continue
                role = exp.get("role") or exp.get("position") or "Chuyên viên"
                company = exp.get("company") or exp.get("organization") or ""
                period = f"{exp.get('start_date', '')} - {exp.get('end_date', 'Hiện tại')}".strip(" -")

                bullets = exp.get("bullets", [])
                if isinstance(bullets, list):
                    bullets_text = "\n".join(f"• {b}" for b in bullets if b)
                elif isinstance(exp.get("description"), str):
                    bullets_text = exp["description"]
                else:
                    bullets_text = ""

                content_block = f"[{ctx_prefix}] Kinh nghiệm làm việc: {role} tại {company} ({period})\n{bullets_text}".strip()
                if len(content_block) >= MIN_CHUNK_CHARACTERS:
                    for sub_text in _split_text_with_overlap(content_block):
                        if len(sub_text) >= MIN_CHUNK_CHARACTERS:
                            chunks.append(
                                DocumentChunkCreate(
                                    document_type="cv_document",
                                    document_id=cv_doc.id,
                                    company_id=None,
                                    user_id=cv_doc.user_id,
                                    section_type="experience",
                                    chunk_index=chunk_idx,
                                    content=sub_text,
                                    metadata_json=json.dumps({
                                        "role": role,
                                        "company": company,
                                        "period": period,
                                    }, ensure_ascii=False),
                                )
                            )
                            chunk_idx += 1

        # 3. Projects (Each major project = 1 semantic chunk with context enrichment)
        projects_list = content.get("projects", [])
        if isinstance(projects_list, list):
            for proj in projects_list:
                if not isinstance(proj, dict):
                    continue
                name = proj.get("name") or proj.get("title") or "Dự án"
                role = proj.get("role", "")
                tech = proj.get("tech_stack") or proj.get("technologies") or []
                tech_str = ", ".join(tech) if isinstance(tech, list) else str(tech)
                desc = proj.get("description", "")

                content_block = f"[{ctx_prefix}] Dự án: {name} (Vai trò: {role})\nCông nghệ: {tech_str}\nMô tả & Kết quả: {desc}".strip()
                if len(content_block) >= MIN_CHUNK_CHARACTERS:
                    for sub_text in _split_text_with_overlap(content_block):
                        if len(sub_text) >= MIN_CHUNK_CHARACTERS:
                            chunks.append(
                                DocumentChunkCreate(
                                    document_type="cv_document",
                                    document_id=cv_doc.id,
                                    company_id=None,
                                    user_id=cv_doc.user_id,
                                    section_type="project",
                                    chunk_index=chunk_idx,
                                    content=sub_text,
                                    metadata_json=json.dumps({
                                        "project_name": name,
                                        "role": role,
                                        "tech_stack": tech_str,
                                    }, ensure_ascii=False),
                                )
                            )
                            chunk_idx += 1

        # 4. Technical Skills
        skills_data = content.get("skills", [])
        if skills_data:
            if isinstance(skills_data, list):
                skill_items = [s.get("name", str(s)) if isinstance(s, dict) else str(s) for s in skills_data]
                skills_text = f"[{ctx_prefix}] Kỹ năng chuyên môn & Công nghệ: " + ", ".join(skill_items)
            elif isinstance(skills_data, dict):
                skills_text = f"[{ctx_prefix}] Kỹ năng: " + json.dumps(skills_data, ensure_ascii=False)
            else:
                skills_text = f"[{ctx_prefix}] Kỹ năng: {skills_data}"

            if len(skills_text) >= MIN_CHUNK_CHARACTERS:
                chunks.append(
                    DocumentChunkCreate(
                        document_type="cv_document",
                        document_id=cv_doc.id,
                        company_id=None,
                        user_id=cv_doc.user_id,
                        section_type="skills",
                        chunk_index=chunk_idx,
                        content=skills_text,
                        metadata_json=json.dumps({"section": "skills"}, ensure_ascii=False),
                    )
                )
                chunk_idx += 1

        # 5. Education & Certifications
        education_data = content.get("education", [])
        if isinstance(education_data, list) and education_data:
            edu_parts = []
            for edu in education_data:
                if isinstance(edu, dict):
                    school = edu.get("school") or edu.get("institution") or ""
                    major = edu.get("major") or edu.get("degree") or ""
                    period = f"{edu.get('start_year', '')} - {edu.get('end_year', '')}".strip(" -")
                    edu_parts.append(f"Học vấn: {major} tại {school} ({period})")

            edu_text = "\n".join(edu_parts)
            if edu_parts and len(edu_text) >= MIN_CHUNK_CHARACTERS:
                chunks.append(
                    DocumentChunkCreate(
                        document_type="cv_document",
                        document_id=cv_doc.id,
                        company_id=None,
                        user_id=cv_doc.user_id,
                        section_type="education",
                        chunk_index=chunk_idx,
                        content=edu_text,
                        metadata_json=json.dumps({"section": "education"}, ensure_ascii=False),
                    )
                )
                chunk_idx += 1

        return chunks

    @staticmethod
    def chunk_resume(resume: Resume) -> list[DocumentChunkCreate]:
        """Segment uploaded PDF/parsed Resume text into semantic chunks."""
        chunks: list[DocumentChunkCreate] = []
        chunk_idx = 0

        # Candidate Context Prefix for Enrichment
        candidate_role = resume.desired_role or resume.parsed_industry or ""
        ctx_prefix = f"Hồ sơ: {resume.title}" + (f" ({candidate_role})" if candidate_role else "")

        # Title & Summary
        title_block = f"Hồ sơ: {resume.title}\nVị trí mong muốn: {resume.desired_role or 'N/A'}\nNgành nghề: {resume.parsed_industry or 'N/A'}"
        if len(title_block) >= MIN_CHUNK_CHARACTERS:
            chunks.append(
                DocumentChunkCreate(
                    document_type="resume",
                    document_id=resume.id,
                    company_id=None,
                    user_id=resume.user_id,
                    section_type="summary",
                    chunk_index=chunk_idx,
                    content=title_block,
                    metadata_json=json.dumps({
                        "title": resume.title,
                        "desired_role": resume.desired_role,
                        "parsed_industry": resume.parsed_industry,
                    }, ensure_ascii=False),
                )
            )
            chunk_idx += 1

        # Skills from parsed_skills / parsed_key_skills
        skills_raw = resume.parsed_key_skills or resume.parsed_skills
        if skills_raw:
            try:
                skills_val = json.loads(skills_raw)
                if isinstance(skills_val, list):
                    skills_text = f"[{ctx_prefix}] Danh mục kỹ năng: " + ", ".join(str(s) for s in skills_val)
                elif isinstance(skills_val, dict):
                    skills_text = f"[{ctx_prefix}] Kỹ năng phân loại: " + ", ".join(f"{k}: {v}" for k, v in skills_val.items())
                else:
                    skills_text = f"[{ctx_prefix}] Kỹ năng: {skills_raw}"
            except Exception:
                skills_text = f"[{ctx_prefix}] Kỹ năng: {skills_raw}"

            if len(skills_text) >= MIN_CHUNK_CHARACTERS:
                chunks.append(
                    DocumentChunkCreate(
                        document_type="resume",
                        document_id=resume.id,
                        company_id=None,
                        user_id=resume.user_id,
                        section_type="skills",
                        chunk_index=chunk_idx,
                        content=skills_text,
                        metadata_json=json.dumps({"section": "skills"}, ensure_ascii=False),
                    )
                )
                chunk_idx += 1

        # Experience from parsed_experience or raw_text
        if resume.parsed_experience:
            try:
                exp_data = json.loads(resume.parsed_experience)
                if isinstance(exp_data, list):
                    for item in exp_data:
                        text_item = str(item)
                        content_block = f"[{ctx_prefix}] Kinh nghiệm làm việc: {text_item}"
                        for sub_text in _split_text_with_overlap(content_block):
                            if len(sub_text) >= MIN_CHUNK_CHARACTERS:
                                chunks.append(
                                    DocumentChunkCreate(
                                        document_type="resume",
                                        document_id=resume.id,
                                        company_id=None,
                                        user_id=resume.user_id,
                                        section_type="experience",
                                        chunk_index=chunk_idx,
                                        content=sub_text,
                                        metadata_json=json.dumps({"section": "experience"}, ensure_ascii=False),
                                    )
                                )
                                chunk_idx += 1
            except Exception:
                pass

        # Fallback to raw_text segmentation if parsed sections are sparse
        if len(chunks) <= 2 and resume.raw_text:
            # Segment raw text by major Vietnamese resume headers
            sections = re.split(
                r"(?i)(?:kinh nghiệm làm việc|kinh nghiệm|kinh nghiem|dự án|kỹ năng|ky nang|học vấn|hoc van):",
                resume.raw_text,
            )
            for s in sections:
                cleaned = s.strip()
                if len(cleaned) >= MIN_CHUNK_CHARACTERS:
                    for sub_text in _split_text_with_overlap(cleaned):
                        if len(sub_text) >= MIN_CHUNK_CHARACTERS:
                            chunks.append(
                                DocumentChunkCreate(
                                    document_type="resume",
                                    document_id=resume.id,
                                    company_id=None,
                                    user_id=resume.user_id,
                                    section_type="general",
                                    chunk_index=chunk_idx,
                                    content=f"[{ctx_prefix}] {sub_text}",
                                    metadata_json=json.dumps({"source": "raw_text"}, ensure_ascii=False),
                                )
                            )
                            chunk_idx += 1

        return chunks

    @staticmethod
    def chunk_job(job: Job) -> list[DocumentChunkCreate]:
        """Segment a Job listing into semantic requirement and responsibility chunks."""
        chunks: list[DocumentChunkCreate] = []
        chunk_idx = 0

        # 1. Job Header & Overview
        overview_text = (
            f"Tin tuyển dụng: {job.title}\n"
            f"Cấp bậc: {job.experience_level.value if hasattr(job.experience_level, 'value') else job.experience_level}\n"
            f"Hình thức làm việc: {job.job_type.value if hasattr(job.job_type, 'value') else job.job_type}\n"
            f"Địa điểm: {job.location or 'Toàn quốc'}\n"
            f"Mô tả chung: {job.description}"
        ).strip()

        for sub_text in _split_text_with_overlap(overview_text):
            chunks.append(
                DocumentChunkCreate(
                    document_type="job",
                    document_id=job.id,
                    company_id=job.company_id,
                    user_id=job.employer_id,
                    section_type="summary",
                    chunk_index=chunk_idx,
                    content=sub_text,
                    metadata_json=json.dumps({
                        "job_title": job.title,
                        "location": job.location,
                        "experience_level": str(job.experience_level),
                    }, ensure_ascii=False),
                )
            )
            chunk_idx += 1

        # 2. Requirements (Technical & Soft Skills)
        if job.requirements:
            req_prefix = f"Yêu cầu chuyên môn cho vị trí {job.title}:\n"
            for sub_text in _split_text_with_overlap(req_prefix + job.requirements):
                chunks.append(
                    DocumentChunkCreate(
                        document_type="job",
                        document_id=job.id,
                        company_id=job.company_id,
                        user_id=job.employer_id,
                        section_type="requirement",
                        chunk_index=chunk_idx,
                        content=sub_text,
                        metadata_json=json.dumps({
                            "job_title": job.title,
                            "section": "requirements",
                        }, ensure_ascii=False),
                    )
                )
                chunk_idx += 1

        # 3. Benefits & Culture
        if job.benefits:
            benefit_prefix = f"Quyền lợi và đãi ngộ vị trí {job.title}:\n"
            for sub_text in _split_text_with_overlap(benefit_prefix + job.benefits):
                chunks.append(
                    DocumentChunkCreate(
                        document_type="job",
                        document_id=job.id,
                        company_id=job.company_id,
                        user_id=job.employer_id,
                        section_type="benefit",
                        chunk_index=chunk_idx,
                        content=sub_text,
                        metadata_json=json.dumps({
                            "job_title": job.title,
                            "section": "benefits",
                        }, ensure_ascii=False),
                    )
                )
                chunk_idx += 1

        return chunks


document_chunker = DocumentChunkerService()

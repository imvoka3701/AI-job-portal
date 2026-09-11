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
    def chunk_cv_document(cv_doc: CvDocument) -> list[DocumentChunkCreate]:
        """Convert a structured CV Builder document into granular semantic chunks."""
        chunks: list[DocumentChunkCreate] = []
        content = cv_doc.content_json or {}
        chunk_idx = 0

        # 1. Personal & Executive Summary
        personal = content.get("personal", {})
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

            if summary_parts:
                chunks.append(
                    DocumentChunkCreate(
                        document_type="cv_document",
                        document_id=cv_doc.id,
                        company_id=None,
                        user_id=cv_doc.user_id,
                        section_type="summary",
                        chunk_index=chunk_idx,
                        content="\n".join(summary_parts),
                        metadata_json=json.dumps({
                            "title": cv_doc.title,
                            "headline": personal.get("headline"),
                        }, ensure_ascii=False),
                    )
                )
                chunk_idx += 1

        # 2. Work Experience (Each job position = 1 distinct semantic chunk)
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

                content_block = f"Kinh nghiệm làm việc: {role} tại {company} ({period})\n{bullets_text}".strip()
                if len(content_block) > 30:
                    for sub_text in _split_text_with_overlap(content_block):
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

        # 3. Projects (Each major project = 1 semantic chunk)
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

                content_block = f"Dự án: {name} (Vai trò: {role})\nCông nghệ: {tech_str}\nMô tả & Kết quả: {desc}".strip()
                if len(content_block) > 20:
                    for sub_text in _split_text_with_overlap(content_block):
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
                skills_text = "Kỹ năng chuyên môn & Công nghệ: " + ", ".join(skill_items)
            elif isinstance(skills_data, dict):
                skills_text = "Kỹ năng: " + json.dumps(skills_data, ensure_ascii=False)
            else:
                skills_text = f"Kỹ năng: {skills_data}"

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

            if edu_parts:
                chunks.append(
                    DocumentChunkCreate(
                        document_type="cv_document",
                        document_id=cv_doc.id,
                        company_id=None,
                        user_id=cv_doc.user_id,
                        section_type="education",
                        chunk_index=chunk_idx,
                        content="\n".join(edu_parts),
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

        # Title & Summary
        title_block = f"Hồ sơ: {resume.title}\nVị trí mong muốn: {resume.desired_role or 'N/A'}\nNgành nghề: {resume.parsed_industry or 'N/A'}"
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
                    skills_text = "Danh mục kỹ năng: " + ", ".join(str(s) for s in skills_val)
                elif isinstance(skills_val, dict):
                    skills_text = "Kỹ năng phân loại: " + ", ".join(f"{k}: {v}" for k, v in skills_val.items())
                else:
                    skills_text = f"Kỹ năng: {skills_raw}"
            except Exception:
                skills_text = f"Kỹ năng: {skills_raw}"

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
                        for sub_text in _split_text_with_overlap(text_item):
                            chunks.append(
                                DocumentChunkCreate(
                                    document_type="resume",
                                    document_id=resume.id,
                                    company_id=None,
                                    user_id=resume.user_id,
                                    section_type="experience",
                                    chunk_index=chunk_idx,
                                    content=f"Kinh nghiệm làm việc: {sub_text}",
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
                if len(cleaned) > 40:
                    for sub_text in _split_text_with_overlap(cleaned):
                        chunks.append(
                            DocumentChunkCreate(
                                document_type="resume",
                                document_id=resume.id,
                                company_id=None,
                                user_id=resume.user_id,
                                section_type="general",
                                chunk_index=chunk_idx,
                                content=sub_text,
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

import json
import logging
import math
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_call_log import AIFeature
from app.models.cv_document import CvDocument
from app.models.resume import Resume
from app.schemas.ai import AIMatchResponse, MatchBreakdown
from app.services.deepseek_client import deepseek_client
from app.services.prompt_loader import get_system_prompt

logger = logging.getLogger(__name__)


def extract_cv_document_text(cv_doc: CvDocument | dict[str, Any] | None) -> str:
    """Extract concatenated plain text from structured CV Builder document for embedding and matching."""
    if not cv_doc:
        return ""

    if isinstance(cv_doc, CvDocument):
        content = cv_doc.content_json or {}
    elif isinstance(cv_doc, dict):
        content = cv_doc.get("content_json") or cv_doc
    else:
        return ""

    parts: list[str] = []

    # Personal info
    personal = content.get("personal", {})
    if isinstance(personal, dict):
        for field in ["full_name", "headline", "location"]:
            val = personal.get(field)
            if val and isinstance(val, str) and val.strip():
                parts.append(val.strip())

    # Summary
    summary = content.get("summary")
    if summary and isinstance(summary, str) and summary.strip():
        parts.append(summary.strip())

    # Skills
    skills = content.get("skills", [])
    if isinstance(skills, list):
        skill_strs = []
        for s in skills:
            if isinstance(s, str) and s.strip():
                skill_strs.append(s.strip())
            elif isinstance(s, dict) and s.get("name"):
                skill_strs.append(str(s["name"]).strip())
        if skill_strs:
            parts.append("Kỹ năng: " + ", ".join(skill_strs))

    # Experience
    experiences = content.get("experience", [])
    if isinstance(experiences, list):
        for exp in experiences:
            if isinstance(exp, dict):
                exp_parts = []
                if exp.get("title"):
                    exp_parts.append(str(exp["title"]))
                if exp.get("company"):
                    exp_parts.append(str(exp["company"]))
                if exp.get("description"):
                    exp_parts.append(str(exp["description"]))
                if exp.get("highlights") and isinstance(exp["highlights"], list):
                    exp_parts.extend(str(h) for h in exp["highlights"] if h)
                if exp_parts:
                    parts.append(" - ".join(exp_parts))

    # Education
    educations = content.get("education", [])
    if isinstance(educations, list):
        for edu in educations:
            if isinstance(edu, dict):
                edu_parts = []
                if edu.get("degree"):
                    edu_parts.append(str(edu["degree"]))
                if edu.get("school"):
                    edu_parts.append(str(edu["school"]))
                if edu.get("field_of_study"):
                    edu_parts.append(str(edu["field_of_study"]))
                if edu_parts:
                    parts.append(" - ".join(edu_parts))

    # Projects
    projects = content.get("projects", [])
    if isinstance(projects, list):
        for proj in projects:
            if isinstance(proj, dict):
                proj_parts = []
                if proj.get("name"):
                    proj_parts.append(str(proj["name"]))
                if proj.get("description"):
                    proj_parts.append(str(proj["description"]))
                if proj_parts:
                    parts.append(" - ".join(proj_parts))

    return "\n".join(parts)


def _cosine_similarity_python(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors using pure Python.

    Used as fallback when pgvector is not available (e.g., SQLite tests).
    """
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class AIMatchingService:
    async def _run_deep_rubric_analysis(
        self,
        *,
        resume_text: str,
        job: Any,
        base_cosine_score: float,
        db: Session | None = None,
    ) -> AIMatchResponse:
        """Run deep LLM rubric analysis to evaluate skills, experience, and domain fit."""
        system_prompt = get_system_prompt(AIFeature.MATCHING, db=db)

        job_title = getattr(job, "title", "Công việc")
        job_level = getattr(job, "experience_level", "")
        if hasattr(job_level, "value"):
            job_level = job_level.value
        job_type = getattr(job, "job_type", "")
        if hasattr(job_type, "value"):
            job_type = job_type.value
        job_loc = getattr(job, "location", "N/A") or "N/A"
        job_req = getattr(job, "requirements", "") or "Không có yêu cầu cụ thể."
        job_desc = getattr(job, "description", "") or "Không có mô tả chi tiết."

        user_prompt = (
            f"=== BẢN MÔ TẢ CÔNG VIỆC (JOB DESCRIPTION) ===\n"
            f"Vị trí: {job_title}\n"
            f"Cấp bậc yêu cầu: {job_level}\n"
            f"Hình thức làm việc: {job_type}\n"
            f"Địa điểm: {job_loc}\n"
            f"Yêu cầu công việc:\n{job_req}\n"
            f"Mô tả công việc:\n{job_desc[:1500]}\n\n"
            f"=== HỒ SƠ ỨNG VIÊN (CANDIDATE CV) ===\n"
            f"{resume_text[:2500]}\n\n"
            f"=== YÊU CẦU NGÔN NGỮ ĐẦU RA ===\n"
            f"BẮT BUỘC trả lời 100% bằng TIẾNG VIỆT (bao gồm explanation, strengths, gaps, deal_breakers, interview_questions). "
            f"Chỉ giữ nguyên tên riêng của công nghệ (Python, FastAPI, Docker, React...). "
            f"TUYỆT ĐỐI KHÔNG xuất hiện câu chữ tiếng Anh trong phần giải thích và nhận xét."
        )

        try:
            response = await deepseek_client.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=settings.LLM_MODEL,
                response_format={"type": "json_object"},
                feature=AIFeature.MATCHING,
                db=db,
            )
            content = response.get("choices", [])[0].get("message", {}).get("content", "")
            if not content:
                raise ValueError("Empty LLM response")

            data = json.loads(content)

            skills_score = float(data.get("skills_score", base_cosine_score))
            experience_score = float(data.get("experience_score", base_cosine_score))
            domain_score = float(data.get("domain_score", base_cosine_score))

            strengths = [str(s) for s in data.get("strengths", []) if s]
            gaps = [str(g) for g in data.get("gaps", []) if g]
            deal_breakers = [str(d) for d in data.get("deal_breakers", []) if d]
            explanation = str(data.get("explanation") or f"Độ tương thích tổng thể: {base_cosine_score:.1f}%")
            interview_questions = [str(q) for q in data.get("interview_questions", []) if q]

            # Weighted Formula: 35% Vector Semantic + 40% Hard Skills + 25% Experience Level
            weighted = 0.35 * base_cosine_score + 0.40 * skills_score + 0.25 * experience_score

            # Deal-breaker Penalty Cap: if serious deal-breaker exists, cap at 60%
            if deal_breakers:
                final_score = round(min(weighted, 60.0), 1)
            else:
                final_score = round(max(0.0, min(100.0, weighted)), 1)

            return AIMatchResponse(
                score=final_score,
                explanation=explanation,
                strengths=strengths,
                gaps=gaps,
                breakdown=MatchBreakdown(
                    skills_score=round(max(0.0, min(100.0, skills_score)), 1),
                    experience_score=round(max(0.0, min(100.0, experience_score)), 1),
                    domain_score=round(max(0.0, min(100.0, domain_score)), 1),
                ),
                deal_breakers=deal_breakers,
                interview_questions=interview_questions,
            )
        except Exception as exc:
            logger.warning("Deep rubric matching failed, falling back to base cosine score: %s", exc)
            return AIMatchResponse(
                score=base_cosine_score,
                explanation=f"AI matching score based on cosine similarity: {base_cosine_score:.1f}%",
                strengths=[],
                gaps=[],
                breakdown=MatchBreakdown(
                    skills_score=base_cosine_score,
                    experience_score=base_cosine_score,
                    domain_score=base_cosine_score,
                ),
                deal_breakers=[],
                interview_questions=[],
            )

    async def compute_match(
        self,
        db: Session,
        *,
        resume: Resume,
        job_embedding: list[float],
        job: Any | None = None,
        deep_analysis: bool = False,
    ) -> AIMatchResponse:
        """Compute cosine similarity between a resume embedding and a job embedding."""
        if resume.embedding is None and resume.raw_text and resume.raw_text.strip():
            try:
                from app.services.embedding_service import generate_embedding

                resume.embedding = generate_embedding(resume.raw_text)
                db.commit()
                db.refresh(resume)
            except Exception:
                logger.exception("Failed to lazily generate embedding for resume %s", resume.id)

        if resume.embedding is None:
            return AIMatchResponse(
                score=0.0,
                explanation="Resume has no embedding. Please upload and parse the CV first.",
                strengths=[],
                gaps=["Resume embedding not generated"],
            )

        resume_embedding: list[float] = list(resume.embedding)  # type: ignore[assignment]
        base_match = await self.compute_match_for_embedding(
            db,
            candidate_embedding=resume_embedding,
            job_embedding=job_embedding,
            resume_id=resume.id,
        )

        if deep_analysis and job and resume.raw_text:
            return await self._run_deep_rubric_analysis(
                resume_text=resume.raw_text,
                job=job,
                base_cosine_score=base_match.score,
                db=db,
            )

        return base_match

    async def compute_match_for_cv_document(
        self,
        db: Session,
        *,
        cv_document: CvDocument,
        job_embedding: list[float],
        job: Any | None = None,
        deep_analysis: bool = False,
    ) -> AIMatchResponse:
        """Compute cosine similarity between a CV Builder document and a job embedding."""
        text_content = extract_cv_document_text(cv_document)
        if not text_content.strip():
            return AIMatchResponse(
                score=0.0,
                explanation="Hồ sơ CV Builder chưa có nội dung văn bản để phân tích.",
                strengths=[],
                gaps=["Hồ sơ chưa có thông tin"],
            )

        try:
            from app.services.embedding_service import generate_embedding

            cv_embedding = generate_embedding(text_content)
        except Exception:
            logger.exception("Failed to generate embedding for CV document %s", cv_document.id)
            return AIMatchResponse(
                score=0.0,
                explanation="Không thể trích xuất vector từ hồ sơ CV Builder.",
                strengths=[],
                gaps=["Lỗi sinh vector"],
            )

        base_match = await self.compute_match_for_embedding(
            db, candidate_embedding=cv_embedding, job_embedding=job_embedding
        )

        if deep_analysis and job:
            return await self._run_deep_rubric_analysis(
                resume_text=text_content,
                job=job,
                base_cosine_score=base_match.score,
                db=db,
            )

        return base_match

    async def compute_match_for_embedding(
        self,
        db: Session,
        *,
        candidate_embedding: list[float],
        job_embedding: list[float],
        resume_id: int | None = None,
    ) -> AIMatchResponse:
        """Compute cosine similarity between candidate embedding and job embedding."""
        clean_job_str = "[" + ",".join(str(float(x)) for x in job_embedding) + "]"

        similarity = 0.0
        try:
            if resume_id is not None:
                query = text(
                    "SELECT 1 - ((:job_emb)::vector <=> (SELECT embedding FROM resumes WHERE id = :resume_id))"
                )
                result = db.execute(query, {"job_emb": clean_job_str, "resume_id": resume_id})
            else:
                clean_cand_str = "[" + ",".join(str(float(x)) for x in candidate_embedding) + "]"
                query = text("SELECT 1 - ((:job_emb)::vector <=> (:cand_emb)::vector)")
                result = db.execute(query, {"job_emb": clean_job_str, "cand_emb": clean_cand_str})
            similarity = result.scalar() or 0.0
        except Exception:
            logger.debug("pgvector unavailable — using Python cosine similarity fallback")
            similarity = _cosine_similarity_python(
                [float(x) for x in job_embedding],
                [float(x) for x in candidate_embedding],
            )

        score = round(max(0.0, min(100.0, float(similarity) * 100)), 2)
        return AIMatchResponse(
            score=score,
            explanation=f"AI matching score based on cosine similarity: {similarity:.4f}",
            strengths=[],
            gaps=[],
        )

    async def find_top_matches(
        self,
        db: Session,
        *,
        job_embedding: list[float],
        limit: int = 10,
    ) -> list[dict]:
        """Find top N resumes most similar to a job embedding using HNSW index."""
        clean_emb_str = "[" + ",".join(str(float(x)) for x in job_embedding) + "]"
        try:
            result = db.execute(
                text(
                    """
                    SELECT id, user_id, title,
                           1 - (embedding <=> :embedding::vector) AS similarity
                    FROM resumes
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> :embedding::vector
                    LIMIT :limit
                    """
                ),
                {"embedding": clean_emb_str, "limit": limit},
            )
            return [
                {
                    "resume_id": row.id,
                    "user_id": row.user_id,
                    "title": row.title,
                    "score": row.similarity,
                }
                for row in result
            ]
        except Exception:
            logger.debug("pgvector unavailable — top matches not supported in test env")
            return []


ai_matching_service = AIMatchingService()

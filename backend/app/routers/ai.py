"""AI router — matching, CV evaluation, roadmap suggestion endpoints."""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_optional_user
from app.core.company_permissions import (
    CompanyPermission,
    build_company_context,
    require_application_scope,
    require_job_scope,
)
from app.crud.job import crud_job
from app.crud.resume import crud_resume
from app.database import get_db
from app.models.user import User, UserRole
from app.crud.application import crud_application
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantQuickSuggestion,
)
from app.services.assistant_service import assistant_service
from app.schemas.ai import (
    AIMatchRequest,
    AIMatchResponse,
    CVEvaluationRequest,
    CVEvaluationResponse,
    CVSummarizeRequest,
    CVSummarizeResponse,
    GenerateEmailRequest,
    GenerateEmailResponse,
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
    RoadmapRequest,
    RoadmapResponse,
    CvExperienceSuggestionRequest,
    CvExperienceSuggestionResponse,
    CvSkillsSuggestionRequest,
    CvSkillsSuggestionResponse,
    CvSummarySuggestionRequest,
    CvSummarySuggestionResponse,
)
from app.services.ai_matching import ai_matching_service
from app.services.cv_evaluator import cv_evaluator_service
from app.services.cv_summarizer import cv_summarizer_service
from app.services.email_generator import email_generator_service
from app.services.interview_questions import interview_questions_service
from app.services.roadmap_suggest import roadmap_suggest_service
from app.crud.cv_document import crud_cv_document
from app.services.cv_suggestions import cv_suggestion_service
from app.services.ai_errors import ai_http_exception
from app.services.ai_audit import ai_audit
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])


def _get_cv_document(db: Session, document_id: int, user_id: int):
    document = crud_cv_document.get_by_id(db, document_id=document_id, user_id=user_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV Builder document not found")
    return document


def _authorize_resume_access(
    db: Session,
    *,
    current_user: User,
    resume,
    job_id: int | None = None,
) -> None:
    # 1. Candidate Validation: Verify ownership
    if current_user.role == UserRole.CANDIDATE:
        if resume.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Bạn không có quyền truy cập CV này."
            )
        return

    # 2. Employer Validation: Role & AI Permission
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không có quyền truy cập CV này."
        )
        
    context = build_company_context(db, current_user)
    if not context.has(CompanyPermission.AI_RECRUITMENT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không có quyền sử dụng tính năng AI tuyển dụng. Vui lòng liên hệ Admin."
        )

    # 3. Target Job Verification (if specific job_id is provided)
    # Check if the employer has access to the specific department associated with the target job
    if job_id is not None:
        target_job = crud_job.get_by_id(db, job_id=job_id)
        if not target_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Công việc yêu cầu không tồn tại."
            )
        require_job_scope(db, context=context, job=target_job)

    # 4. Tenant Isolation & Department Scope for the Resume
    # Ensure the resume was explicitly submitted to a job belonging to the current employer's company
    applications = crud_application.get_by_resume(db, resume_id=resume.id)
    if not applications:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="CV này chưa được nộp cho công việc nào thuộc công ty của bạn."
        )

    has_valid_scope = False
    for application in applications:
        try:
            # This verifies the employer has access to the specific department associated with the application's job
            require_application_scope(db, context=context, application=application)
            has_valid_scope = True
            break
        except HTTPException:
            continue

    if not has_valid_scope:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="CV nằm ngoài phạm vi phòng ban hoặc dữ liệu tuyển dụng được phân công của bạn."
        )


@router.post("/cv/suggest-summary", response_model=CvSummarySuggestionResponse)
async def suggest_cv_summary(data: CvSummarySuggestionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CvSummarySuggestionResponse:
    _get_cv_document(db, data.cv_document_id, current_user.id)
    started = time.monotonic()
    try:
        result = await cv_suggestion_service.suggest_summary(current_text=data.current_text, target_role=data.target_role, language=data.language)
        ai_audit.log_success(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="cv/suggest-summary",
            model=settings.LLM_MODEL,
            input_summary=f"role={data.target_role}, lang={data.language}, text_len={len(data.current_text)}",
            output_summary=f"suggestion_len={len(result.suggestion)}",
            started_at=started,
        )
        return result
    except Exception as exc:
        logger.exception("CV summary suggestion failed for document %s", data.cv_document_id)
        ai_audit.log_failure(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="cv/suggest-summary",
            model=settings.LLM_MODEL,
            input_summary=f"role={data.target_role}, lang={data.language}",
            exc=exc,
            started_at=started,
        )
        raise ai_http_exception(exc)


@router.post("/cv/rewrite-experience", response_model=CvExperienceSuggestionResponse)
async def rewrite_cv_experience(data: CvExperienceSuggestionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CvExperienceSuggestionResponse:
    _get_cv_document(db, data.cv_document_id, current_user.id)
    # Fetch job context if provided — enables more targeted bullet rewrites
    job_context = ""
    if data.job_id:
        job = crud_job.get_by_id(db, job_id=data.job_id)
        if job:
            job_context = " ".join(part for part in [job.title, job.description, job.requirements] if part)
    started = time.monotonic()
    try:
        result = await cv_suggestion_service.rewrite_experience(
            experience_text=data.experience_text,
            target_role=data.target_role,
            language=data.language,
            job_context=job_context,
        )
        ai_audit.log_success(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="cv/rewrite-experience",
            model=settings.LLM_MODEL,
            input_summary=f"role={data.target_role}, lang={data.language}, job_id={data.job_id}, text_len={len(data.experience_text)}",
            output_summary=f"bullets={len(result.bullets)}",
            started_at=started,
        )
        return result
    except Exception as exc:
        logger.exception("CV experience rewrite failed for document %s", data.cv_document_id)
        ai_audit.log_failure(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="cv/rewrite-experience",
            model=settings.LLM_MODEL,
            input_summary=f"role={data.target_role}, lang={data.language}, job_id={data.job_id}",
            exc=exc,
            started_at=started,
        )
        raise ai_http_exception(exc)


@router.post("/cv/suggest-skills", response_model=CvSkillsSuggestionResponse)
async def suggest_cv_skills(data: CvSkillsSuggestionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CvSkillsSuggestionResponse:
    document = _get_cv_document(db, data.cv_document_id, current_user.id)
    job_context = ""
    if data.job_id:
        job = crud_job.get_by_id(db, job_id=data.job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        job_context = " ".join(part for part in [job.title, job.description, job.requirements] if part)
    try:
        return await cv_suggestion_service.suggest_skills(current_skills=data.current_skills, target_role=data.target_role, job_context=job_context, language=data.language)
    except Exception as exc:
        logger.exception("CV skills suggestion failed for document %s", document.id)
        raise ai_http_exception(exc)


@router.post("/match", response_model=AIMatchResponse, summary="Compute AI matching score")
async def match_resume_to_job(
    data: AIMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AIMatchResponse:
    """Compute cosine similarity between resume and job embeddings."""
    resume = crud_resume.get_by_id(db, resume_id=data.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    _authorize_resume_access(db, current_user=current_user, resume=resume, job_id=data.job_id)

    job = crud_job.get_by_id(db, job_id=data.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.embedding is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Job posting has no embedding yet. The JD may still be processing.",
        )

    job_embedding: list[float] = job.embedding  # type: ignore[assignment]
    return await ai_matching_service.compute_match(db, resume=resume, job_embedding=job_embedding)


@router.post("/evaluate", response_model=CVEvaluationResponse, summary="Evaluate CV quality")
async def evaluate_cv(
    data: CVEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CVEvaluationResponse:
    """Send CV to LLM for quality evaluation and suggestions.

    Retries up to 2 times if the LLM returns malformed JSON. Returns HTTP 502
    if all attempts fail.
    """
    resume = crud_resume.get_by_id(db, resume_id=data.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    _authorize_resume_access(db, current_user=current_user, resume=resume)

    if not resume.raw_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CV has no text content to evaluate.",
        )

    started = time.monotonic()
    try:
        result = await cv_evaluator_service.evaluate(resume_text=resume.raw_text, db=db)
        ai_audit.log_success(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="evaluate",
            model=settings.LLM_MODEL,
            input_summary=f"resume_id={data.resume_id}, text_len={len(resume.raw_text)}",
            output_summary=f"score={result.overall_score}, skills={len(result.skill_analysis)}, suggestions={len(result.suggestions)}",
            started_at=started,
        )
        return result
    except Exception as exc:
        logger.exception("CV evaluation failed for resume %s", data.resume_id)
        ai_audit.log_failure(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="evaluate",
            model=settings.LLM_MODEL,
            input_summary=f"resume_id={data.resume_id}",
            exc=exc,
            started_at=started,
        )
        raise ai_http_exception(exc)


@router.post("/roadmap", response_model=RoadmapResponse, summary="Suggest career roadmap")
async def suggest_roadmap(
    data: RoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RoadmapResponse:
    """Generate personalized career roadmap based on resume and target role.

    Retries up to 2 times if the LLM returns malformed JSON. Returns HTTP 502
    if all attempts fail.
    """
    resume = crud_resume.get_by_id(db, resume_id=data.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if current_user.role != UserRole.CANDIDATE or resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Roadmap chỉ dành cho CV của ứng viên hiện tại.")

    if not resume.raw_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CV has no text content to generate roadmap.",
        )

    started = time.monotonic()
    try:
        result = await roadmap_suggest_service.suggest(
            resume_text=resume.raw_text,
            parsed_skills=[],
            target_role=data.target_role,
            db=db,
        )
        ai_audit.log_success(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="roadmap",
            model=settings.LLM_MODEL,
            input_summary=f"resume_id={data.resume_id}, target_role={data.target_role}",
            output_summary=f"steps={len(result.steps)}, months={result.estimated_months}, level={result.current_level}",
            started_at=started,
        )
        return result
    except Exception as exc:
        logger.exception("Roadmap suggestion failed for resume %s", data.resume_id)
        ai_audit.log_failure(
            user_id=current_user.id,
            user_role=current_user.role.value,
            endpoint="roadmap",
            model=settings.LLM_MODEL,
            input_summary=f"resume_id={data.resume_id}, target_role={data.target_role}",
            exc=exc,
            started_at=started,
        )
        raise ai_http_exception(exc)


@router.post("/summarize-cv", response_model=CVSummarizeResponse, summary="Summarize CV against a job")
async def summarize_cv(
    data: CVSummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CVSummarizeResponse:
    """Summarize how a candidate's CV matches a specific job posting.

    Unlike /ai/evaluate (generic CV quality) and /ai/match (cosine %),
    this endpoint produces human-readable fit points and interview questions
    tailored to the specific job description.

    Retries up to 2 times if the LLM returns malformed JSON.
    """
    resume = crud_resume.get_by_id(db, resume_id=data.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    _authorize_resume_access(db, current_user=current_user, resume=resume, job_id=data.job_id)
    if not resume.raw_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CV has no text content.",
        )

    job = crud_job.get_by_id(db, job_id=data.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    jd_text = " ".join(
        p for p in [job.title, job.description, job.requirements, job.benefits] if p
    )

    try:
        return await cv_summarizer_service.summarize(
            cv_text=resume.raw_text, job_description=jd_text, db=db,
        )
    except Exception as exc:
        logger.exception("CV summarization failed for resume %s, job %s", data.resume_id, data.job_id)
        raise ai_http_exception(exc)


@router.post(
    "/interview-questions",
    response_model=InterviewQuestionsResponse,
    summary="Generate targeted interview questions based on selected skills",
)
async def generate_interview_questions(
    data: InterviewQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InterviewQuestionsResponse:
    """Generate focused interview questions for specific skills.

    Unlike /ai/summarize-cv (general interview topics), this endpoint lets HR
    actively SELECT which skills to probe deeply. The LLM generates:
      - question: The actual question to ask the candidate.
      - purpose: What the interviewer is evaluating.
      - skill_related: Which requested skill this targets.

    Minimum 2 questions per skill. Retries up to 2 times on JSON parse failure.
    """
    if not data.skills_to_assess:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="skills_to_assess must not be empty.",
        )

    resume = crud_resume.get_by_id(db, resume_id=data.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    _authorize_resume_access(db, current_user=current_user, resume=resume, job_id=data.job_id)
    if not resume.raw_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CV has no text content.",
        )

    job = crud_job.get_by_id(db, job_id=data.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    jd_text = " ".join(
        p for p in [job.title, job.description, job.requirements, job.benefits] if p
    )

    try:
        return await interview_questions_service.generate(
            cv_text=resume.raw_text,
            job_description=jd_text,
            skills_to_assess=data.skills_to_assess,
            db=db,
        )
    except Exception as exc:
        logger.exception(
            "Interview questions generation failed for resume %s, job %s, skills=%s",
            data.resume_id, data.job_id, data.skills_to_assess,
        )
        raise ai_http_exception(exc)


@router.post(
    "/generate-email",
    response_model=GenerateEmailResponse,
    summary="Generate a draft email for an applicant (invite/reject/offer)",
)
async def generate_email(
    data: GenerateEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GenerateEmailResponse:
    """Generate a professional Vietnamese email draft for an applicant.

    email_type must be one of:
      - "invite": Interview invitation with date/time/location placeholders.
      - "reject": Polite rejection — no specific reasons (legal safety).
      - "offer": Job offer congratulations with next-step guidance.

    The output is a DRAFT — HR must review before sending.
    No actual email is sent by this endpoint.
    """
    valid_types = {"invite", "reject", "offer"}
    if data.email_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"email_type must be one of: {sorted(valid_types)}",
        )

    app = crud_application.get_by_id_with_relations(db, application_id=data.application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    context = build_company_context(db, current_user)
    if not context.has(CompanyPermission.AI_RECRUITMENT):
        raise HTTPException(status_code=403, detail="Bạn không có quyền sử dụng AI tuyển dụng.")
    require_application_scope(db, context=context, application=app)

    candidate_name = app.candidate.full_name if app.candidate else f"Ứng viên #{app.candidate_id}"
    job_title = app.job.title if app.job else f"Vị trí #{app.job_id}"
    company_name = (
        context.company.name
    )

    cv_summary = None
    if app.resume and app.resume.raw_text:
        cv_summary = app.resume.raw_text[:500]  # enough context, not the whole CV

    try:
        return await email_generator_service.generate(
            email_type=data.email_type,
            candidate_name=candidate_name,
            job_title=job_title,
            company_name=company_name,
            cv_summary=cv_summary,
            db=db,
        )
    except Exception as exc:
        logger.exception(
            "Email generation failed for application %s, type=%s",
            data.application_id, data.email_type,
        )
        raise ai_http_exception(exc)


@router.post(
    "/assistant/chat",
    response_model=AssistantChatResponse,
    summary="JobPortal AI Copilot conversational chat",
    description="Context-aware chat assistant for candidates, employers, guests, and admins.",
)
async def assistant_chat(
    data: AssistantChatRequest,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> AssistantChatResponse:
    """Process a chat interaction with JobPortal AI Copilot."""
    if not data.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tin nhắn không được để trống.",
        )
    return await assistant_service.process_chat(
        messages=data.messages,
        context=data.context,
        current_user=current_user,
        db=db,
    )


@router.get(
    "/assistant/suggestions",
    response_model=list[AssistantQuickSuggestion],
    summary="Get 1-click quick suggestion chips",
    description="Returns dynamic prompt suggestions tailored to the current URL path and user role.",
)
def assistant_suggestions(
    path: str = "/",
    role: str | None = None,
    current_user: User | None = Depends(get_optional_user),
) -> list[AssistantQuickSuggestion]:
    """Get context-aware 1-click prompt chips."""
    effective_role = role or (current_user.role if current_user else "guest")
    return assistant_service.get_quick_suggestions(path=path, role=effective_role)


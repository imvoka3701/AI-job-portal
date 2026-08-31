"""Admin AI Control Panel router — prompt management and call log endpoints.

Tat ca endpoint deu yeu cau role Admin.
Docs: DESIGN_AI_ADMIN_CONTROL.md Section 6.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database import get_db
from app.models.ai_call_log import AICallLog, AICallStatus, AIFeature
from app.models.ai_prompt_config import AIPromptConfig
from app.models.user import User, UserRole
from app.services.prompt_loader import HARDCODED_FALLBACK_PROMPTS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/ai", tags=["Admin — AI Control"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────


class AIPromptConfigOut(BaseModel):
    id: int
    feature: str
    system_prompt: str
    user_prompt_template: str | None
    is_active: bool
    updated_by: int | None
    updated_by_name: str | None
    updated_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class AIPromptUpdateIn(BaseModel):
    system_prompt: str | None = None
    user_prompt_template: str | None = None
    is_active: bool | None = None


class AIPromptTestResult(BaseModel):
    feature: str
    sample_input: str
    ai_response: str
    duration_ms: int


class AICallLogOut(BaseModel):
    id: int
    feature: str
    user_id: int | None
    related_id: int | None
    input_tokens: int | None
    output_tokens: int | None
    cost_usd: float | None
    status: str
    error_message: str | None
    duration_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedLogsOut(BaseModel):
    items: list[AICallLogOut]
    total: int
    page: int
    page_size: int


class AIStatsByFeature(BaseModel):
    feature: str
    total_calls: int
    success_calls: int
    failed_calls: int
    error_rate_pct: float
    total_cost_usd: float


class AIStatsOut(BaseModel):
    total_calls_today: int
    total_calls_week: int
    total_cost_today_usd: float
    total_cost_week_usd: float
    total_cost_month_usd: float
    error_rate_pct: float
    by_feature: list[AIStatsByFeature]


# ── Helper ────────────────────────────────────────────────────────────────────


def _enrich_prompt(prompt: AIPromptConfig, db: Session) -> AIPromptConfigOut:
    """Attach updated_by_name from users table."""
    updated_by_name: str | None = None
    if prompt.updated_by:
        user = db.query(User).filter(User.id == prompt.updated_by).first()
        if user:
            updated_by_name = user.full_name or user.email
    return AIPromptConfigOut(
        id=prompt.id,
        feature=prompt.feature.value if hasattr(prompt.feature, "value") else str(prompt.feature),
        system_prompt=prompt.system_prompt,
        user_prompt_template=prompt.user_prompt_template,
        is_active=prompt.is_active,
        updated_by=prompt.updated_by,
        updated_by_name=updated_by_name,
        updated_at=prompt.updated_at,
        created_at=prompt.created_at,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get(
    "/prompts",
    response_model=list[AIPromptConfigOut],
    summary="Lay danh sach prompt config (chi Admin)",
)
def list_prompts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> list[AIPromptConfigOut]:
    """Return all 5 prompt configs currently stored in DB."""
    configs = db.query(AIPromptConfig).order_by(AIPromptConfig.feature).all()
    return [_enrich_prompt(c, db) for c in configs]


@router.patch(
    "/prompts/{feature}",
    response_model=AIPromptConfigOut,
    summary="Cap nhat system prompt (chi Admin)",
)
def update_prompt(
    feature: AIFeature,
    body: AIPromptUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> AIPromptConfigOut:
    """Update system_prompt for a specific feature. Creates record if not exists."""
    config = db.query(AIPromptConfig).filter(AIPromptConfig.feature == feature).first()
    if not config:
        config = AIPromptConfig(feature=feature, system_prompt=body.system_prompt or "")
        db.add(config)

    if body.system_prompt is not None:
        config.system_prompt = body.system_prompt
    if body.user_prompt_template is not None:
        config.user_prompt_template = body.user_prompt_template
    if body.is_active is not None:
        config.is_active = body.is_active
    config.updated_by = current_user.id
    config.updated_at = func.now()
    db.commit()
    db.refresh(config)
    return _enrich_prompt(config, db)


@router.post(
    "/prompts/{feature}/test",
    response_model=AIPromptTestResult,
    summary="Test thu prompt moi (goi AI that 1 lan, khong luu)",
)
async def test_prompt(
    feature: AIFeature,
    body: AIPromptUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> AIPromptTestResult:
    """Call Deepseek once with the draft prompt + a sample input. Does NOT save.

    For generate_email: body.user_prompt_template must be one of "invite"/"reject"/"offer".
    The endpoint composes effective_system = persona + EMAIL_TYPE_SYSTEM_RULES[email_type]
    so the test faithfully reflects the actual runtime behaviour, including reject safety rules.
    """
    import time

    from app.config import settings
    from app.services.deepseek_client import deepseek_client
    from app.services.email_generator import EMAIL_TYPE_SYSTEM_RULES

    # ── Sample inputs for 4 standard features ────────────────────────────────
    standard_sample_inputs: dict[AIFeature, str] = {
        AIFeature.CV_EVALUATE: "Ten: Nguyen Van A\nKy nang: Python, FastAPI, PostgreSQL\nKinh nghiem: 3 nam",
        AIFeature.ROADMAP: "CV: Senior Python dev. Muc tieu: Lead Engineer trong 2 nam",
        AIFeature.SUMMARIZE_CV: "CV: Junior React dev 1 nam. JD: Senior Frontend 3 nam+",
        AIFeature.INTERVIEW_QUESTIONS: "Vi tri: Backend Engineer. Ky nang: Python, REST API, Database",
    }

    # ── Per-type sample inputs for generate_email ─────────────────────────────
    # Each sample is realistic so the test reveals whether reject rules are working.
    email_sample_inputs: dict[str, str] = {
        "invite": (
            "Ung vien: Nguyen Van A. Vi tri: Backend Engineer. Cong ty: TechCorp VN.\n"
            "Hay soan email moi phong van."
        ),
        "reject": (
            "Ung vien: Tran Thi B. Vi tri: Frontend Developer. Cong ty: TechCorp VN.\n"
            "Hay soan email tu choi ung vien nay."
        ),
        "offer": (
            "Ung vien: Le Van C. Vi tri: Data Analyst. Cong ty: TechCorp VN.\n"
            "Hay soan email thong bao trung tuyen."
        ),
    }

    base_prompt = body.system_prompt or HARDCODED_FALLBACK_PROMPTS.get(feature, "")

    # ── generate_email: compose persona + type rules ──────────────────────────
    if feature == AIFeature.GENERATE_EMAIL:
        email_type = (body.user_prompt_template or "invite").strip().lower()
        if email_type not in EMAIL_TYPE_SYSTEM_RULES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"email_type phai la: {list(EMAIL_TYPE_SYSTEM_RULES.keys())}",
            )
        # Ghep dung nhu runtime: persona (DB) + type rules (hardcode)
        # Dam bao test phan anh chinh xac hanh vi thuc te, ke ca rang buoc reject.
        effective_system = base_prompt + EMAIL_TYPE_SYSTEM_RULES[email_type]
        sample = email_sample_inputs[email_type]
    else:
        effective_system = base_prompt
        sample = standard_sample_inputs.get(feature, "Sample test input")

    start = time.monotonic()
    try:
        response = await deepseek_client.create_chat_completion(
            messages=[
                {"role": "system", "content": effective_system},
                {"role": "user", "content": sample},
            ],
            model=settings.LLM_MODEL,
            response_format=None,  # Plain text for preview
        )
        ai_response = (
            response.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "(Khong co phan hoi)")
        )
    except Exception as exc:
        logger.warning("Test prompt failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Goi AI that bai: {str(exc)[:300]}",
        ) from exc

    duration_ms = int((time.monotonic() - start) * 1000)
    return AIPromptTestResult(
        feature=feature.value,
        sample_input=sample,
        ai_response=ai_response[:2000],
        duration_ms=duration_ms,
    )


@router.get(
    "/logs",
    response_model=PaginatedLogsOut,
    summary="Xem lich su goi AI (chi Admin)",
)
def list_logs(
    feature: AIFeature | None = Query(None),
    log_status: str | None = Query(None, alias="status"),
    from_date: datetime | None = Query(None),
    to_date: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> PaginatedLogsOut:
    """Paginated list of AI call logs with optional filters."""
    q = db.query(AICallLog)
    if feature:
        q = q.filter(AICallLog.feature == feature)
    if log_status:
        try:
            q = q.filter(AICallLog.status == AICallStatus(log_status))
        except ValueError:
            pass
    if from_date:
        q = q.filter(AICallLog.created_at >= from_date)
    if to_date:
        q = q.filter(AICallLog.created_at <= to_date)

    total = q.count()
    items = (
        q.order_by(desc(AICallLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    )
    return PaginatedLogsOut(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/stats",
    response_model=AIStatsOut,
    summary="Thong ke tong hop AI (chi Admin)",
)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> AIStatsOut:
    """Aggregate stats: total cost, error rate, by feature breakdown."""
    from datetime import timedelta, timezone

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    def _sum_cost(q) -> float:
        result = q.with_entities(func.coalesce(func.sum(AICallLog.cost_usd), 0.0)).scalar()
        return float(result or 0.0)

    def _count(q) -> int:
        return q.count()

    base_q = db.query(AICallLog)
    total_today = _count(base_q.filter(AICallLog.created_at >= today_start))
    total_week = _count(base_q.filter(AICallLog.created_at >= week_start))
    cost_today = _sum_cost(base_q.filter(AICallLog.created_at >= today_start))
    cost_week = _sum_cost(base_q.filter(AICallLog.created_at >= week_start))
    cost_month = _sum_cost(base_q.filter(AICallLog.created_at >= month_start))

    total_all = _count(base_q)
    failed_all = _count(base_q.filter(AICallLog.status == AICallStatus.FAILED))
    error_rate = (failed_all / total_all * 100) if total_all > 0 else 0.0

    by_feature: list[AIStatsByFeature] = []
    for feat in AIFeature:
        fq = base_q.filter(AICallLog.feature == feat)
        total_f = _count(fq)
        failed_f = _count(fq.filter(AICallLog.status == AICallStatus.FAILED))
        success_f = total_f - failed_f
        cost_f = _sum_cost(fq)
        by_feature.append(
            AIStatsByFeature(
                feature=feat.value,
                total_calls=total_f,
                success_calls=success_f,
                failed_calls=failed_f,
                error_rate_pct=(failed_f / total_f * 100) if total_f > 0 else 0.0,
                total_cost_usd=cost_f,
            )
        )

    return AIStatsOut(
        total_calls_today=total_today,
        total_calls_week=total_week,
        total_cost_today_usd=cost_today,
        total_cost_week_usd=cost_week,
        total_cost_month_usd=cost_month,
        error_rate_pct=error_rate,
        by_feature=by_feature,
    )

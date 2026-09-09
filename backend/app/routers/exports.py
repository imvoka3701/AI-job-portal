"""Enterprise Data Export Router — CSV exports for candidates and pipeline metrics."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    require_company_permission,
)
from app.database import get_db
from app.routers.employer import _job_scope, get_employer_stats
from app.services.export_service import (
    generate_candidates_csv,
    generate_pipeline_metrics_csv,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employer/exports", tags=["Employer Exports"])


@router.get("/candidates.csv", summary="Export candidate applications as CSV")
def export_candidates_csv(
    job_id: int | None = Query(None, description="Lọc theo tin tuyển dụng cụ thể"),
    status: str | None = Query(None, description="Lọc theo trạng thái hồ sơ"),
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.APPLICATION_VIEW)
    ),
    db: Session = Depends(get_db),
) -> Response:
    """Export candidate applications to RFC 4180 CSV with UTF-8 BOM encoding.

    Respects company multi-tenancy and department head job scoping.
    """
    scope_clause, scope_params = _job_scope(context)
    filter_conditions = [scope_clause]
    params: dict[str, object] = dict(scope_params)

    if job_id is not None:
        filter_conditions.append("j.id = :filter_job_id")
        params["filter_job_id"] = job_id

    if status:
        filter_conditions.append("a.status = :filter_status")
        params["filter_status"] = status

    where_clause = " AND ".join(filter_conditions)

    sql = text(
        f"""
        SELECT
            a.id AS application_id,
            u.full_name AS candidate_name,
            u.email AS candidate_email,
            u.phone AS candidate_phone,
            j.title AS job_title,
            d.name AS department_name,
            a.applied_at,
            a.status,
            a.ai_matching_score,
            a.ai_feedback,
            a.hiring_recommendation,
            a.recommendation_note,
            (
                SELECT ir.round_name
                FROM interview_rounds ir
                WHERE ir.application_id = a.id
                ORDER BY ir.round_number DESC LIMIT 1
            ) AS current_round_name,
            (
                SELECT ir.scheduled_at
                FROM interview_rounds ir
                WHERE ir.application_id = a.id AND ir.scheduled_at IS NOT NULL
                ORDER BY ir.scheduled_at DESC LIMIT 1
            ) AS interview_scheduled_at
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON a.candidate_id = u.id
        LEFT JOIN departments d ON j.department_id = d.id
        WHERE {where_clause}
        ORDER BY a.applied_at DESC
        """
    )

    rows = db.execute(sql, params).mappings().fetchall()

    formatted_rows = []
    for r in rows:
        applied_at_str = ""
        if r["applied_at"]:
            if isinstance(r["applied_at"], datetime):
                applied_at_str = r["applied_at"].strftime("%Y-%m-%d %H:%M")
            else:
                applied_at_str = str(r["applied_at"])[:16].replace("T", " ")

        interview_str = ""
        if r["interview_scheduled_at"]:
            if isinstance(r["interview_scheduled_at"], datetime):
                interview_str = r["interview_scheduled_at"].strftime("%Y-%m-%d %H:%M")
            else:
                interview_str = str(r["interview_scheduled_at"])[:16].replace("T", " ")

        formatted_rows.append(
            {
                "application_id": r["application_id"],
                "candidate_name": r["candidate_name"],
                "candidate_email": r["candidate_email"],
                "candidate_phone": r["candidate_phone"],
                "job_title": r["job_title"],
                "department_name": r["department_name"],
                "applied_at": applied_at_str,
                "status": r["status"],
                "ai_matching_score": r["ai_matching_score"],
                "ai_feedback": r["ai_feedback"],
                "hiring_recommendation": r["hiring_recommendation"],
                "recommendation_note": r["recommendation_note"],
                "current_round_name": r["current_round_name"],
                "interview_scheduled_at": interview_str,
            }
        )

    csv_content = generate_candidates_csv(formatted_rows)
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    job_suffix = f"job_{job_id}_" if job_id else "all_"
    filename = f"danh_sach_ung_vien_{job_suffix}{now_str}.csv"

    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get("/pipeline-metrics.csv", summary="Export recruitment metrics and funnel as CSV")
def export_pipeline_metrics_csv(
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.ANALYTICS_VIEW)
    ),
    db: Session = Depends(get_db),
) -> Response:
    """Export aggregated recruitment metrics and interview funnel to CSV."""
    stats = get_employer_stats(context=context, db=db)
    csv_content = generate_pipeline_metrics_csv(stats.model_dump())
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"bao_cao_hieu_suat_tuyen_dung_{context.company.id}_{now_str}.csv"

    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )

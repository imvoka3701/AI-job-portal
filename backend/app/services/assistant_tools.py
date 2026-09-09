"""Agentic tools for JobPortal AI Copilot.

Enables DeepSeek LLM to query live database entities (jobs, candidate profile,
application progress, employer ATS stats) via OpenAI-compatible Function Calling.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application, ApplicationStatus
from app.models.company import Company, CompanyMembership
from app.models.interview_round import InterviewRound
from app.models.job import Job, JobType
from app.models.resume import Resume
from app.models.user import User

logger = logging.getLogger(__name__)

# ── JSON Tool Schemas for DeepSeek V3 ───────────────────────────────────────
ASSISTANT_TOOLS_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_live_jobs",
            "description": (
                "Tìm kiếm các tin tuyển dụng đang mở (active) trên hệ thống JobPortal theo từ khóa chức danh/kỹ năng, "
                "địa điểm làm việc, mức lương tối thiểu hoặc hình thức làm việc."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "Từ khóa tìm kiếm (ví dụ: 'Frontend', 'Python', 'React', 'Kế toán', 'Marketing')",
                    },
                    "location": {
                        "type": "string",
                        "description": "Địa điểm làm việc (ví dụ: 'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Toàn quốc', 'Remote')",
                    },
                    "min_salary": {
                        "type": "integer",
                        "description": "Mức lương tối thiểu mong muốn (đơn vị: triệu VNĐ, ví dụ: 15, 20, 30)",
                    },
                    "job_type": {
                        "type": "string",
                        "enum": ["full_time", "part_time", "internship", "freelance", "remote"],
                        "description": "Hình thức làm việc",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_candidate_profile_and_cv",
            "description": (
                "Tra cứu thông tin hồ sơ và kết quả đánh giá CV mới nhất của ứng viên đang đăng nhập "
                "để tư vấn cá nhân hóa về điểm mạnh, điểm yếu và gợi ý nâng cấp CV."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_candidate_applications",
            "description": (
                "Tra cứu danh sách các đơn ứng tuyển gần đây và trạng thái xử lý hồ sơ của ứng viên "
                "(ví dụ: đang chờ duyệt, phỏng vấn, chấp nhận, từ chối)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Số lượng đơn ứng tuyển cần lấy (mặc định 5)",
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_employer_ats_stats",
            "description": (
                "Tổng hợp số liệu thống kê tuyển dụng theo thời gian thực cho Nhà tuyển dụng: "
                "tổng tin tuyển dụng đang mở, tổng số ứng viên nộp, phân bổ theo các giai đoạn ATS Kanban và lịch phỏng vấn sắp tới."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_job_detail_by_id",
            "description": "Tra cứu chi tiết một tin tuyển dụng cụ thể theo ID (mô tả, yêu cầu, quyền lợi, mức lương).",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_id": {
                        "type": "integer",
                        "description": "ID số của công việc",
                    }
                },
                "required": ["job_id"],
            },
        },
    },
]


# ── Python Handlers for Tools ───────────────────────────────────────────────

def execute_search_live_jobs(
    db: Session,
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    min_salary: Optional[int] = None,
    job_type: Optional[str] = None,
    limit: int = 5,
) -> Dict[str, Any]:
    """Search live active jobs in PostgreSQL database with optional filters."""
    query = select(Job).options(joinedload(Job.company)).where(Job.is_active.is_(True))

    if keyword:
        term = f"%{keyword.strip()}%"
        query = query.where(
            or_(
                Job.title.ilike(term),
                Job.description.ilike(term),
                Job.requirements.ilike(term),
            )
        )

    if location and location.lower() not in ["toàn quốc", "vietnam", "việt nam", "all"]:
        loc_term = f"%{location.strip()}%"
        query = query.where(Job.location.ilike(loc_term))

    if min_salary and min_salary > 0:
        query = query.where(
            or_(
                Job.salary_max >= min_salary,
                Job.salary_min >= min_salary,
            )
        )

    if job_type:
        try:
            jt_enum = JobType(job_type)
            query = query.where(Job.job_type == jt_enum)
        except ValueError:
            pass

    safe_limit = max(1, min(int(limit), 10))
    query = query.order_by(desc(Job.created_at)).limit(safe_limit)
    results = db.execute(query).scalars().all()

    jobs_list = []
    for j in results:
        company_name = j.company.name if j.company else "Nhà tuyển dụng xác thực"
        salary_str = (
            f"{j.salary_min} - {j.salary_max} triệu VNĐ"
            if j.salary_min and j.salary_max
            else (f"Từ {j.salary_min} triệu VNĐ" if j.salary_min else "Thoả thuận")
        )
        jobs_list.append(
            {
                "id": j.id,
                "title": j.title,
                "company": company_name,
                "location": j.location or "Toàn quốc",
                "salary": salary_str,
                "job_type": j.job_type.value if hasattr(j.job_type, "value") else str(j.job_type),
                "url": f"/jobs/{j.id}",
            }
        )

    return {
        "found_count": len(jobs_list),
        "jobs": jobs_list,
        "search_params": {
            "keyword": keyword,
            "location": location,
            "min_salary": min_salary,
            "job_type": job_type,
        },
    }


def execute_get_candidate_profile_and_cv(
    db: Session, current_user: Optional[User]
) -> Dict[str, Any]:
    """Retrieve logged-in candidate's latest CV and AI evaluation results."""
    if not current_user:
        return {
            "status": "unauthenticated",
            "message": "Người dùng chưa đăng nhập. Hãy đăng ký hoặc đăng nhập để được phân tích CV cá nhân.",
        }

    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(desc(Resume.created_at))
        .first()
    )

    if not latest_resume:
        return {
            "status": "no_resume",
            "user_name": current_user.full_name,
            "message": "Ứng viên chưa tải lên hoặc tạo bản CV nào trên sàn. Hãy hướng dẫn ứng viên dùng /cv-builder.",
        }

    ai_eval = {}
    if latest_resume.ai_evaluation_json:
        try:
            ai_eval = json.loads(latest_resume.ai_evaluation_json)
        except Exception:
            ai_eval = {}

    parsed_skills = []
    if latest_resume.parsed_skills:
        try:
            parsed_skills = json.loads(latest_resume.parsed_skills)
        except Exception:
            parsed_skills = [latest_resume.parsed_skills]

    return {
        "status": "found",
        "user_name": current_user.full_name,
        "resume_title": latest_resume.title,
        "experience_level": latest_resume.parsed_experience_level or "Chưa xác định",
        "skills": parsed_skills[:10],
        "is_validated": latest_resume.is_validated,
        "ai_score": ai_eval.get("score") or ai_eval.get("overall_score"),
        "strengths": ai_eval.get("strengths", []),
        "weaknesses": ai_eval.get("weaknesses", ai_eval.get("improvements", [])),
        "suggestions": ai_eval.get("suggestions", []),
    }


def execute_get_candidate_applications(
    db: Session, current_user: Optional[User], limit: int = 5
) -> Dict[str, Any]:
    """Retrieve logged-in candidate's active and recent job applications."""
    if not current_user:
        return {
            "status": "unauthenticated",
            "message": "Người dùng chưa đăng nhập. Cần đăng nhập để xem tiến độ ứng tuyển.",
        }

    safe_limit = max(1, min(int(limit), 10))
    apps = (
        db.query(Application)
        .options(joinedload(Application.job).joinedload(Job.company))
        .filter(Application.candidate_id == current_user.id)
        .order_by(desc(Application.applied_at))
        .limit(safe_limit)
        .all()
    )

    if not apps:
        return {
            "status": "empty",
            "total_applications": 0,
            "message": "Ứng viên chưa nộp đơn vào công việc nào. Hãy gợi ý tìm việc tại /jobs.",
        }

    app_list = []
    status_vn = {
        ApplicationStatus.PENDING: "Đang chờ duyệt",
        ApplicationStatus.REVIEWED: "Đã xem hồ sơ",
        ApplicationStatus.SHORTLISTED: "Vào vòng chọn lọc",
        ApplicationStatus.INTERVIEW: "Mời phỏng vấn",
        ApplicationStatus.ACCEPTED: "Được nhận việc (Offer)",
        ApplicationStatus.REJECTED: "Chưa phù hợp",
    }

    for a in apps:
        job_title = a.job.title if a.job else "Công việc không xác định"
        comp_name = a.job.company.name if (a.job and a.job.company) else "Doanh nghiệp"
        app_list.append(
            {
                "application_id": a.id,
                "job_id": a.job_id,
                "job_title": job_title,
                "company": comp_name,
                "status": a.status.value,
                "status_display": status_vn.get(a.status, a.status.value),
                "ai_matching_score": a.ai_matching_score,
                "applied_at": a.applied_at.strftime("%d/%m/%Y") if a.applied_at else "",
                "url": f"/jobs/{a.job_id}",
            }
        )

    return {
        "status": "success",
        "total_applications": len(app_list),
        "applications": app_list,
    }


def execute_get_employer_ats_stats(
    db: Session, current_user: Optional[User]
) -> Dict[str, Any]:
    """Retrieve ATS pipeline statistics for the logged-in Employer."""
    if not current_user:
        return {
            "status": "unauthenticated",
            "message": "Nhà tuyển dụng chưa đăng nhập. Vui lòng đăng nhập tài khoản Employer.",
        }

    # Find employer company: either created_by or membership
    company = db.query(Company).filter(Company.created_by_user_id == current_user.id).first()
    if not company:
        membership = (
            db.query(CompanyMembership)
            .filter(CompanyMembership.user_id == current_user.id)
            .first()
        )
        if membership:
            company = db.get(Company, membership.company_id)

    if not company:
        return {
            "status": "no_company",
            "message": "Bạn chưa liên kết hoặc tạo Công ty trên hệ thống. Hãy hoàn tất hồ sơ tại /employer/company.",
        }

    # Count jobs
    total_jobs = db.query(Job).filter(Job.company_id == company.id).count()
    active_jobs = (
        db.query(Job)
        .filter(Job.company_id == company.id, Job.is_active.is_(True))
        .count()
    )

    # Job IDs of company
    job_ids = [j.id for j in db.query(Job.id).filter(Job.company_id == company.id).all()]

    if not job_ids:
        return {
            "status": "success",
            "company_name": company.name,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": 0,
            "stage_breakdown": {},
            "upcoming_interviews": 0,
            "message": "Công ty chưa đăng tin tuyển dụng nào. Hãy bắt đầu tạo tin mới tại /employer/jobs/new.",
        }

    # Total applications
    total_apps = db.query(Application).filter(Application.job_id.in_(job_ids)).count()

    # Stage breakdown
    breakdown = {}
    for st in ApplicationStatus:
        cnt = (
            db.query(Application)
            .filter(Application.job_id.in_(job_ids), Application.status == st)
            .count()
        )
        breakdown[st.value] = cnt

    # Upcoming interviews (scheduled_at >= now)
    now_utc = datetime.now(timezone.utc)
    app_ids = [
        a.id for a in db.query(Application.id).filter(Application.job_id.in_(job_ids)).all()
    ]
    upcoming_interviews = 0
    if app_ids:
        upcoming_interviews = (
            db.query(InterviewRound)
            .filter(
                InterviewRound.application_id.in_(app_ids),
                InterviewRound.scheduled_at >= now_utc,
            )
            .count()
        )

    return {
        "status": "success",
        "company_name": company.name,
        "is_verified": company.is_verified,
        "active_jobs": active_jobs,
        "total_jobs": total_jobs,
        "total_applications": total_apps,
        "stage_breakdown": breakdown,
        "upcoming_interviews": upcoming_interviews,
    }


def execute_get_job_detail_by_id(db: Session, job_id: int) -> Dict[str, Any]:
    """Retrieve full detail of a specific job by ID."""
    job = (
        db.query(Job)
        .options(joinedload(Job.company))
        .filter(Job.id == job_id, Job.is_active.is_(True))
        .first()
    )
    if not job:
        return {"status": "not_found", "message": f"Không tìm thấy công việc với ID #{job_id} hoặc tin đã đóng."}

    return {
        "status": "found",
        "id": job.id,
        "title": job.title,
        "company": job.company.name if job.company else "Doanh nghiệp tuyển dụng",
        "location": job.location or "Toàn quốc",
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "job_type": job.job_type.value if hasattr(job.job_type, "value") else str(job.job_type),
        "description": job.description[:500] if job.description else "",
        "requirements": job.requirements[:500] if job.requirements else "",
        "benefits": job.benefits[:500] if job.benefits else "",
        "is_active": job.is_active,
        "url": f"/jobs/{job.id}",
    }


def dispatch_tool_call(
    tool_name: str,
    tool_args: Dict[str, Any],
    db: Session,
    current_user: Optional[User] = None,
) -> Dict[str, Any]:
    """Safely dispatches a tool call request to the appropriate Python handler."""
    logger.info("Executing Agentic Tool: %s with args: %s", tool_name, tool_args)
    try:
        if tool_name == "search_live_jobs":
            return execute_search_live_jobs(
                db=db,
                keyword=tool_args.get("keyword"),
                location=tool_args.get("location"),
                min_salary=tool_args.get("min_salary"),
                job_type=tool_args.get("job_type"),
                limit=tool_args.get("limit", 5),
            )
        elif tool_name == "get_candidate_profile_and_cv":
            return execute_get_candidate_profile_and_cv(db=db, current_user=current_user)
        elif tool_name == "get_candidate_applications":
            return execute_get_candidate_applications(
                db=db, current_user=current_user, limit=tool_args.get("limit", 5)
            )
        elif tool_name == "get_employer_ats_stats":
            return execute_get_employer_ats_stats(db=db, current_user=current_user)
        elif tool_name == "get_job_detail_by_id":
            return execute_get_job_detail_by_id(db=db, job_id=int(tool_args.get("job_id", 0)))
        else:
            return {"status": "error", "message": f"Công cụ '{tool_name}' không tồn tại."}
    except Exception as exc:
        logger.error("Error executing tool %s: %s", tool_name, exc, exc_info=True)
        return {"status": "error", "error": str(exc)}

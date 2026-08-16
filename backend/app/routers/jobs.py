"""Jobs router — CRUD endpoints for job listings."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

logger = logging.getLogger(__name__)
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    require_company_permission,
    require_job_scope,
)
from app.crud.job import crud_job
from app.crud.company import crud_company
from app.database import get_db
from app.models.job import ExperienceLevel, JobType
from app.schemas.job import JobCreate, JobListResponse, JobRead, JobUpdate
from app.services.embedding_service import generate_embedding
from app.services.recruitment_request_service import recruitment_request_service
from app.utils.locations import parse_locations_param

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=JobListResponse, summary="List active jobs")
def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = Query(None, description="Search by title, description, company"),
    location: str | None = Query(None, description="Single location filter (legacy)"),
    locations: str | None = Query(None, description="Comma-separated location filters"),
    job_type: JobType | None = Query(None),
    experience_level: ExperienceLevel | None = Query(None),
    salary_min: int | None = Query(None, ge=0),
    salary_max: int | None = Query(None, ge=0),
    category_id: int | None = Query(None, ge=1),
    employer_id: int | None = Query(None, ge=1),
    company_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
) -> JobListResponse:
    """List active job postings with pagination and search filters."""
    skip = (page - 1) * page_size

    parsed_locations = parse_locations_param(locations)
    if location and not parsed_locations:
        parsed_locations = parse_locations_param(location)

    items, total = crud_job.get_list(
        db,
        skip=skip,
        limit=page_size,
        keyword=keyword,
        locations=parsed_locations or None,
        job_type=job_type,
        experience_level=experience_level,
        salary_min=salary_min,
        salary_max=salary_max,
        category_id=category_id,
        employer_id=employer_id,
        company_id=company_id,
    )
    return JobListResponse(
        items=[JobRead.model_validate(j) for j in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{job_id}", response_model=JobRead, summary="Get job details")
def get_job(job_id: int, db: Session = Depends(get_db)) -> JobRead:
    """Get a single job posting by ID."""
    job = crud_job.get_by_id(db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobRead.model_validate(job)


@router.post(
    "",
    response_model=JobRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job posting",
)
def create_job(
    data: JobCreate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.JOB_MANAGE)
    ),
    db: Session = Depends(get_db),
) -> JobRead:
    """Create a new job posting (Employer only). Automatically generates an AI embedding."""
    recruitment_request = None
    if data.recruitment_request_id is not None:
        recruitment_request = recruitment_request_service.validate_conversion(
            db,
            request_id=data.recruitment_request_id,
            company_id=context.company.id,
        )
        if data.department_id is None:
            data = data.model_copy(update={"department_id": recruitment_request.department_id})
        elif data.department_id != recruitment_request.department_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Phòng ban của tin tuyển dụng phải khớp yêu cầu đã duyệt.",
            )
    if data.department_id is not None:
        department = crud_company.get_department(db, department_id=data.department_id)
        if (
            department is None
            or department.company_id != context.company.id
            or not department.is_active
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Phòng ban không thuộc doanh nghiệp hoặc đã ngừng hoạt động.",
            )

    job = crud_job.create(
        db,
        obj_in=data,
        employer_id=context.user.id,
        company_id=context.company.id,
    )

    # Generate embedding from concatenated JD text.
    # Runs synchronously before returning the response (~100-200ms on CPU).
    # This guarantees every job ALWAYS has an embedding — no race condition
    # where a candidate matches against a job that hasn't been embedded yet.
    jd_text = " ".join(
        part
        for part in [data.title, data.description, data.requirements, data.benefits]
        if part
    )
    try:
        embedding = generate_embedding(jd_text)
        job = crud_job.update_embedding(db, job=job, embedding=embedding)
    except Exception as exc:
        logger.exception("Failed to generate embedding for job %s", job.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tạo tin thành công nhưng không sinh được embedding. Vui lòng thử lại.",
        )

    if recruitment_request is not None:
        recruitment_request_service.mark_converted(
            db,
            request=recruitment_request,
            job=job,
            actor=context.user,
        )

    return JobRead.model_validate(job)


@router.patch("/{job_id}", response_model=JobRead, summary="Update a job posting")
def update_job(
    job_id: int,
    data: JobUpdate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.JOB_MANAGE)
    ),
    db: Session = Depends(get_db),
) -> JobRead:
    """Update an existing job posting (owner only)."""
    job = crud_job.get_by_id(db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    require_job_scope(db, context=context, job=job)
    if "department_id" in data.model_fields_set and data.department_id is not None:
        department = crud_company.get_department(db, department_id=data.department_id)
        if department is None or department.company_id != context.company.id or not department.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Phòng ban không thuộc doanh nghiệp hoặc đã ngừng hoạt động.",
            )
    updated = crud_job.update(db, db_obj=job, obj_in=data)
    return JobRead.model_validate(updated)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a job posting")
def delete_job(
    job_id: int,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.JOB_MANAGE)
    ),
    db: Session = Depends(get_db),
) -> None:
    """Delete a job posting (owner only)."""
    job = crud_job.get_by_id(db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    require_job_scope(db, context=context, job=job)
    crud_job.delete(db, job_id=job_id)

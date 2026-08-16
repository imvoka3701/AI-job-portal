"""Database access for recruitment-request workflow."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.recruitment_request import RecruitmentRequest, RecruitmentRequestStatus


class CRUDRecruitmentRequest:
    @staticmethod
    def _with_relations():
        return (
            joinedload(RecruitmentRequest.department),
            joinedload(RecruitmentRequest.requester),
            joinedload(RecruitmentRequest.reviewer),
        )

    def get(self, db: Session, *, request_id: int) -> RecruitmentRequest | None:
        return db.execute(
            select(RecruitmentRequest)
            .where(RecruitmentRequest.id == request_id)
            .options(*self._with_relations())
        ).scalar_one_or_none()

    def list(
        self,
        db: Session,
        *,
        company_id: int,
        department_id: int | None = None,
        request_status: RecruitmentRequestStatus | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[RecruitmentRequest], int]:
        filtered = select(RecruitmentRequest).where(
            RecruitmentRequest.company_id == company_id
        )
        if department_id is not None:
            filtered = filtered.where(RecruitmentRequest.department_id == department_id)
        if request_status is not None:
            filtered = filtered.where(RecruitmentRequest.status == request_status)
        total = db.execute(
            select(func.count()).select_from(filtered.subquery())
        ).scalar() or 0
        items = list(
            db.execute(
                filtered.options(*self._with_relations())
                .order_by(RecruitmentRequest.created_at.desc())
                .offset(skip)
                .limit(limit)
            ).scalars().unique().all()
        )
        return items, total

    def create(self, db: Session, *, request: RecruitmentRequest) -> RecruitmentRequest:
        db.add(request)
        db.flush()
        return request


crud_recruitment_request = CRUDRecruitmentRequest()

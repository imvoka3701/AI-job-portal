"""CRUD operations for immutable admin audit entries."""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.admin_audit_log import AdminAuditLog


class CRUDAdminAuditLog:
    def create(
        self,
        db: Session,
        *,
        actor_user_id: int | None,
        actor_email: str,
        company_id: int | None = None,
        action: str,
        target_type: str,
        target_id: str | None,
        target_label: str | None,
        details: dict[str, Any] | None = None,
    ) -> AdminAuditLog:
        entry = AdminAuditLog(
            actor_user_id=actor_user_id,
            actor_email=actor_email,
            company_id=company_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            target_label=target_label,
            details_json=details or {},
        )
        db.add(entry)
        db.flush()
        return entry

    def get_list(
        self,
        db: Session,
        *,
        action: str | None = None,
        target_type: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[AdminAuditLog], int]:
        stmt = select(AdminAuditLog)
        if action:
            stmt = stmt.where(AdminAuditLog.action == action)
        if target_type:
            stmt = stmt.where(AdminAuditLog.target_type == target_type)
        total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
        items = list(
            db.execute(
                stmt.order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc())
                .offset(skip)
                .limit(limit)
            )
            .scalars()
            .all()
        )
        return items, total

    def get_company_activity(
        self,
        db: Session,
        *,
        company_id: int,
        action: str | None = None,
        target_type: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[AdminAuditLog], int]:
        stmt = select(AdminAuditLog).where(AdminAuditLog.company_id == company_id)
        if action:
            stmt = stmt.where(AdminAuditLog.action == action)
        if target_type:
            stmt = stmt.where(AdminAuditLog.target_type == target_type)
        total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
        items = list(
            db.execute(
                stmt.order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc())
                .offset(skip)
                .limit(limit)
            )
            .scalars()
            .all()
        )
        return items, total


crud_admin_audit_log = CRUDAdminAuditLog()

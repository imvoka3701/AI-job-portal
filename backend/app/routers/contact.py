"""Contact and Enterprise Consultation Leads router."""

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contact_lead import ContactLead
from app.schemas.contact_lead import ContactLeadCreate, ContactLeadRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact & Leads"])


@router.post(
    "/leads",
    response_model=ContactLeadRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit enterprise consultation inquiry lead",
)
def submit_contact_lead(
    lead_in: ContactLeadCreate,
    db: Session = Depends(get_db),
) -> ContactLead:
    """Accept and store business inquiry lead from employer landing page."""
    lead = ContactLead(
        full_name=lead_in.full_name,
        email=lead_in.email,
        phone=lead_in.phone,
        company_name=lead_in.company_name,
        location=lead_in.location,
        service_package=lead_in.service_package,
        notes=lead_in.notes,
        status="new",
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    logger.info(
        "New enterprise lead captured: %s from %s (%s, %s)",
        lead.full_name,
        lead.company_name,
        lead.email,
        lead.phone,
    )
    return lead


@router.get(
    "/leads",
    response_model=list[ContactLeadRead],
    summary="List enterprise consultation leads",
)
def list_contact_leads(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> list[ContactLead]:
    """Retrieve consultation leads ordered by most recent."""
    stmt = select(ContactLead).order_by(ContactLead.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())

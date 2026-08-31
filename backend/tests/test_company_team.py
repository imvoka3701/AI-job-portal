"""Employer tenant, team invitation, and permission policy tests."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud.company import crud_company
from app.crud.user import crud_user
from app.models.admin_audit_log import AdminAuditLog
from app.models.company import CompanyInvitation

PASSWORD = "StrongPass123!"


def _register_approved_employer(
    client: TestClient,
    db: Session,
    *,
    email: str,
    company_name: str,
) -> dict[str, str]:
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Employer Owner",
            "role": "employer",
            "company_name": company_name,
        },
    )
    assert response.status_code == 201
    user = crud_user.get_by_email(db, email=email)
    assert user is not None
    membership = crud_company.get_active_membership(db, user_id=user.id)
    assert membership is not None
    user.is_active = True
    membership.company.is_active = True
    db.commit()
    login = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_owner_can_manage_departments_and_invite_department_head(
    client: TestClient,
    db_session: Session,
):
    owner_headers = _register_approved_employer(
        client,
        db_session,
        email="owner@example.com",
        company_name="Acme",
    )

    context = client.get("/employer/company-context", headers=owner_headers)
    assert context.status_code == 200
    assert "team:manage" in context.json()["permissions"]
    assert context.json()["membership"]["is_owner"] is True

    department = client.post(
        "/employer/departments",
        headers=owner_headers,
        json={"name": "Engineering", "description": "Product engineering"},
    )
    assert department.status_code == 201
    department_id = department.json()["id"]

    missing_department = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={"email": "head@example.com", "member_role": "department_head"},
    )
    assert missing_department.status_code == 422

    invitation = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={
            "email": "head@example.com",
            "member_role": "department_head",
            "department_id": department_id,
        },
    )
    assert invitation.status_code == 201
    invite_token = invitation.json()["invite_token"]

    accepted = client.post(
        f"/employer/invitations/{invite_token}/accept",
        json={"full_name": "Engineering Head", "password": PASSWORD},
    )
    assert accepted.status_code == 200
    assert accepted.json()["member_role"] == "department_head"
    assert accepted.json()["department_name"] == "Engineering"

    head_login = client.post(
        "/auth/login", json={"email": "head@example.com", "password": PASSWORD}
    )
    head_headers = {"Authorization": f"Bearer {head_login.json()['access_token']}"}
    head_context = client.get("/employer/company-context", headers=head_headers)
    assert head_context.status_code == 200
    assert "candidate:recommend" in head_context.json()["permissions"]
    assert "team:manage" not in head_context.json()["permissions"]

    forbidden = client.post(
        "/employer/departments",
        headers=head_headers,
        json={"name": "Unauthorized department"},
    )
    assert forbidden.status_code == 403


def test_company_members_are_tenant_isolated(
    client: TestClient,
    db_session: Session,
):
    first_headers = _register_approved_employer(
        client,
        db_session,
        email="first@example.com",
        company_name="First Company",
    )
    second_headers = _register_approved_employer(
        client,
        db_session,
        email="second@example.com",
        company_name="Second Company",
    )

    first_members = client.get("/employer/team/members", headers=first_headers)
    second_members = client.get("/employer/team/members", headers=second_headers)

    assert first_members.status_code == 200
    assert second_members.status_code == 200
    assert [item["email"] for item in first_members.json()] == ["first@example.com"]
    assert [item["email"] for item in second_members.json()] == ["second@example.com"]


def test_invitation_expiry_resend_reuse_decline_and_revoke(
    client: TestClient,
    db_session: Session,
):
    owner_headers = _register_approved_employer(
        client,
        db_session,
        email="invitation-owner@example.com",
        company_name="Invitation Company",
    )

    invitation = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={"email": "invited-hr@example.com", "member_role": "hr"},
    )
    assert invitation.status_code == 201
    invitation_data = invitation.json()

    duplicate = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={"email": "INVITED-HR@example.com", "member_role": "hr"},
    )
    assert duplicate.status_code == 409

    stored = db_session.get(CompanyInvitation, invitation_data["id"])
    assert stored is not None
    stored.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    expired = client.get(f"/employer/invitations/{invitation_data['invite_token']}")
    assert expired.status_code == 200
    assert expired.json()["status"] == "expired"
    rejected_expired = client.post(
        f"/employer/invitations/{invitation_data['invite_token']}/accept",
        json={"full_name": "Invited HR", "password": PASSWORD},
    )
    assert rejected_expired.status_code == 409

    resent = client.post(
        f"/employer/team/invitations/{invitation_data['id']}/resend",
        headers=owner_headers,
    )
    assert resent.status_code == 200
    resent_token = resent.json()["invite_token"]
    assert resent_token != invitation_data["invite_token"]
    assert client.get(f"/employer/invitations/{invitation_data['invite_token']}").status_code == 404

    accepted = client.post(
        f"/employer/invitations/{resent_token}/accept",
        json={"full_name": "Invited HR", "password": PASSWORD},
    )
    assert accepted.status_code == 200
    assert (
        client.post(
            f"/employer/invitations/{resent_token}/accept",
            json={},
        ).status_code
        == 409
    )

    declined = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={"email": "declined@example.com", "member_role": "hr"},
    ).json()
    assert (
        client.post(f"/employer/invitations/{declined['invite_token']}/decline").status_code == 200
    )
    assert (
        client.post(
            f"/employer/team/invitations/{declined['id']}/resend",
            headers=owner_headers,
        ).status_code
        == 409
    )

    revoked = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={"email": "revoked@example.com", "member_role": "hr"},
    ).json()
    revoke_response = client.post(
        f"/employer/team/invitations/{revoked['id']}/revoke",
        headers=owner_headers,
    )
    assert revoke_response.status_code == 200
    assert revoke_response.json()["status"] == "revoked"
    assert (
        client.post(
            f"/employer/invitations/{revoked['invite_token']}/accept",
            json={"full_name": "Revoked User", "password": PASSWORD},
        ).status_code
        == 409
    )


def test_membership_status_and_ownership_changes_apply_immediately(
    client: TestClient,
    db_session: Session,
):
    owner_headers = _register_approved_employer(
        client,
        db_session,
        email="ownership-owner@example.com",
        company_name="Ownership Company",
    )
    invitation = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={"email": "ownership-hr@example.com", "member_role": "hr"},
    ).json()
    accepted = client.post(
        f"/employer/invitations/{invitation['invite_token']}/accept",
        json={"full_name": "Ownership HR", "password": PASSWORD},
    )
    assert accepted.status_code == 200
    member_id = accepted.json()["id"]
    owner_id = client.get("/employer/company-context", headers=owner_headers).json()["membership"][
        "id"
    ]

    member_login = client.post(
        "/auth/login",
        json={"email": "ownership-hr@example.com", "password": PASSWORD},
    ).json()
    member_headers = {"Authorization": f"Bearer {member_login['access_token']}"}

    assert (
        client.patch(
            f"/employer/team/members/{owner_id}",
            headers=owner_headers,
            json={"status": "suspended"},
        ).status_code
        == 409
    )

    suspended = client.patch(
        f"/employer/team/members/{member_id}",
        headers=owner_headers,
        json={"status": "suspended"},
    )
    assert suspended.status_code == 200
    assert suspended.json()["status"] == "suspended"
    assert client.get("/employer/company-context", headers=member_headers).status_code == 403

    reactivated = client.patch(
        f"/employer/team/members/{member_id}",
        headers=owner_headers,
        json={"status": "active"},
    )
    assert reactivated.status_code == 200
    assert client.get("/employer/company-context", headers=member_headers).status_code == 200

    transferred = client.post(
        f"/employer/team/members/{member_id}/transfer-ownership",
        headers=owner_headers,
    )
    assert transferred.status_code == 200
    assert transferred.json()["is_owner"] is True
    old_owner_context = client.get("/employer/company-context", headers=owner_headers).json()
    assert "team:manage" not in old_owner_context["permissions"]
    assert (
        client.patch(
            f"/employer/team/members/{member_id}",
            headers=owner_headers,
            json={"status": "revoked"},
        ).status_code
        == 403
    )

    revoked = client.patch(
        f"/employer/team/members/{owner_id}",
        headers=member_headers,
        json={"status": "revoked"},
    )
    assert revoked.status_code == 200
    assert client.get("/employer/company-context", headers=owner_headers).status_code == 403

    actions = set(db_session.execute(select(AdminAuditLog.action)).scalars())
    assert "membership.updated" in actions
    assert "membership.ownership_transferred" in actions


def test_department_scope_can_be_extended_with_explicit_job_assignment(
    client: TestClient,
    db_session: Session,
):
    owner_headers = _register_approved_employer(
        client,
        db_session,
        email="assignment-owner@example.com",
        company_name="Assignment Company",
    )
    engineering = client.post(
        "/employer/departments",
        headers=owner_headers,
        json={"name": "Engineering"},
    ).json()
    finance = client.post(
        "/employer/departments",
        headers=owner_headers,
        json={"name": "Finance"},
    ).json()
    invitation = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={
            "email": "assignment-head@example.com",
            "member_role": "department_head",
            "department_id": engineering["id"],
        },
    ).json()
    membership = client.post(
        f"/employer/invitations/{invitation['invite_token']}/accept",
        json={"full_name": "Assignment Head", "password": PASSWORD},
    ).json()
    head_login = client.post(
        "/auth/login",
        json={"email": "assignment-head@example.com", "password": PASSWORD},
    ).json()
    head_headers = {"Authorization": f"Bearer {head_login['access_token']}"}

    engineering_job = client.post(
        "/jobs",
        headers=owner_headers,
        json={
            "title": "Engineering Manager",
            "description": "Lead the engineering team and delivery.",
            "requirements": "Engineering leadership experience",
            "department_id": engineering["id"],
        },
    ).json()
    finance_job = client.post(
        "/jobs",
        headers=owner_headers,
        json={
            "title": "Finance Manager",
            "description": "Lead financial planning and reporting.",
            "requirements": "Finance management experience",
            "department_id": finance["id"],
        },
    ).json()

    scoped_before = client.get("/employer/team/jobs", headers=head_headers).json()
    assert [job["id"] for job in scoped_before] == [engineering_job["id"]]
    assert (
        client.get(
            f"/applications/employer/jobs/{finance_job['id']}",
            headers=head_headers,
        ).status_code
        == 403
    )

    assignment = client.put(
        f"/employer/team/jobs/{finance_job['id']}/assignments",
        headers=owner_headers,
        json={"membership_ids": [membership["id"]]},
    )
    assert assignment.status_code == 200
    assert assignment.json()["membership_ids"] == [membership["id"]]
    scoped_after = client.get("/employer/team/jobs", headers=head_headers).json()
    assert {job["id"] for job in scoped_after} == {
        engineering_job["id"],
        finance_job["id"],
    }


def test_department_head_can_evaluate_but_hr_owns_final_decision(
    client: TestClient,
    db_session: Session,
):
    owner_headers = _register_approved_employer(
        client,
        db_session,
        email="pipeline-owner@example.com",
        company_name="Pipeline Company",
    )
    department = client.post(
        "/employer/departments",
        headers=owner_headers,
        json={"name": "Engineering"},
    ).json()
    invitation = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={
            "email": "pipeline-head@example.com",
            "member_role": "department_head",
            "department_id": department["id"],
        },
    ).json()
    client.post(
        f"/employer/invitations/{invitation['invite_token']}/accept",
        json={"full_name": "Pipeline Head", "password": PASSWORD},
    )
    head_login = client.post(
        "/auth/login",
        json={"email": "pipeline-head@example.com", "password": PASSWORD},
    ).json()
    head_headers = {"Authorization": f"Bearer {head_login['access_token']}"}

    job = client.post(
        "/jobs",
        headers=owner_headers,
        json={
            "title": "Backend Engineer",
            "description": "Build reliable services for the recruitment platform.",
            "requirements": "Python and PostgreSQL",
            "department_id": department["id"],
        },
    )
    assert job.status_code == 201, job.text

    candidate = client.post(
        "/auth/register",
        json={
            "email": "pipeline-candidate@example.com",
            "password": PASSWORD,
            "full_name": "Pipeline Candidate",
            "role": "candidate",
        },
    )
    assert candidate.status_code == 201
    candidate_login = client.post(
        "/auth/login",
        json={"email": "pipeline-candidate@example.com", "password": PASSWORD},
    ).json()
    candidate_headers = {"Authorization": f"Bearer {candidate_login['access_token']}"}
    application = client.post(
        "/applications",
        headers=candidate_headers,
        json={"job_id": job.json()["id"]},
    ).json()

    visible = client.get(f"/applications/employer/jobs/{job.json()['id']}", headers=head_headers)
    assert visible.status_code == 200

    forbidden_decision = client.patch(
        f"/applications/{application['id']}",
        headers=head_headers,
        json={"status": "accepted"},
    )
    assert forbidden_decision.status_code == 403

    recommendation = client.put(
        f"/applications/{application['id']}/recommendation",
        headers=head_headers,
        json={
            "recommendation": "recommended",
            "note": "Đáp ứng tiêu chí kỹ thuật của bộ phận.",
        },
    )
    assert recommendation.status_code == 200, recommendation.text
    assert recommendation.json()["hiring_recommendation"] == "recommended"

    rounds = client.get(f"/applications/{application['id']}/rounds", headers=head_headers).json()
    forbidden_schedule = client.patch(
        f"/applications/rounds/{rounds[0]['id']}",
        headers=head_headers,
        json={"location": "Meeting room A"},
    )
    assert forbidden_schedule.status_code == 403

    final_decision = client.patch(
        f"/applications/{application['id']}",
        headers=owner_headers,
        json={"status": "accepted", "decision_reason": "HR approved after review."},
    )
    assert final_decision.status_code == 200
    detail = client.get(
        f"/applications/employer/jobs/{job.json()['id']}", headers=owner_headers
    ).json()[0]
    assert detail["decision_by_id"] is not None
    assert detail["decision_reason"] == "HR approved after review."


def test_batch_job_assignments_and_company_activity_are_tenant_scoped(
    client: TestClient,
    db_session: Session,
):
    owner_headers = _register_approved_employer(
        client,
        db_session,
        email="batch-owner@example.com",
        company_name="Batch Company",
    )
    department = client.post(
        "/employer/departments",
        headers=owner_headers,
        json={"name": "Engineering"},
    ).json()
    invitation = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={
            "email": "batch-head@example.com",
            "member_role": "department_head",
            "department_id": department["id"],
        },
    ).json()
    member = client.post(
        f"/employer/invitations/{invitation['invite_token']}/accept",
        json={"full_name": "Batch Head", "password": PASSWORD},
    ).json()
    head_token = client.post(
        "/auth/login",
        json={"email": "batch-head@example.com", "password": PASSWORD},
    ).json()["access_token"]
    head_headers = {"Authorization": f"Bearer {head_token}"}

    jobs = [
        client.post(
            "/jobs",
            headers=owner_headers,
            json={
                "title": title,
                "description": "A scoped role used to verify batch assignment.",
                "requirements": "Professional experience",
                "department_id": department["id"],
            },
        ).json()
        for title in ["Backend Engineer", "Platform Engineer"]
    ]

    update = client.put(
        "/employer/team/job-assignments",
        headers=owner_headers,
        json={
            "assignments": [{"job_id": job["id"], "membership_ids": [member["id"]]} for job in jobs]
        },
    )
    assert update.status_code == 200, update.text
    assert update.json() == {
        "assignments": [{"job_id": job["id"], "membership_ids": [member["id"]]} for job in jobs]
    }

    batch_read = client.get(
        "/employer/team/job-assignments",
        headers=owner_headers,
    )
    assert batch_read.status_code == 200
    batch_read_by_job = {
        item["job_id"]: item["membership_ids"] for item in batch_read.json()["assignments"]
    }
    assert batch_read_by_job == {job["id"]: [member["id"]] for job in jobs}
    assert (
        client.get(
            "/employer/team/job-assignments",
            headers=head_headers,
        ).status_code
        == 403
    )

    activity = client.get(
        "/employer/team/activity",
        headers=owner_headers,
        params={"action": "job.assignments_batch_updated"},
    )
    assert activity.status_code == 200
    assert activity.json()["total"] == 1
    event = activity.json()["items"][0]
    assert event["actor_email"] == "batch-owner@example.com"
    assert event["target_type"] == "job_assignment_batch"
    assert event["details_json"]["job_ids"] == [job["id"] for job in jobs]
    assert len(event["details_json"]["changes"]) == 2
    assert (
        client.get(
            "/employer/team/activity",
            headers=head_headers,
        ).status_code
        == 403
    )


def test_batch_job_assignments_are_atomic_and_reject_cross_tenant_ids(
    client: TestClient,
    db_session: Session,
):
    first_headers = _register_approved_employer(
        client,
        db_session,
        email="atomic-first@example.com",
        company_name="Atomic First",
    )
    second_headers = _register_approved_employer(
        client,
        db_session,
        email="atomic-second@example.com",
        company_name="Atomic Second",
    )
    first_membership_id = client.get(
        "/employer/company-context",
        headers=first_headers,
    ).json()["membership"]["id"]
    second_membership_id = client.get(
        "/employer/company-context",
        headers=second_headers,
    ).json()["membership"]["id"]

    first_jobs = [
        client.post(
            "/jobs",
            headers=first_headers,
            json={
                "title": title,
                "description": "Atomic batch assignment test job.",
                "requirements": "Relevant experience",
            },
        ).json()
        for title in ["Atomic Job A", "Atomic Job B"]
    ]
    foreign_job = client.post(
        "/jobs",
        headers=second_headers,
        json={
            "title": "Foreign Job",
            "description": "Must remain outside the first tenant.",
            "requirements": "Relevant experience",
        },
    ).json()

    initial = client.put(
        "/employer/team/job-assignments",
        headers=first_headers,
        json={
            "assignments": [
                {
                    "job_id": first_jobs[0]["id"],
                    "membership_ids": [first_membership_id],
                }
            ]
        },
    )
    assert initial.status_code == 200

    invalid_member = client.put(
        "/employer/team/job-assignments",
        headers=first_headers,
        json={
            "assignments": [
                {"job_id": first_jobs[0]["id"], "membership_ids": []},
                {
                    "job_id": first_jobs[1]["id"],
                    "membership_ids": [second_membership_id],
                },
            ]
        },
    )
    assert invalid_member.status_code == 422

    after_invalid_member = client.get(
        "/employer/team/job-assignments",
        headers=first_headers,
    ).json()["assignments"]
    by_job = {item["job_id"]: item["membership_ids"] for item in after_invalid_member}
    assert by_job[first_jobs[0]["id"]] == [first_membership_id]
    assert by_job[first_jobs[1]["id"]] == []

    invalid_job = client.put(
        "/employer/team/job-assignments",
        headers=first_headers,
        json={
            "assignments": [
                {"job_id": first_jobs[0]["id"], "membership_ids": []},
                {"job_id": foreign_job["id"], "membership_ids": []},
            ]
        },
    )
    assert invalid_job.status_code == 404
    assert client.get(
        f"/employer/team/jobs/{first_jobs[0]['id']}/assignments",
        headers=first_headers,
    ).json()["membership_ids"] == [first_membership_id]

    duplicate_job = client.put(
        "/employer/team/job-assignments",
        headers=first_headers,
        json={
            "assignments": [
                {"job_id": first_jobs[0]["id"], "membership_ids": []},
                {"job_id": first_jobs[0]["id"], "membership_ids": []},
            ]
        },
    )
    assert duplicate_job.status_code == 422

    client.post(
        "/employer/departments",
        headers=second_headers,
        json={"name": "Second Tenant Department"},
    )
    first_activity = client.get(
        "/employer/team/activity",
        headers=first_headers,
    ).json()
    assert all(
        item["actor_email"] != "atomic-second@example.com" for item in first_activity["items"]
    )

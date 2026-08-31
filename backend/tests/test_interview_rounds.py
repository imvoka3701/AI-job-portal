"""Tests for InterviewRound: auto-create Round 1, sync on PATCH, orphan cleanup."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus
from app.models.interview_round import InterviewRound, RoundStatus, RoundType
from app.models.user import User

# ─── Helpers ────────────────────────────────────────────────────────────────────


def _register_and_login(
    client: TestClient,
    db_session: Session,
    email: str,
    password: str,
    full_name: str = "Test",
    role: str = "candidate",
    company_name: str | None = None,
) -> dict[str, str]:
    payload: dict = {"email": email, "password": password, "full_name": full_name, "role": role}
    if company_name:
        payload["company_name"] = company_name
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code in (200, 201), resp.text
    user_data = resp.json()
    if role == "employer":
        user = db_session.query(User).filter(User.id == user_data["id"]).first()
        if user and not user.is_active:
            user.is_active = True
            db_session.commit()
    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200, login_resp.text
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}


def _create_job(client: TestClient, emp_headers: dict[str, str]) -> int:
    resp = client.post(
        "/jobs",
        json={
            "title": "Test Job",
            "description": "A test job posting with enough text to pass validation and generate embeddings.",
            "requirements": "Python, FastAPI",
            "benefits": "Remote work",
            "job_type": "full_time",
            "experience_level": "junior",
            "location": "Hanoi",
        },
        headers=emp_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ─── Tests ──────────────────────────────────────────────────────────────────────


class TestAutoCreateRound1:
    def test_apply_creates_round1(self, client: TestClient, db_session: Session):
        """POST /applications automatically creates Round 1 (cv_screen, pending)."""
        cand = _register_and_login(client, db_session, "r1_c@t.com", "p", "RCand")
        emp = _register_and_login(
            client, db_session, "r1_e@t.com", "p", "REmp", "employer", "RCorp"
        )
        job_id = _create_job(client, emp)

        resp = client.post("/applications", json={"job_id": job_id}, headers=cand)
        assert resp.status_code == 201, resp.text
        app_id = resp.json()["id"]

        # Verify Round 1 was auto-created
        app = db_session.get(Application, app_id)
        assert app is not None
        rounds = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).all()
        )
        assert len(rounds) == 1, f"Expected 1 round after apply, got {len(rounds)}"
        r1 = rounds[0]
        assert r1.round_number == 1
        assert r1.round_type == RoundType.CV_SCREEN.value
        assert r1.status == RoundStatus.PENDING.value
        assert "Duyệt CV" in (r1.round_name or "")

    def test_apply_creates_round1_then_another_apply_creates_round1_for_second_app(
        self, client: TestClient, db_session: Session
    ):
        """Two applications should each get their own Round 1."""
        cand = _register_and_login(client, db_session, "r1b_c@t.com", "p", "RC2")
        emp = _register_and_login(client, db_session, "r1b_e@t.com", "p", "RE2", "employer", "RC2")
        job_id = _create_job(client, emp)

        r1 = client.post("/applications", json={"job_id": job_id}, headers=cand)
        assert r1.status_code == 201
        r2 = client.post("/applications", json={"job_id": job_id}, headers=cand)
        assert r2.status_code == 201

        r1_rounds = (
            db_session.query(InterviewRound)
            .filter(InterviewRound.application_id == r1.json()["id"])
            .count()
        )
        r2_rounds = (
            db_session.query(InterviewRound)
            .filter(InterviewRound.application_id == r2.json()["id"])
            .count()
        )
        assert r1_rounds == 1
        assert r2_rounds == 1


class TestStatusSyncCreatesRound:
    def test_patch_reviewed_creates_round(self, client: TestClient, db_session: Session):
        """PATCH status→reviewed creates a cv_screen round."""
        cand = _register_and_login(client, db_session, "sr_c@t.com", "p", "SRC")
        emp = _register_and_login(client, db_session, "sr_e@t.com", "p", "SRE", "employer", "SRC")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        # Apply → Round 1 created (pending)
        rounds_before = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).count()
        )
        assert rounds_before == 1

        # PATCH status → reviewed
        client.patch(f"/applications/{app_id}", json={"status": "reviewed"}, headers=emp)

        rounds_after = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).all()
        )
        assert len(rounds_after) == 2  # original Round 1 + auto-created round

        # The auto-round should be type cv_screen
        auto_round = [r for r in rounds_after if "Auto" in (r.round_name or "")]
        assert len(auto_round) == 1
        assert auto_round[0].round_type == RoundType.CV_SCREEN.value

    def test_patch_accepted_creates_final_round(self, client: TestClient, db_session: Session):
        """PATCH status→accepted creates a final round + cleans orphans."""
        cand = _register_and_login(client, db_session, "sa_c@t.com", "p", "SAC")
        emp = _register_and_login(client, db_session, "sa_e@t.com", "p", "SAE", "employer", "SAC")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        # PATCH → accepted
        client.patch(f"/applications/{app_id}", json={"status": "accepted"}, headers=emp)

        rounds = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).all()
        )
        # Original Round 1 (now skipped) + auto final round (passed)
        r1 = [r for r in rounds if r.round_number == 1][0]
        assert r1.status == RoundStatus.SKIPPED.value, f"Round 1 should be skipped, got {r1.status}"

        auto = [r for r in rounds if "Auto" in (r.round_name or "")]
        assert len(auto) == 1
        assert auto[0].status == RoundStatus.PASSED.value
        assert auto[0].round_type == RoundType.FINAL.value


class TestOrphanCleanup:
    def test_no_orphan_rounds_after_accepted(self, client: TestClient, db_session: Session):
        """After accepted, no round should be pending or in_progress."""
        cand = _register_and_login(client, db_session, "oc1_c@t.com", "p", "OC1C")
        emp = _register_and_login(
            client, db_session, "oc1_e@t.com", "p", "OC1E", "employer", "OC1C"
        )
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        # Manually add extra pending rounds (simulating in-progress pipeline before accept)
        from app.crud.interview_round import crud_interview_round

        crud_interview_round.create(
            db_session, application_id=app_id, round_type="tech", round_name="Vòng 2: Tech"
        )
        crud_interview_round.create(
            db_session, application_id=app_id, round_type="hr", round_name="Vòng 3: HR"
        )

        # Verify we have 3 rounds, 2 pending
        rounds_before = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).all()
        )
        pending_before = [r for r in rounds_before if r.status == RoundStatus.PENDING.value]
        assert len(pending_before) == 3  # Round 1 (auto from POST) + Round 2 (tech) + Round 3 (hr)

        # PATCH → accepted
        client.patch(f"/applications/{app_id}", json={"status": "accepted"}, headers=emp)

        # Verify NO orphans
        rounds_after = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).all()
        )
        orphans = [
            r
            for r in rounds_after
            if r.status in (RoundStatus.PENDING.value, RoundStatus.IN_PROGRESS.value)
        ]
        assert len(orphans) == 0, (
            f"Found {len(orphans)} orphan rounds after accepted: {[r.round_name for r in orphans]}"
        )

    def test_no_orphan_rounds_after_rejected(self, client: TestClient, db_session: Session):
        """After rejected, no round should be pending or in_progress."""
        cand = _register_and_login(client, db_session, "oc2_c@t.com", "p", "OC2C")
        emp = _register_and_login(
            client, db_session, "oc2_e@t.com", "p", "OC2E", "employer", "OC2C"
        )
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        # Add pending rounds
        from app.crud.interview_round import crud_interview_round

        crud_interview_round.create(
            db_session, application_id=app_id, round_type="tech", round_name="Vòng 2: Tech"
        )

        # PATCH → rejected
        client.patch(f"/applications/{app_id}", json={"status": "rejected"}, headers=emp)

        # Verify NO orphans — all pending/in_progress → failed
        rounds = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).all()
        )
        orphans = [
            r
            for r in rounds
            if r.status in (RoundStatus.PENDING.value, RoundStatus.IN_PROGRESS.value)
        ]
        assert len(orphans) == 0, f"Found {len(orphans)} orphan rounds after rejected"


class TestRoundCRUD:
    def test_get_rounds_for_application(self, client: TestClient, db_session: Session):
        """GET /applications/{id}/rounds returns the rounds list."""
        cand = _register_and_login(client, db_session, "gr_c@t.com", "p", "GRC")
        emp = _register_and_login(client, db_session, "gr_e@t.com", "p", "GRE", "employer", "GRC")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        resp = client.get(f"/applications/{app_id}/rounds", headers=cand)
        assert resp.status_code == 200
        rounds = resp.json()
        assert len(rounds) == 1
        assert rounds[0]["round_type"] == "cv_screen"
        assert rounds[0]["status"] == "pending"

    def test_create_round_via_api(self, client: TestClient, db_session: Session):
        """POST /applications/{id}/rounds creates a new round."""
        cand = _register_and_login(client, db_session, "cr_c@t.com", "p", "CRC")
        emp = _register_and_login(client, db_session, "cr_e@t.com", "p", "CRE", "employer", "CRC")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        resp = client.post(
            f"/applications/{app_id}/rounds",
            json={"round_type": "tech", "round_name": "Phỏng vấn kỹ thuật"},
            headers=emp,
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["round_number"] == 2
        assert data["round_type"] == "tech"
        assert data["round_name"] == "Phỏng vấn kỹ thuật"
        assert data["status"] == "pending"

    def test_update_round_status_syncs_application(self, client: TestClient, db_session: Session):
        """PATCH /rounds/{id} with status=passed syncs Application.status."""
        cand = _register_and_login(client, db_session, "ur_c@t.com", "p", "URC")
        emp = _register_and_login(client, db_session, "ur_e@t.com", "p", "URE", "employer", "URC")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        # Get Round 1
        rounds_resp = client.get(f"/applications/{app_id}/rounds", headers=emp)
        round1_id = rounds_resp.json()[0]["id"]

        # Pass Round 1
        client.patch(f"/applications/rounds/{round1_id}", json={"status": "passed"}, headers=emp)

        # Application should now be reviewed
        app = db_session.get(Application, app_id)
        assert app.status == ApplicationStatus.REVIEWED

        # Round 1 should be passed
        r1 = db_session.get(InterviewRound, round1_id)
        assert r1.status == RoundStatus.PASSED.value


class TestEmployerInterviewsEndpoint:
    def test_employer_sees_interviews_sorted_soonest_first(
        self, client: TestClient, db_session: Session
    ):
        """GET /employer/interviews returns rounds sorted by scheduled_at ASC."""
        emp = _register_and_login(
            client, db_session, "ei1_e@t.com", "p", "EI1E", "employer", "EI1Corp"
        )
        cand = _register_and_login(client, db_session, "ei1_c@t.com", "p", "EI1C")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]

        # Get Round 1 and schedule 2 interviews
        r1 = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).first()
        )
        from app.crud.interview_round import crud_interview_round

        r2 = crud_interview_round.create(
            db_session, application_id=app_id, round_type="tech", round_name="Vòng 2"
        )

        now = datetime.utcnow()
        r1.scheduled_at = now + timedelta(days=3)
        r2.scheduled_at = now + timedelta(days=1)  # r2 is SOONER
        db_session.commit()

        resp = client.get("/employer/interviews", headers=emp)
        assert resp.status_code == 200
        data = resp.json()
        # r2 should be first (scheduled sooner)
        assert len(data) == 2
        assert data[0]["round_id"] == r2.id
        assert data[1]["round_id"] == r1.id

    def test_employer_only_sees_own_jobs(self, client: TestClient, db_session: Session):
        """Employer A cannot see interviews from Employer B's jobs."""
        emp_a = _register_and_login(
            client, db_session, "ei2a@t.com", "p", "EIA", "employer", "ACorp"
        )
        emp_b = _register_and_login(
            client, db_session, "ei2b@t.com", "p", "EIB", "employer", "BCorp"
        )
        cand = _register_and_login(client, db_session, "ei2c@t.com", "p", "EIC")

        job_a = _create_job(client, emp_a)
        job_b = _create_job(client, emp_b)

        app_a = client.post("/applications", json={"job_id": job_a}, headers=cand).json()["id"]
        app_b = client.post("/applications", json={"job_id": job_b}, headers=cand).json()["id"]

        r_a = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_a).first()
        )
        r_b = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_b).first()
        )
        r_a.scheduled_at = datetime.utcnow() + timedelta(days=1)
        r_b.scheduled_at = datetime.utcnow() + timedelta(days=2)
        db_session.commit()

        # Employer A sees only their job's interviews
        resp_a = client.get("/employer/interviews", headers=emp_a)
        assert resp_a.status_code == 200
        data_a = resp_a.json()
        assert all(item["job_title"] == "Test Job" for item in data_a)
        # Employer A should not see job_b's round
        round_ids_a = {item["round_id"] for item in data_a}
        assert r_a.id in round_ids_a
        assert r_b.id not in round_ids_a


class TestCandidateInterviewsEndpoint:
    def test_candidate_sees_own_interviews(self, client: TestClient, db_session: Session):
        """GET /applications/me/interviews returns candidate's scheduled rounds."""
        emp = _register_and_login(
            client, db_session, "ci1_e@t.com", "p", "CI1E", "employer", "CI1Corp"
        )
        cand = _register_and_login(client, db_session, "ci1_c@t.com", "p", "CI1C")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]
        r1 = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).first()
        )
        r1.scheduled_at = datetime.utcnow() + timedelta(days=1)
        db_session.commit()

        resp = client.get("/applications/me/interviews", headers=cand)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["job_title"] == "Test Job"
        assert data[0]["company_name"] == "CI1Corp"

    def test_candidate_only_sees_own_interviews(self, client: TestClient, db_session: Session):
        """Candidate A cannot see Candidate B's scheduled interviews."""
        emp = _register_and_login(
            client, db_session, "ci2_e@t.com", "p", "CI2E", "employer", "CI2Corp"
        )
        cand_a = _register_and_login(client, db_session, "ci2a@t.com", "p", "CIA")
        cand_b = _register_and_login(client, db_session, "ci2b@t.com", "p", "CIB")
        job_id = _create_job(client, emp)

        app_a = client.post("/applications", json={"job_id": job_id}, headers=cand_a).json()["id"]
        app_b = client.post("/applications", json={"job_id": job_id}, headers=cand_b).json()["id"]

        r_a = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_a).first()
        )
        r_b = (
            db_session.query(InterviewRound).filter(InterviewRound.application_id == app_b).first()
        )
        r_a.scheduled_at = datetime.utcnow() + timedelta(days=1)
        r_b.scheduled_at = datetime.utcnow() + timedelta(days=2)
        db_session.commit()

        # Candidate A sees only their interview
        resp_a = client.get("/applications/me/interviews", headers=cand_a)
        assert resp_a.status_code == 200
        data_a = resp_a.json()
        round_ids_a = {item["round_id"] for item in data_a}
        assert r_a.id in round_ids_a
        assert r_b.id not in round_ids_a


class TestAnalytics458:
    """4.5.8 — Extended analytics: source %, funnel pass rate, time-to-hire."""

    def test_funnel_pass_rate_exact(self, client: TestClient, db_session: Session):
        """Create 5 rounds, pass 3 → verify 60.0% pass rate."""
        emp = _register_and_login(
            client, db_session, "af1_e@t.com", "p", "AFE", "employer", "AFCorp"
        )
        cands = [
            _register_and_login(client, db_session, f"af1_c{i}@t.com", "p", f"AFC{i}")
            for i in range(5)
        ]
        job_id = _create_job(client, emp)

        from app.models.interview_round import RoundStatus

        for i, cand in enumerate(cands):
            app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()[
                "id"
            ]
            r1 = (
                db_session.query(InterviewRound)
                .filter(InterviewRound.application_id == app_id)
                .first()
            )
            r1.status = RoundStatus.PASSED.value if i < 3 else RoundStatus.FAILED.value
        db_session.commit()

        resp = client.get("/employer/stats", headers=emp)
        assert resp.status_code == 200
        funnel = resp.json()["funnel"]
        cv = next(f for f in funnel if f["round_type"] == "cv_screen")
        assert cv["entered"] == 5
        assert cv["passed"] == 3
        assert cv["failed"] == 2
        assert cv["pass_rate"] == 60.0, f"Expected 60.0%, got {cv['pass_rate']}"

    def test_time_to_hire_exact(self, client: TestClient, db_session: Session):
        """Accepted application with known dates → verify avg days matches."""
        from datetime import datetime as dt

        emp = _register_and_login(
            client, db_session, "atth_e@t.com", "p", "ATTH", "employer", "ATHCorp"
        )
        cand = _register_and_login(client, db_session, "atth_c@t.com", "p", "ATHC")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]
        app = db_session.query(Application).first()
        from app.models.application import ApplicationStatus

        app.applied_at = dt.utcnow().replace(microsecond=0) - timedelta(days=10)
        app.status = ApplicationStatus.ACCEPTED
        app.updated_at = dt.utcnow().replace(microsecond=0)
        db_session.commit()

        resp = client.get("/employer/stats", headers=emp)
        assert resp.status_code == 200
        tth = resp.json()["time_to_hire_avg_days"]
        assert tth is not None
        assert 9.5 <= tth <= 10.5, f"Expected ~10.0 days, got {tth}"

    def test_candidate_source_exact(self, client: TestClient, db_session: Session):
        """Create 3 direct candidates + 1 Google OAuth candidate → verify %."""
        for i in range(3):
            client.post(
                "/auth/register",
                json={
                    "email": f"src_d{i}@t.com",
                    "password": "p",
                    "full_name": f"D{i}",
                    "role": "candidate",
                },
            )
        from app.models.oauth_account import OAuthAccount
        from app.models.user import User

        oauth_user = User(
            email="src_o@t.com",
            hashed_password="x",
            full_name="OAuth",
            role="candidate",
            is_active=True,
        )
        db_session.add(oauth_user)
        db_session.flush()
        db_session.add(
            OAuthAccount(
                user_id=oauth_user.id,
                provider="google",
                provider_user_id="g123",
                email="src_o@t.com",
            )
        )
        db_session.commit()

        # Create a fresh admin for this test to avoid password conflicts
        admin_user = User(
            email="analytics_admin@t.com",
            hashed_password="x",
            full_name="AA",
            role="admin",
            is_active=True,
        )
        db_session.add(admin_user)
        db_session.flush()
        from app.core.security import hash_password

        admin_user.hashed_password = hash_password("adminpass")
        db_session.commit()
        login = client.post(
            "/auth/login", json={"email": "analytics_admin@t.com", "password": "adminpass"}
        )
        token = login.json()["access_token"]

        resp = client.get("/admin/stats", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        src = data["candidate_source_pct"]
        assert "direct" in src
        assert "google_oauth" in src
        assert src["direct"] > 0, f"Direct source should be > 0, got {src['direct']}%"
        assert src["google_oauth"] > 0, f"Google OAuth should be > 0, got {src['google_oauth']}%"

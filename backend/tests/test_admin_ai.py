"""Admin AI Control Panel — tests for prompt management, call logs, and stats.

Covers:
- GET /admin/ai/prompts — returns seeded prompts
- PATCH /admin/ai/prompts/{feature} — update prompt, verify DB
- POST /admin/ai/prompts/{feature}/test — mocked Deepseek call
- GET /admin/ai/logs — paginated log listing with filters
- GET /admin/ai/stats — aggregate stats
- RBAC: non-admin gets 403
"""

from unittest.mock import AsyncMock, patch

from app.core.security import hash_password
from app.models.ai_call_log import AICallLog, AICallStatus, AIFeature
from app.models.ai_prompt_config import AIPromptConfig
from app.models.user import User, UserRole


def _create_user(db, *, email, role, full_name="Test User"):
    user = User(
        email=email,
        hashed_password=hash_password("secret123"),
        full_name=full_name,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client, email):
    r = client.post("/auth/login", json={"email": email, "password": "secret123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _seed_prompts(db):
    prompts = []
    for feat in AIFeature:
        if feat == AIFeature.MATCHING:
            continue
        cfg = AIPromptConfig(
            feature=feat,
            system_prompt=f"Fallback prompt for {feat.value}",
            is_active=True,
        )
        db.add(cfg)
        prompts.append(cfg)
    db.commit()
    return prompts


class TestListPrompts:
    def test_admin_can_list_prompts(self, client, db_session):
        admin = _create_user(db_session, email="admin@ai-test.example.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)
        _seed_prompts(db_session)
        r = client.get("/admin/ai/prompts", headers=headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 4
        features = [item["feature"] for item in data]
        assert "cv_evaluate" in features
        assert "roadmap" in features

    def test_candidate_gets_403(self, client, db_session):
        user = _create_user(db_session, email="cand@ai-test.example.com", role=UserRole.CANDIDATE)
        headers = _login(client, user.email)
        r = client.get("/admin/ai/prompts", headers=headers)
        assert r.status_code == 403

    def test_employer_gets_403(self, client, db_session):
        user = _create_user(db_session, email="emp@ai-test.example.com", role=UserRole.EMPLOYER)
        headers = _login(client, user.email)
        r = client.get("/admin/ai/prompts", headers=headers)
        assert r.status_code == 403

    def test_unauthenticated_gets_401(self, client, db_session):
        r = client.get("/admin/ai/prompts")
        assert r.status_code == 401


class TestUpdatePrompt:
    def test_admin_can_update_prompt(self, client, db_session):
        admin = _create_user(db_session, email="admin-upd@ai-test.example.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)
        _seed_prompts(db_session)
        new_prompt = "You are an expert CV reviewer. Return JSON only."
        r = client.patch(
            "/admin/ai/prompts/cv_evaluate",
            json={"system_prompt": new_prompt},
            headers=headers,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["feature"] == "cv_evaluate"
        assert data["system_prompt"] == new_prompt
        assert data["updated_by"] == admin.id

        # Verify immutable audit log was created
        from app.models.admin_audit_log import AdminAuditLog

        audit = (
            db_session.query(AdminAuditLog)
            .filter(AdminAuditLog.action == "ai_prompt.updated")
            .first()
        )
        assert audit is not None
        assert audit.actor_user_id == admin.id
        assert audit.target_type == "ai_prompt"
        assert audit.target_label == "cv_evaluate"


    def test_update_creates_record_if_missing(self, client, db_session):
        admin = _create_user(db_session, email="admin-new@ai-test.example.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)
        r = client.patch(
            "/admin/ai/prompts/roadmap",
            json={"system_prompt": "New roadmap prompt"},
            headers=headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["system_prompt"] == "New roadmap prompt"

    def test_non_admin_cannot_update(self, client, db_session):
        user = _create_user(db_session, email="emp-upd@ai-test.example.com", role=UserRole.EMPLOYER)
        headers = _login(client, user.email)
        r = client.patch(
            "/admin/ai/prompts/cv_evaluate",
            json={"system_prompt": "hack"},
            headers=headers,
        )
        assert r.status_code == 403

    def test_invalid_feature_returns_422(self, client, db_session):
        admin = _create_user(db_session, email="admin-inv@ai-test.example.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)
        r = client.patch(
            "/admin/ai/prompts/does_not_exist",
            json={"system_prompt": "x"},
            headers=headers,
        )
        assert r.status_code == 422


class TestTestPrompt:
    def test_mocked_test_call_returns_result(self, client, db_session):
        admin = _create_user(
            db_session, email="admin-test@ai-test.example.com", role=UserRole.ADMIN
        )
        headers = _login(client, admin.email)
        fake_response = {
            "choices": [{"message": {"content": "Test AI response"}}],
            "usage": {"prompt_tokens": 50, "completion_tokens": 30},
        }
        with patch(
            "app.services.deepseek_client.DeepseekClient.create_chat_completion",
            new_callable=AsyncMock,
            return_value=fake_response,
        ):
            r = client.post(
                "/admin/ai/prompts/cv_evaluate/test",
                json={"system_prompt": "You are a CV expert."},
                headers=headers,
            )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["feature"] == "cv_evaluate"
        assert "Test AI response" in data["ai_response"]
        assert data["duration_ms"] >= 0

    def test_non_admin_cannot_test(self, client, db_session):
        user = _create_user(
            db_session, email="cand-test@ai-test.example.com", role=UserRole.CANDIDATE
        )
        headers = _login(client, user.email)
        r = client.post(
            "/admin/ai/prompts/cv_evaluate/test",
            json={"system_prompt": "x"},
            headers=headers,
        )
        assert r.status_code == 403

    def test_email_test_composes_different_system_prompt_per_type(self, client, db_session):
        """Regression test: POST /admin/ai/prompts/generate_email/test must compose
        effective_system = persona + EMAIL_TYPE_SYSTEM_RULES[email_type].

        Previously the endpoint always used the persona alone (no type rules) and always
        sent a hardcoded "Loai: invite" sample regardless of the selected type — meaning
        Admin could never actually verify reject-safety constraints through the UI.

        This test asserts that:
        - "reject" call includes EMAIL_TYPE_SYSTEM_RULES["reject"] in the system message
        - "invite" call includes EMAIL_TYPE_SYSTEM_RULES["invite"] in the system message
        - The two system messages are DIFFERENT from each other and from the bare persona
        """
        from app.services.email_generator import EMAIL_TYPE_SYSTEM_RULES

        admin = _create_user(
            db_session, email="admin-email-test@ai-test.example.com", role=UserRole.ADMIN
        )
        headers = _login(client, admin.email)

        persona = "Bạn là trợ lý HR chuyên nghiệp. Viết email ngắn gọn, lịch sự."
        fake_response = {
            "choices": [{"message": {"content": "Email được soạn."}}],
            "usage": {"prompt_tokens": 80, "completion_tokens": 40},
        }

        captured_calls: list[list[dict]] = []

        async def _capture(*args, **kwargs):
            # Record the messages argument for later assertion
            captured_calls.append(kwargs.get("messages", args[0] if args else []))
            return fake_response

        with patch(
            "app.services.deepseek_client.DeepseekClient.create_chat_completion",
            new_callable=AsyncMock,
            side_effect=_capture,
        ):
            # --- Call 1: reject ---
            r_reject = client.post(
                "/admin/ai/prompts/generate_email/test",
                json={"system_prompt": persona, "user_prompt_template": "reject"},
                headers=headers,
            )
            # --- Call 2: invite ---
            r_invite = client.post(
                "/admin/ai/prompts/generate_email/test",
                json={"system_prompt": persona, "user_prompt_template": "invite"},
                headers=headers,
            )

        assert r_reject.status_code == 200, f"reject failed: {r_reject.text}"
        assert r_invite.status_code == 200, f"invite failed: {r_invite.text}"
        assert len(captured_calls) == 2, "Expected exactly 2 Deepseek calls"

        sys_reject = captured_calls[0][0]["content"]  # messages[0] = system role
        sys_invite = captured_calls[1][0]["content"]

        # 1. Each system prompt must contain the persona
        assert persona in sys_reject, "Persona missing from reject system prompt"
        assert persona in sys_invite, "Persona missing from invite system prompt"

        # 2. Each system prompt must contain the correct type-specific rules
        reject_rules = EMAIL_TYPE_SYSTEM_RULES["reject"]
        invite_rules = EMAIL_TYPE_SYSTEM_RULES["invite"]
        assert reject_rules in sys_reject, (
            "EMAIL_TYPE_SYSTEM_RULES['reject'] not in reject system prompt"
        )
        assert invite_rules in sys_invite, (
            "EMAIL_TYPE_SYSTEM_RULES['invite'] not in invite system prompt"
        )

        # 3. The two system prompts must be different (core regression guard)
        assert sys_reject != sys_invite, (
            "reject and invite system prompts are identical — type rules not being composed"
        )

        # 4. Bare persona alone must not equal either composed system prompt
        assert sys_reject != persona, (
            "reject system prompt equals bare persona — rules not appended"
        )
        assert sys_invite != persona, (
            "invite system prompt equals bare persona — rules not appended"
        )


class TestCallLogs:
    def _seed_logs(self, db, user_id):
        db.add(
            AICallLog(
                feature=AIFeature.CV_EVALUATE,
                user_id=user_id,
                status=AICallStatus.SUCCESS,
                duration_ms=450,
                input_tokens=100,
                output_tokens=60,
                cost_usd=0.000093,
            )
        )
        db.add(
            AICallLog(
                feature=AIFeature.ROADMAP,
                user_id=user_id,
                status=AICallStatus.FAILED,
                duration_ms=1200,
                error_message="Timeout",
            )
        )
        db.commit()

    def test_admin_can_list_logs(self, client, db_session):
        admin = _create_user(db_session, email="admin-log@ai-test.example.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)
        self._seed_logs(db_session, admin.id)
        r = client.get("/admin/ai/logs", headers=headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    def test_filter_by_feature(self, client, db_session):
        admin = _create_user(
            db_session, email="admin-logf@ai-test.example.com", role=UserRole.ADMIN
        )
        headers = _login(client, admin.email)
        self._seed_logs(db_session, admin.id)
        r = client.get("/admin/ai/logs?feature=cv_evaluate", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 1
        assert data["items"][0]["feature"] == "cv_evaluate"

    def test_filter_by_status(self, client, db_session):
        admin = _create_user(
            db_session, email="admin-logs@ai-test.example.com", role=UserRole.ADMIN
        )
        headers = _login(client, admin.email)
        self._seed_logs(db_session, admin.id)
        r = client.get("/admin/ai/logs?status=failed", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 1
        assert data["items"][0]["status"] == "failed"

    def test_pagination_works(self, client, db_session):
        admin = _create_user(
            db_session, email="admin-logp@ai-test.example.com", role=UserRole.ADMIN
        )
        headers = _login(client, admin.email)
        self._seed_logs(db_session, admin.id)
        r = client.get("/admin/ai/logs?page=1&page_size=1", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 2
        assert len(data["items"]) == 1

    def test_non_admin_gets_403(self, client, db_session):
        user = _create_user(db_session, email="emp-log@ai-test.example.com", role=UserRole.EMPLOYER)
        headers = _login(client, user.email)
        r = client.get("/admin/ai/logs", headers=headers)
        assert r.status_code == 403


class TestStats:
    def test_empty_stats_returns_zeros(self, client, db_session):
        admin = _create_user(
            db_session, email="admin-stat@ai-test.example.com", role=UserRole.ADMIN
        )
        headers = _login(client, admin.email)
        r = client.get("/admin/ai/stats", headers=headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["total_calls_today"] == 0
        assert data["error_rate_pct"] == 0.0
        assert isinstance(data["by_feature"], list)

    def test_stats_error_rate(self, client, db_session):
        admin = _create_user(
            db_session, email="admin-stat2@ai-test.example.com", role=UserRole.ADMIN
        )
        headers = _login(client, admin.email)
        for _ in range(2):
            db_session.add(
                AICallLog(
                    feature=AIFeature.CV_EVALUATE,
                    status=AICallStatus.SUCCESS,
                    duration_ms=300,
                    cost_usd=0.0001,
                )
            )
        db_session.add(
            AICallLog(
                feature=AIFeature.ROADMAP,
                status=AICallStatus.FAILED,
                duration_ms=500,
            )
        )
        db_session.commit()
        r = client.get("/admin/ai/stats", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert abs(data["error_rate_pct"] - 33.33) < 0.5

    def test_non_admin_gets_403(self, client, db_session):
        user = _create_user(
            db_session, email="emp-stat@ai-test.example.com", role=UserRole.EMPLOYER
        )
        headers = _login(client, user.email)
        r = client.get("/admin/ai/stats", headers=headers)
        assert r.status_code == 403

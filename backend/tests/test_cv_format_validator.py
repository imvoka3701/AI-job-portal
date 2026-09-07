"""Unit and integration tests for CV Format Validator (Tier 1 Heuristic & Tier 2 LLM)."""

from unittest.mock import AsyncMock

import pytest

from app.services.cv_evaluator import CVEvaluatorService
from app.services.cv_format_validator import (
    validate_cv_heuristic,
)


class TestCVHeuristicValidator:
    """Test suite for Tier 1 Heuristic Pre-check."""

    def test_empty_or_none_text(self):
        res1 = validate_cv_heuristic("")
        assert res1.is_valid is False
        assert "trống" in res1.reason

        res2 = validate_cv_heuristic(None)
        assert res2.is_valid is False

    def test_text_too_short(self):
        res = validate_cv_heuristic("Nguyễn Văn A - 0901234567 - dev")
        assert res.is_valid is False
        assert "quá ngắn" in res.reason

    def test_invoice_rejected_missing_professional_sections(self):
        """Invoice has contact phone/email but no experience/education/skills."""
        invoice_text = (
            "HÓA ĐƠN GIÁ TRỊ GIA TĂNG (VAT INVOICE)\n"
            "Công ty Cổ phần Thương mại Dịch vụ XYZ\n"
            "Địa chỉ: 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh\n"
            "Mã số thuế: 0312345678 - Hotline: 02839123456 - Email: support@xyz-corp.vn\n"
            "Khách hàng: Trần Văn Nam - Số điện thoại: 0987654321\n"
            "Danh mục hàng hóa dịch vụ: Bàn phím cơ không dây, Chuột gaming RGB\n"
            "Tổng tiền thanh toán: 2.500.000 VNĐ. Hình thức: Chuyển khoản ngân hàng."
        )
        res = validate_cv_heuristic(invoice_text)
        assert res.is_valid is False
        assert res.has_contact is True
        assert "thiếu các mục chuyên môn" in res.reason

    def test_article_rejected_missing_contact_info(self):
        """Technical article mentions skills and experience but has no email or phone."""
        article_text = (
            "Hướng dẫn tối ưu hiệu năng cơ sở dữ liệu PostgreSQL cho dự án lớn.\n"
            "Trong quá trình làm việc thực tế và kinh nghiệm phát triển phần mềm, "
            "chúng tôi nhận thấy kỹ năng đánh index B-Tree và HNSW đóng vai trò sống còn. "
            "Các lập trình viên cần trau dồi kỹ năng chuyên môn về kiến trúc microservices, "
            "đồng thời học vấn và nền tảng đại học sẽ giúp hiểu sâu về giải thuật tìm kiếm."
        )
        res = validate_cv_heuristic(article_text)
        assert res.is_valid is False
        assert res.has_contact is False
        assert "thiếu thông tin liên hệ bắt buộc" in res.reason

    def test_fresher_cv_accepted(self):
        """Fresher CV: Contact + Education + Skills (no prior work experience)."""
        fresher_cv = (
            "HỌ VÀ TÊN: LÊ MINH HOÀNG\n"
            "Email: hoang.le@gmail.com - Điện thoại: 0912345678\n"
            "TRÌNH ĐỘ HỌC VẤN:\n"
            "Đại học Bách Khoa TP.HCM - Chuyên ngành Kỹ thuật Phần mềm (2022 - 2026)\n"
            "Điểm trung bình (GPA): 3.6/4.0 - Bằng Giỏi\n"
            "KỸ NĂNG CHUYÊN MÔN:\n"
            "- Ngôn ngữ lập trình: Python, TypeScript, SQL\n"
            "- Frameworks: FastAPI, React, Node.js\n"
            "- Cơ sở dữ liệu: PostgreSQL, Redis\n"
            "- Kỹ năng mềm: Giao tiếp tiếng Anh lưu loát, làm việc nhóm chủ động."
        )
        res = validate_cv_heuristic(fresher_cv)
        assert res.is_valid is True
        assert res.has_contact is True
        assert "education" in res.detected_groups
        assert "skills" in res.detected_groups

    def test_senior_cv_accepted(self):
        """Senior CV: Contact + Experience + Skills (may omit formal education details)."""
        senior_cv = (
            "NGUYEN ANH DUC - SENIOR BACKEND ENGINEER\n"
            "Contact: duc.nguyen@techhub.io | Mobile: (+84) 938 123 456 | Location: Da Nang\n"
            "WORK EXPERIENCE:\n"
            "Tech Lead at Fintech Global (2021 - Present)\n"
            "- Led architectural redesign of high-throughput payment settlement engine.\n"
            "- Built robust microservices handling 50k RPS with 99.99% uptime SLA.\n"
            "CORE COMPETENCIES & TECHNICAL SKILLS:\n"
            "- Distributed Systems, Golang, Python, Kafka, Docker, Kubernetes, AWS Cloud."
        )
        res = validate_cv_heuristic(senior_cv)
        assert res.is_valid is True
        assert res.has_contact is True
        assert "experience" in res.detected_groups
        assert "skills" in res.detected_groups


@pytest.mark.asyncio
class TestCVEvaluatorServiceValidation:
    """Test suite for 2-Tier Validation in CVEvaluatorService."""

    async def test_tier1_fast_reject_bypasses_deepseek_call(self, monkeypatch):
        """If Tier 1 fails, DeepSeek LLM must NOT be called at all (0 cost)."""
        service = CVEvaluatorService()
        mock_llm = AsyncMock()
        monkeypatch.setattr(service.client, "create_chat_completion", mock_llm)

        garbage_invoice = (
            "HÓA ĐƠN TIỀN ĐIỆN SINH HOẠT THÁNG 8\n"
            "Mã khách hàng: KH0987123 - CSKH: cskh@evn.com.vn - SĐT: 0901234567\n"
            "Chỉ số cũ: 1240 kWh - Chỉ số mới: 1560 kWh - Điện năng tiêu thụ: 320 kWh\n"
            "Tổng số tiền thanh toán: 850.000 VNĐ. Hạn chót thanh toán ngày 15/09."
        )

        is_valid, reason = await service.validate_is_cv(garbage_invoice)

        assert is_valid is False
        assert "thiếu các mục chuyên môn" in reason
        # Verify DeepSeek client was never called!
        mock_llm.assert_not_called()

    async def test_tier2_accepts_valid_cv(self, monkeypatch):
        """If Tier 1 passes and LLM confirms, return (True, '')."""
        service = CVEvaluatorService()
        mock_llm = AsyncMock(
            return_value={"choices": [{"message": {"content": '{"is_valid": true, "reason": ""}'}}]}
        )
        monkeypatch.setattr(service.client, "create_chat_completion", mock_llm)

        valid_cv_text = (
            "TRAN TRONG PHUC - FULLSTACK DEVELOPER\n"
            "Email: phuc.tran@example.com - Phone: 0905123456\n"
            "KINH NGHIỆM LÀM VIỆC:\n"
            "2 năm phát triển hệ thống web thương mại điện tử với FastAPI và React.\n"
            "KỸ NĂNG:\n"
            "Python, React, TypeScript, Docker, CI/CD Pipeline."
        )

        is_valid, reason = await service.validate_is_cv(valid_cv_text)

        assert is_valid is True
        assert reason == ""
        mock_llm.assert_called_once()

    async def test_tier2_rejects_non_cv_with_reason(self, monkeypatch):
        """If Tier 1 passes by coincidence but LLM rejects as non-CV (e.g. training contract)."""
        service = CVEvaluatorService()
        mock_llm = AsyncMock(
            return_value={
                "choices": [
                    {
                        "message": {
                            "content": '{"is_valid": false, "reason": "Đây là hợp đồng đào tạo học viên, không phải hồ sơ ứng tuyển cá nhân."}'
                        }
                    }
                ]
            }
        )
        monkeypatch.setattr(service.client, "create_chat_completion", mock_llm)

        contract_text = (
            "HỢP ĐỒNG ĐÀO TẠO KỸ NĂNG VÀ NÂNG CAO TRÌNH ĐỘ HỌC VẤN\n"
            "Đại diện bên A: Giám đốc đào tạo - Email: contact@academy.edu.vn - SĐT: 0903112233\n"
            "Nội dung: Cam kết đào tạo kinh nghiệm thực tế và kỹ năng lập trình cho học viên khóa K15.\n"
            "Thời hạn học vấn: 6 tháng tập trung tại trung tâm đào tạo."
        )

        is_valid, reason = await service.validate_is_cv(contract_text)

        assert is_valid is False
        assert "hợp đồng đào tạo" in reason
        mock_llm.assert_called_once()

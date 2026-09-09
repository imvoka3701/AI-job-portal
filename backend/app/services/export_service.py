"""Enterprise CSV/Excel Export Service with UTF-8 BOM encoding."""

import csv
import io
from typing import Any, Iterable

# UTF-8 Byte Order Mark to ensure Excel correctly decodes Vietnamese diacritics
UTF8_BOM = "\ufeff"

STATUS_LABELS: dict[str, str] = {
    "pending": "Chờ duyệt",
    "reviewing": "Đang xem xét",
    "shortlisted": "Đạt sơ loại",
    "accepted": "Trúng tuyển",
    "rejected": "Từ chối",
}

RECOMMENDATION_LABELS: dict[str, str] = {
    "strongly_hire": "Rất khuyến nghị",
    "hire": "Khuyến nghị",
    "consider": "Cần cân nhắc",
    "reject": "Không phù hợp",
}


def generate_candidates_csv(rows: Iterable[dict[str, Any]]) -> str:
    """Generate RFC 4180 CSV string with UTF-8 BOM for candidate application records."""
    output = io.StringIO()
    output.write(UTF8_BOM)
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    headers = [
        "Mã hồ sơ",
        "Họ và tên ứng viên",
        "Email",
        "Số điện thoại",
        "Vị trí ứng tuyển",
        "Phòng ban",
        "Ngày ứng tuyển",
        "Trạng thái hồ sơ",
        "Điểm AI Matching (%)",
        "Đánh giá AI tóm tắt",
        "Đề xuất Trưởng BP",
        "Ghi chú đề xuất",
        "Vòng phỏng vấn hiện tại",
        "Lịch phỏng vấn gần nhất",
    ]
    writer.writerow(headers)

    for row in rows:
        status_key = str(row.get("status", "")).lower()
        status_label = STATUS_LABELS.get(status_key, row.get("status", "") or "—")

        rec_key = str(row.get("hiring_recommendation", "")).lower()
        rec_label = RECOMMENDATION_LABELS.get(rec_key, row.get("hiring_recommendation", "") or "—")

        ai_score = row.get("ai_matching_score")
        ai_score_str = f"{round(float(ai_score), 1)}%" if ai_score is not None else "Chưa chấm"

        writer.writerow(
            [
                row.get("application_id", ""),
                row.get("candidate_name", ""),
                row.get("candidate_email", ""),
                row.get("candidate_phone") or "—",
                row.get("job_title", ""),
                row.get("department_name") or "Chưa phân bổ",
                row.get("applied_at", ""),
                status_label,
                ai_score_str,
                row.get("ai_feedback") or "—",
                rec_label,
                row.get("recommendation_note") or "—",
                row.get("current_round_name") or "—",
                row.get("interview_scheduled_at") or "—",
            ]
        )

    return output.getvalue()


def generate_pipeline_metrics_csv(metrics_data: dict[str, Any]) -> str:
    """Generate comprehensive recruitment pipeline analytics CSV with UTF-8 BOM."""
    output = io.StringIO()
    output.write(UTF8_BOM)
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # 1. Executive Summary
    writer.writerow(["BÁO CÁO TỔNG QUAN HIỆU SUẤT TUYỂN DỤNG"])
    writer.writerow(["Chỉ số", "Giá trị"])
    writer.writerow(["Tổng số vị trí tuyển dụng", metrics_data.get("total_jobs", 0)])
    writer.writerow(["Tổng số đơn ứng tuyển", metrics_data.get("total_applications", 0)])
    tth = metrics_data.get("time_to_hire_avg_days")
    writer.writerow(
        [
            "Thời gian tuyển dụng trung bình (Time-to-Hire)",
            f"{tth} ngày" if tth is not None else "—",
        ]
    )
    avg_score = metrics_data.get("avg_ai_match")
    writer.writerow(
        ["Điểm AI Matching trung bình", f"{avg_score}%" if avg_score is not None else "—"]
    )
    writer.writerow([])

    # 2. Funnel Breakdown
    writer.writerow(["THỐNG KÊ PHỄU ỨNG VIÊN THEO VÒNG"])
    writer.writerow(
        [
            "Vòng phỏng vấn",
            "Số lượng vào",
            "Vượt qua",
            "Bị loại",
            "Bỏ qua / Huỷ",
            "Đang xử lý",
            "Tỷ lệ đỗ (%)",
        ]
    )
    for f in metrics_data.get("funnel", []):
        writer.writerow(
            [
                f.get("round_name", ""),
                f.get("entered", 0),
                f.get("passed", 0),
                f.get("failed", 0),
                f.get("skipped", 0),
                f.get("pending", 0),
                f"{f.get('pass_rate', 0)}%",
            ]
        )
    writer.writerow([])

    # 3. Active Jobs Breakdown
    writer.writerow(["CHI TIẾT THEO VỊ TRÍ TUYỂN DỤNG"])
    writer.writerow(
        [
            "Mã tin",
            "Tiêu đề công việc",
            "Địa điểm",
            "Cấp bậc",
            "Loại hình",
            "Số lượng ứng viên",
            "Điểm AI trung bình",
        ]
    )
    for j in metrics_data.get("active_jobs", []):
        job_score = j.get("avg_ai_match")
        writer.writerow(
            [
                j.get("id", ""),
                j.get("title", ""),
                j.get("location", ""),
                j.get("experience_level", ""),
                j.get("job_type", ""),
                j.get("applicant_count", 0),
                f"{job_score}%" if job_score is not None else "—",
            ]
        )

    return output.getvalue()

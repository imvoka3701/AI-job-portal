"""Seed AI Call Logs — tái tạo lịch sử gọi API thực tế cho Admin Dashboard.

Mô phỏng 30 ngày hoạt động AI với phân bố tự nhiên:
  - Nhiều calls hơn vào giờ cao điểm (9-11h, 14-17h)
  - Weekend ít hơn weekday
  - Tỷ lệ lỗi thực tế: ~4-6%
  - Chi phí token theo đúng giá Deepseek V3

Run:
  docker exec aijob-backend sh -c "cd /app && python seed_ai_call_logs.py"
"""

import random
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models.ai_call_log import AICallLog, AICallStatus, AIFeature

# ── Config ─────────────────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)

# User IDs từ DB sau khi seed demo
CANDIDATE_IDS = [76, 77, 78, 79, 80, 81, 82, 83]
EMPLOYER_IDS  = [74, 75]
ADMIN_ID      = 73

# Deepseek V3 pricing (đồng bộ với deepseek_client.py)
PRICE_INPUT_PER_1M  = 0.27   # USD
PRICE_OUTPUT_PER_1M = 1.10   # USD

# Phân bố feature theo tỷ lệ sử dụng thực tế
FEATURE_WEIGHTS = {
    AIFeature.CV_EVALUATE:        20,   # HR dùng nhiều nhất
    AIFeature.GENERATE_EMAIL:     18,   # Gửi email ứng viên
    AIFeature.MATCHING:            0,   # Local embedding — không gọi Deepseek
    AIFeature.ASSISTANT_CHAT:     16,   # Candidate chat với AI
    AIFeature.SUMMARIZE_CV:       12,   # HR summarize CV trước phỏng vấn
    AIFeature.INTERVIEW_QUESTIONS: 11,  # Chuẩn bị phỏng vấn
    AIFeature.COVER_LETTER:        9,   # Candidate tạo cover letter
    AIFeature.GENERATE_JD:         8,   # HR tạo JD mới
    AIFeature.ROADMAP:             6,   # Candidate xem lộ trình
}

# Token ranges per feature (realistic input/output pairs)
FEATURE_TOKEN_RANGES = {
    AIFeature.CV_EVALUATE:         {"in": (800, 2200),  "out": (350, 700)},
    AIFeature.GENERATE_EMAIL:      {"in": (400, 900),   "out": (200, 450)},
    AIFeature.ASSISTANT_CHAT:      {"in": (300, 1200),  "out": (150, 600)},
    AIFeature.SUMMARIZE_CV:        {"in": (900, 2500),  "out": (250, 550)},
    AIFeature.INTERVIEW_QUESTIONS: {"in": (500, 1100),  "out": (400, 850)},
    AIFeature.COVER_LETTER:        {"in": (600, 1400),  "out": (350, 750)},
    AIFeature.GENERATE_JD:         {"in": (300, 700),   "out": (500, 1200)},
    AIFeature.ROADMAP:             {"in": (700, 1800),  "out": (500, 1100)},
    AIFeature.CV_PARSE:            {"in": (600, 1500),  "out": (150, 400)},
}

# Duration ranges per feature (ms) — slower features = higher tokens
FEATURE_DURATION_RANGES = {
    AIFeature.CV_EVALUATE:         (1800, 5500),
    AIFeature.GENERATE_EMAIL:      (900, 3200),
    AIFeature.ASSISTANT_CHAT:      (700, 2800),
    AIFeature.SUMMARIZE_CV:        (1500, 4800),
    AIFeature.INTERVIEW_QUESTIONS: (1200, 4200),
    AIFeature.COVER_LETTER:        (1400, 4500),
    AIFeature.GENERATE_JD:         (1600, 5000),
    AIFeature.ROADMAP:             (2000, 6000),
    AIFeature.CV_PARSE:            (1000, 3500),
}

# Feature → user pool (ai nghĩa là ai dùng feature này)
FEATURE_USER_POOL = {
    AIFeature.CV_EVALUATE:         EMPLOYER_IDS,
    AIFeature.GENERATE_EMAIL:      EMPLOYER_IDS,
    AIFeature.ASSISTANT_CHAT:      CANDIDATE_IDS + EMPLOYER_IDS,
    AIFeature.SUMMARIZE_CV:        EMPLOYER_IDS,
    AIFeature.INTERVIEW_QUESTIONS: EMPLOYER_IDS,
    AIFeature.COVER_LETTER:        CANDIDATE_IDS,
    AIFeature.GENERATE_JD:         EMPLOYER_IDS,
    AIFeature.ROADMAP:             CANDIDATE_IDS,
    AIFeature.CV_PARSE:            CANDIDATE_IDS,
}

# Các lỗi thực tế hay gặp
REALISTIC_ERRORS = [
    "HTTP 429: Too Many Requests — rate limit exceeded",
    "Timeout: HTTPSConnectionPool read timed out after 30.0s",
    "HTTP 500: Internal Server Error from Deepseek API",
    "HTTP 503: Service temporarily unavailable",
    "JSONDecodeError: Expecting value — empty response from model",
    "ValueError: Empty response from Deepseek after 2 retries",
]


def calc_cost(input_tokens: int, output_tokens: int) -> float:
    return (input_tokens * PRICE_INPUT_PER_1M + output_tokens * PRICE_OUTPUT_PER_1M) / 1_000_000


def get_hour_weight(hour: int) -> float:
    """Phân bố giờ dùng — cao điểm 9-11h và 14-17h."""
    if 9 <= hour <= 11:
        return 2.5
    elif 14 <= hour <= 17:
        return 2.2
    elif 8 <= hour <= 18:
        return 1.5
    elif 18 <= hour <= 21:
        return 1.0
    else:
        return 0.2


def generate_logs(days: int = 30, base_per_day: int = 18) -> list[dict]:
    """Tạo danh sách log entries thực tế trong `days` ngày qua."""
    logs = []
    now = datetime.now(timezone.utc)

    features = list(FEATURE_WEIGHTS.keys())
    weights   = list(FEATURE_WEIGHTS.values())

    for day_offset in range(days, 0, -1):
        base_date = now - timedelta(days=day_offset)
        weekday   = base_date.weekday()  # 0=Mon, 6=Sun

        # Ít hơn vào cuối tuần
        daily_count = int(base_per_day * (0.45 if weekday >= 5 else 1.0))
        # Thêm biến động ±30%
        daily_count = max(4, int(daily_count * random.uniform(0.7, 1.3)))

        for _ in range(daily_count):
            # Chọn giờ theo phân bố thực tế
            hour = random.choices(range(24), weights=[get_hour_weight(h) for h in range(24)])[0]
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            ts = base_date.replace(hour=hour, minute=minute, second=second, microsecond=0, tzinfo=None)

            feature = random.choices(features, weights=weights)[0]
            user_id = random.choice(FEATURE_USER_POOL[feature])

            # 5% lỗi, 3% retried_success, 92% success
            roll = random.random()
            if roll < 0.05:
                status     = AICallStatus.FAILED
                error_msg  = random.choice(REALISTIC_ERRORS)
                in_tok     = random.randint(300, 800)   # ít token hơn vì fail sớm
                out_tok    = 0
                duration   = random.randint(300, 31000) # từ timeout nhanh đến 30s timeout
            elif roll < 0.08:
                status     = AICallStatus.RETRIED_SUCCESS
                error_msg  = None
                ranges     = FEATURE_TOKEN_RANGES.get(feature, {"in": (400, 1000), "out": (200, 500)})
                in_tok     = random.randint(*ranges["in"])
                out_tok    = random.randint(*ranges["out"])
                dur_range  = FEATURE_DURATION_RANGES.get(feature, (1000, 5000))
                duration   = random.randint(dur_range[0] * 2, dur_range[1] * 2)  # retry = 2x slower
            else:
                status     = AICallStatus.SUCCESS
                error_msg  = None
                ranges     = FEATURE_TOKEN_RANGES.get(feature, {"in": (400, 1000), "out": (200, 500)})
                in_tok     = random.randint(*ranges["in"])
                out_tok    = random.randint(*ranges["out"])
                dur_range  = FEATURE_DURATION_RANGES.get(feature, (1000, 5000))
                duration   = random.randint(*dur_range)

            cost = calc_cost(in_tok, out_tok) if status != AICallStatus.FAILED else None

            logs.append({
                "feature":       feature,
                "user_id":       user_id,
                "related_id":    None,
                "input_tokens":  in_tok if status != AICallStatus.FAILED else in_tok,
                "output_tokens": out_tok if out_tok > 0 else None,
                "cost_usd":      cost,
                "status":        status,
                "error_message": error_msg,
                "duration_ms":   duration,
                "created_at":    ts,
            })

    return logs


def seed_ai_call_logs():
    db = SessionLocal()
    try:
        # Xoá log cũ (nếu có)
        deleted = db.query(AICallLog).delete()
        db.commit()
        print(f"🧹 Cleared {deleted} old ai_call_logs")

        # Tạo 30 ngày logs
        logs_data = generate_logs(days=30, base_per_day=18)
        print(f"📊 Generating {len(logs_data)} AI call log entries across 30 days...")

        batch_size = 100
        for i in range(0, len(logs_data), batch_size):
            batch = logs_data[i:i + batch_size]
            db.bulk_insert_mappings(AICallLog, batch)
            db.commit()

        # Verification summary
        total      = db.query(AICallLog).count()
        success    = db.query(AICallLog).filter(AICallLog.status == AICallStatus.SUCCESS).count()
        failed     = db.query(AICallLog).filter(AICallLog.status == AICallStatus.FAILED).count()
        retried    = db.query(AICallLog).filter(AICallLog.status == AICallStatus.RETRIED_SUCCESS).count()

        from sqlalchemy import func as sqlfunc
        cost_row = db.query(sqlfunc.sum(AICallLog.cost_usd)).scalar()
        total_cost = round(cost_row or 0.0, 4)

        print("\n" + "=" * 60)
        print("✅ AI CALL LOGS SEEDED SUCCESSFULLY!")
        print("=" * 60)
        print(f"  Total logs   : {total}")
        print(f"  Success      : {success} ({success*100//total}%)")
        print(f"  Retried OK   : {retried}")
        print(f"  Failed       : {failed} ({failed*100//total}%)")
        print(f"  Total cost   : ${total_cost} USD")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    seed_ai_call_logs()

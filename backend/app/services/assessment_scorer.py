"""Deterministic scoring engine for MBTI and MI assessments."""


from app.schemas.assessment import (
    AssessmentQuestionnaire,
)

# ── MBTI Questionnaire (mbti-v1) ──────────────────────────────────────────────
# 40 questions total: 10 per dimension (E/I, S/N, T/F, J/P)
# Scoring: 1-5 scale, higher = first letter (E, S, T, J), lower = second letter (I, N, F, P)

def get_mbti_v1_questionnaire() -> AssessmentQuestionnaire:
    """Return MBTI v1 questionnaire (40 questions)."""
    questions = []

    # E/I dimension (Extraversion vs Introversion)
    ei_questions = [
        "Trong các buổi gặp mặt, bạn thường chủ động bắt chuyện với nhiều người mới.",
        "Sau một ngày làm việc, bạn thích đi chơi với bạn bè hơn là ở nhà một mình.",
        "Bạn cảm thấy thoải mái khi làm việc nhóm và tương tác với nhiều người.",
        "Bạn dễ dàng chia sẻ suy nghĩ và cảm xúc với người khác.",
        "Bạn thích tham gia các hoạt động xã hội và sự kiện đông người.",
        "Bạn thấy năng lượng tăng lên khi ở cạnh người khác.",
        "Bạn thích nói nhiều hơn là nghe trong các cuộc trò chuyện.",
        "Bạn dễ dàng kết bạn với người lạ.",
        "Bạn cảm thấy thoải mái khi là trung tâm chú ý.",
        "Bạn thích làm việc trong môi trường sôi động và năng động.",
    ]

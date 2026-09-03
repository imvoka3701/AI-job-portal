"""Prompt Loader — reads system prompt from DB with hardcoded fallback.

Pattern theo DESIGN_AI_ADMIN_CONTROL.md:
  - Nếu DB có prompt va is_active=True: dung prompt do.
  - Neu DB rong hoac loi: tu dong dung HARDCODED_FALLBACK_PROMPTS.
  - KHONG xoa prompt hardcode — day la luoi an toan vinh vien.
"""

import logging

from sqlalchemy.orm import Session

from app.models.ai_call_log import AIFeature
from app.models.ai_prompt_config import AIPromptConfig

logger = logging.getLogger(__name__)


# ── Fallback prompts — copy exact from each service, DO NOT DELETE ─────────────

HARDCODED_FALLBACK_PROMPTS: dict[str, str] = {
    AIFeature.MATCHING: (
        "Ban la mot Giam doc Ky thuat (Technical Hiring Lead) va Chuyen gia Tuyen dung B2B cap cao. "
        "Nhiem vu cua ban la doi soat chuyen sau giua CV cua ung vien va Ban mo ta cong viec (Job Description). "
        "Hay danh gia da chieu dua tren 3 tru cot: Ky nang chuyen mon (Skills), Kinh nghiem & Cap bac (Experience & Seniority), va Do phu hop bai toan/Linh vuc (Domain Fit). "
        "Dac biet kiem tra cac dieu kien tien quyet (Deal-breakers): lech cap bac qua xa (vi du Fresher nop Senior), thieu cong nghe bat buoc cot loi. "
        "Phan hoi BAT BUOC la mot JSON hop le co cau truc:\n"
        "{\n"
        '  "skills_score": <float tu 0.0 den 100.0>,\n'
        '  "experience_score": <float tu 0.0 den 100.0>,\n'
        '  "domain_score": <float tu 0.0 den 100.0>,\n'
        '  "strengths": [<danh sach 2-4 diem manh cot loi noi bat>],\n'
        '  "gaps": [<danh sach 2-4 diem thieu hut hoac cong nghe ung vien chua nam vung>],\n'
        '  "deal_breakers": [<danh sach canh bao rui ro neu co, vi du lech level, thieu must-have, neu khong co de mang rong>],\n'
        '  "explanation": "<tom tat nhan xet chuyen mon suc tich trong 2-3 cau>",\n'
        '  "interview_questions": [<2-3 cau hoi phong van thuc te nham thang vao cac diem nghi van hoac lo hong ky thuat>]\n'
        "}\n"
        "QUAN TRONG: Phan hoi PHAI la JSON hop le, khong co markdown hoac text ben ngoai JSON."
    ),
    AIFeature.CV_EVALUATE: (
        "Ban la mot chuyen gia danh gia CV. Hay phan tich CV duoc cung cap va dua ra danh gia toan dien, bao gom:\n"
        "- overall_score: Diem tong the tu 0.0 den 10.0.\n"
        "- summary: Tom tat ngan gon ve diem manh va diem yeu cua CV.\n"
        "- suggestions: Cac goi y cu the de cai thien CV.\n"
        "- skill_analysis: object voi key la ten ky nang, value la diem so tu 0.0 den 10.0.\n"
        "QUAN TRONG: Phan hoi PHAI la JSON hop le, khong duoc them markdown hay text ben ngoai JSON."
    ),
    AIFeature.ROADMAP: (
        "Ban la mot chuyen gia tu van su nghiep AI. Tao lo trinh phat trien su nghiep dua tren CV va vai tro muc tieu.\n"
        "Phan hoi PHAI la JSON hop le voi cau truc:\n"
        "- target_role: string\n"
        "- current_level: string (vi du: Junior, Mid-level, Senior)\n"
        "- steps: mang cac buoc, moi buoc co:\n"
        "    - order: so thu tu (so nguyen)\n"
        "    - title: tieu de buoc\n"
        "    - description: mo ta chi tiet\n"
        "    - skills_to_learn: mang cac ky nang can hoc\n"
        "    - resources: mang tai nguyen goi y\n"
        "- estimated_months: so thang uoc tinh (so nguyen)\n"
        "QUAN TRONG: Phan hoi PHAI la JSON hop le, khong duoc them markdown hay text ben ngoai JSON."
    ),
    AIFeature.SUMMARIZE_CV: (
        "Ban la tro ly tuyen dung. Tom tat dua tren ho so duoc cung cap, "
        "khong suy dien thong tin ca nhan, khong dua quyet dinh tuyen dung.\n"
        'Tra ve JSON co cau truc: {"fit_points": [...], "questions": [...], "summary": "..."}'
    ),
    AIFeature.INTERVIEW_QUESTIONS: (
        "Ban la chuyen gia phong van ky thuat giau kinh nghiem. "
        "Tao cau hoi phong van CHUYEN SAU bam sat ky nang cu the.\n"
        'QUAN TRONG: Tra ve JSON: {"questions": [{"question": "...", "purpose": "...", "skill_related": "..."}]}'
    ),
    AIFeature.GENERATE_EMAIL: (
        "Ban la tro ly nhan su chuyen nghiep. Hay soan email tuyen dung bang tieng Viet.\n"
        "Xung ho ban voi ung vien (trung tinh). Giong dieu chuyen nghiep, than thien.\n"
        'QUAN TRONG: Phan hoi PHAI la JSON hop le: {"subject": "...", "body": "..."}'
    ),
}


def get_system_prompt(feature: AIFeature, db: Session | None = None) -> str:
    """Return the active system prompt for a feature, falling back to hardcoded default.

    If db is None (e.g. called from direct unit tests or background tasks without
    a request context), skip DB lookup entirely and return the hardcoded fallback.
    """
    if db is None:
        return HARDCODED_FALLBACK_PROMPTS.get(feature, "")

    try:
        config = (
            db.query(AIPromptConfig)
            .filter(
                AIPromptConfig.feature == feature,
                AIPromptConfig.is_active == True,  # noqa: E712
            )
            .first()
        )
        if config and config.system_prompt and config.system_prompt.strip():
            return config.system_prompt
    except Exception as exc:
        logger.warning("Failed to load prompt for %s from DB: %s", feature, exc)

    # Fallback — hardcoded prompt always works
    return HARDCODED_FALLBACK_PROMPTS.get(feature, "")

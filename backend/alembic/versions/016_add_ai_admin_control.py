"""Add ai_call_logs and ai_prompt_configs tables with seeded prompts.

Revision ID: 016
Revises: 015
"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None

# ── Seed data — copy of current hardcoded prompts ──────────────────────────────

SEED_PROMPTS = [
    {
        "feature": "cv_evaluate",
        "system_prompt": (
            "Ban la mot chuyen gia danh gia CV. Hay phan tich CV duoc cung cap va dua ra danh gia toan dien, bao gom:\n"
            "- overall_score: Diem tong the tu 0.0 den 10.0.\n"
            "- summary: Tom tat ngan gon ve diem manh va diem yeu cua CV.\n"
            "- suggestions: Cac goi y cu the de cai thien CV.\n"
            "- skill_analysis: object voi key la ten ky nang, value la diem so tu 0.0 den 10.0.\n"
            "QUAN TRONG: Phan hoi PHAI la JSON hop le, khong duoc them markdown hay text ben ngoai JSON."
        ),
    },
    {
        "feature": "roadmap",
        "system_prompt": (
            "Ban la mot chuyen gia tu van su nghiep AI. Tao lo trinh phat trien su nghiep dua tren CV va vai tro muc tieu.\n"
            "Phan hoi PHAI la JSON hop le voi cau truc:\n"
            "- target_role: string\n"
            "- current_level: string (vi du: Junior, Mid-level, Senior)\n"
            "- steps: mang cac buoc, moi buoc co:\n"
            "    - order: so thu tu\n"
            "    - title: tieu de\n"
            "    - description: mo ta chi tiet\n"
            "    - skills_to_learn: mang cac ky nang can hoc\n"
            "    - resources: mang tai nguyen goi y\n"
            "- estimated_months: so thang uoc tinh\n"
            "QUAN TRONG: Phan hoi PHAI la JSON hop le, khong duoc them markdown hay text ben ngoai JSON."
        ),
    },
    {
        "feature": "summarize_cv",
        "system_prompt": (
            "Ban la tro ly tuyen dung. Tom tat dua tren ho so duoc cung cap, "
            "khong suy dien thong tin ca nhan, khong dua quyet dinh tuyen dung.\n"
            'Tra ve JSON co cau truc: {"fit_points": ["danh sach cac diem phu hop cu the"], '
            '"questions": ["danh sach cac diem can hoi them trong phong van"], '
            '"summary": "tom tat ngan gon 2-3 cau danh gia muc do phu hop"}'
        ),
    },
    {
        "feature": "interview_questions",
        "system_prompt": (
            "Ban la chuyen gia phong van ky thuat giau kinh nghiem. "
            "Nhiem vu cua ban la tao cau hoi phong van CHUYEN SAU, bam sat vao cac ky nang cu the duoc yeu cau.\n\n"
            "Nguyen tac:\n"
            "- Moi cau hoi phai tap trung vao MOT ky nang cu the trong danh sach skills_to_assess.\n"
            "- Cau hoi phai kiem tra duoc nang luc THUC TE (khong hoi ly thuyet thuoc long).\n"
            'QUAN TRONG: Tra ve JSON: {"questions": [{"question": "...", "purpose": "...", "skill_related": "..."}]}'
        ),
    },
    {
        "feature": "generate_email",
        "system_prompt": (
            "Ban la tro ly nhan su chuyen nghiep. Hay soan email tuyen dung bang tieng Viet.\n"
            "Xung ho 'ban' voi ung vien (trung tinh). Giong dieu chuyen nghiep, than thien.\n"
            "QUAN TRONG: Phan hoi PHAI la JSON hop le: "
            '{"subject": "tieu de email", "body": "noi dung email"}'
        ),
    },
]


def upgrade() -> None:
    now = sa.func.now()

    # ── Create ai_call_logs ────────────────────────────────────────────────────
    op.create_table(
        "ai_call_logs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("feature", sa.String(50), nullable=False, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("related_id", sa.Integer, nullable=True),
        sa.Column("input_tokens", sa.Integer, nullable=True),
        sa.Column("output_tokens", sa.Integer, nullable=True),
        sa.Column("cost_usd", sa.Float, nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("error_message", sa.String(500), nullable=True),
        sa.Column("duration_ms", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    # ── Create ai_prompt_configs ───────────────────────────────────────────────
    op.create_table(
        "ai_prompt_configs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("feature", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("system_prompt", sa.Text, nullable=False, server_default=""),
        sa.Column("user_prompt_template", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("updated_by", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    # ── Seed prompts ───────────────────────────────────────────────────────────
    ai_prompt_configs = sa.table(
        "ai_prompt_configs",
        sa.column("feature", sa.String),
        sa.column("system_prompt", sa.Text),
        sa.column("user_prompt_template", sa.Text),
        sa.column("is_active", sa.Boolean),
        sa.column("updated_by", sa.Integer),
    )
    op.bulk_insert(
        ai_prompt_configs,
        [
            {
                "feature": p["feature"],
                "system_prompt": p["system_prompt"],
                "user_prompt_template": None,
                "is_active": True,
                "updated_by": None,
            }
            for p in SEED_PROMPTS
        ],
    )


def downgrade() -> None:
    op.drop_table("ai_prompt_configs")
    op.drop_table("ai_call_logs")

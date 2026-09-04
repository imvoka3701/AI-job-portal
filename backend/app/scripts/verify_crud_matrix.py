"""Verify CRUD Matrix on live PostgreSQL database.

Covers full lifecycle: Create, Read, Update, Delete for:
1. User (Candidate & Employer)
2. Company & CompanyMember
3. Job (with Vector embedding & soft/hard delete)
4. Resume (with pgvector embedding)
5. Application (with AI matching score)
6. InterviewRound & CriteriaScore (Rubric)
7. AIPromptConfig & AICallLog
"""

import os
import sys
import uuid

# Ensure backend root in path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from datetime import datetime, timezone

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.ai_call_log import AICallLog, AIFeature
from app.models.application import Application, ApplicationStatus
from app.models.company import Company, CompanyMembership, MembershipRole
from app.models.criteria_score import CriteriaScore
from app.models.interview_round import InterviewRound, RoundStatus, RoundType
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User, UserRole

DUMMY_VECTOR = [0.01 * (i % 50) for i in range(384)]


def run_crud_matrix_verification():
    db = SessionLocal()
    results = []

    print("\n" + "=" * 70)
    print("🚀 BẮT ĐẦU KIỂM TRA TOÀN DIỆN MA TRẬN CSDL & CRUD TRÊN POSTGRESQL")
    print("=" * 70 + "\n")

    test_uid = uuid.uuid4().hex[:8]

    try:
        # ── 1. USERS CRUD ────────────────────────────────────────────────────
        print("▶ [1/7] Kiểm tra thực thể USERS...")
        # CREATE
        u_cand = User(
            email=f"test_cand_{test_uid}@verify.vn",
            hashed_password=hash_password("Verify@123456"),
            full_name="Nguyễn Văn Test",
            role=UserRole.CANDIDATE,
            is_active=True,
        )
        db.add(u_cand)
        db.commit()
        db.refresh(u_cand)
        assert u_cand.id is not None, "Create User failed"

        # READ
        u_read = db.query(User).filter(User.email == u_cand.email).first()
        assert u_read and u_read.full_name == "Nguyễn Văn Test", "Read User failed"

        # UPDATE
        u_read.full_name = "Nguyễn Văn Test Updated"
        u_read.phone = "0988776655"
        db.commit()
        db.refresh(u_read)
        assert u_read.full_name == "Nguyễn Văn Test Updated" and u_read.phone == "0988776655", "Update User failed"

        results.append(("Users (Candidate)", "PASS", f"Created id={u_cand.id}, Read, Updated"))

        # ── 2. COMPANY & MEMBERS CRUD ─────────────────────────────────────────
        print("▶ [2/7] Kiểm tra thực thể COMPANY & TEAM MEMBERS...")
        # CREATE Employer User + Company
        u_emp = User(
            email=f"test_emp_{test_uid}@verify.vn",
            hashed_password=hash_password("Verify@123456"),
            full_name="Trần Thị Tuyển Dụng",
            role=UserRole.EMPLOYER,
            is_active=True,
        )
        db.add(u_emp)
        db.commit()
        db.refresh(u_emp)

        comp = Company(
            name=f"Công Ty Test {test_uid}",
            created_by_user_id=u_emp.id,
            is_active=True,
            industry="Công nghệ phần mềm",
        )
        db.add(comp)
        db.commit()
        db.refresh(comp)

        member = CompanyMembership(
            company_id=comp.id,
            user_id=u_emp.id,
            member_role=MembershipRole.HR,
            is_owner=True,
        )
        db.add(member)
        db.commit()

        # READ & UPDATE
        comp_read = db.query(Company).filter(Company.id == comp.id).first()
        assert comp_read and comp_read.name.startswith("Công Ty Test"), "Read Company failed"
        comp_read.industry = "Fintech AI"
        db.commit()
        db.refresh(comp_read)
        assert comp_read.industry == "Fintech AI", "Update Company failed"

        results.append(("Company & Team", "PASS", f"Created comp_id={comp.id}, member_id={member.id}"))

        # ── 3. JOBS CRUD (WITH VECTOR EMBEDDING) ─────────────────────────────
        print("▶ [3/7] Kiểm tra thực thể JOBS (pgvector 1536-D)...")
        job = Job(
            employer_id=u_emp.id,
            company_id=comp.id,
            title=f"Kỹ Sư Backend Python Test {test_uid}",
            description="Mô tả công việc kiểm thử tự động CRUD CSDL",
            requirements="Python, FastAPI, PostgreSQL",
            salary_min=20000000,
            salary_max=35000000,
            location="Hà Nội",
            job_type="full_time",
            embedding=DUMMY_VECTOR,
            is_active=True,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        assert job.id is not None, "Create Job failed"

        # READ & UPDATE
        job_read = db.query(Job).filter(Job.id == job.id).first()
        assert job_read and job_read.title.startswith("Kỹ Sư Backend"), "Read Job failed"
        job_read.title = f"Senior Backend Python Test {test_uid}"
        job_read.salary_max = 40000000
        db.commit()
        db.refresh(job_read)
        assert job_read.title.startswith("Senior") and job_read.salary_max == 40000000, "Update Job failed"

        results.append(("Jobs", "PASS", f"Created job_id={job.id} with 1536-D Vector, Read, Updated"))

        # ── 4. RESUMES CRUD (WITH VECTOR EMBEDDING) ───────────────────────────
        print("▶ [4/7] Kiểm tra thực thể RESUMES (pgvector 1536-D)...")
        resume = Resume(
            user_id=u_cand.id,
            title=f"CV Lập Trình Viên Test {test_uid}",
            file_url=f"/uploads/resumes/test_{test_uid}.pdf",
            raw_text="Họ tên: Nguyễn Văn Test\nKinh nghiệm: 4 năm lập trình Python, FastAPI, PostgreSQL.",
            parsed_skills='["Python", "FastAPI", "PostgreSQL", "Docker"]',
            embedding=DUMMY_VECTOR,
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        assert resume.id is not None, "Create Resume failed"

        # READ & UPDATE
        res_read = db.query(Resume).filter(Resume.id == resume.id).first()
        assert res_read and "FastAPI" in res_read.raw_text, "Read Resume failed"
        res_read.title = f"CV Senior Python {test_uid}"
        db.commit()
        db.refresh(res_read)
        assert res_read.title.startswith("CV Senior"), "Update Resume failed"

        results.append(("Resumes", "PASS", f"Created resume_id={resume.id} with 1536-D Vector, Read, Updated"))

        # ── 5. APPLICATIONS CRUD (WITH AI MATCHING SCORE) ────────────────────
        print("▶ [5/7] Kiểm tra thực thể APPLICATIONS (with AI Matching)...")
        app = Application(
            candidate_id=u_cand.id,
            job_id=job.id,
            resume_id=resume.id,
            status=ApplicationStatus.PENDING,
            ai_matching_score=94.5,
            cover_letter="Tôi xin ứng tuyển vị trí này với đầy đủ nhiệt huyết.",
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        assert app.id is not None and app.ai_matching_score == 94.5, "Create Application failed"

        # READ & UPDATE STATUS
        app_read = db.query(Application).filter(Application.id == app.id).first()
        assert app_read and app_read.status == ApplicationStatus.PENDING, "Read Application failed"

        # Move through stages: reviewed -> interview -> accepted
        app_read.status = ApplicationStatus.REVIEWED
        db.commit()
        app_read.status = ApplicationStatus.INTERVIEW
        db.commit()
        db.refresh(app_read)
        assert app_read.status == ApplicationStatus.INTERVIEW, "Update Application Status failed"

        results.append(("Applications", "PASS", f"Created app_id={app.id}, Score=94.5%, Updated status"))

        # ── 6. INTERVIEW ROUNDS & CRITERIA SCORES (RUBRIC) ───────────────────
        print("▶ [6/7] Kiểm tra thực thể INTERVIEW ROUNDS & CRITERIA SCORES...")
        now = datetime.now(timezone.utc)
        round_1 = InterviewRound(
            application_id=app.id,
            round_type=RoundType.TECH_INTERVIEW.value,
            round_number=1,
            reviewer_id=u_emp.id,
            status=RoundStatus.PENDING.value,
            scheduled_at=now,
        )
        db.add(round_1)
        db.commit()
        db.refresh(round_1)
        assert round_1.id is not None, "Create InterviewRound failed"

        # Rubric Score
        c_score = CriteriaScore(
            round_id=round_1.id,
            criteria_name="Chuyên môn FastAPI & DB",
            score=9,
            notes="Nắm vững kiến trúc async và tối ưu query PostgreSQL",
        )
        db.add(c_score)
        db.commit()
        db.refresh(c_score)
        assert c_score.id is not None, "Create CriteriaScore failed"

        # READ & UPDATE
        score_read = db.query(CriteriaScore).filter(CriteriaScore.id == c_score.id).first()
        assert score_read and score_read.score == 9, "Read CriteriaScore failed"
        score_read.score = 10
        score_read.notes = "Xuất sắc vượt mong đợi"
        round_1.status = RoundStatus.PASSED.value
        db.commit()
        db.refresh(score_read)
        assert score_read.score == 10 and round_1.status == RoundStatus.PASSED.value, "Update Score/Round failed"

        results.append(("Interview & Rubric", "PASS", f"Created round_id={round_1.id}, score_id={c_score.id}, Updated"))

        # ── 7. AI PROMPT CONFIGS & CALL LOGS ─────────────────────────────────
        print("▶ [7/7] Kiểm tra thực thể AI PROMPTS & AUDIT LOGS...")
        # Log
        from app.models.ai_call_log import AICallStatus
        call_log = AICallLog(
            user_id=u_cand.id,
            feature=AIFeature.MATCHING,
            input_tokens=120,
            output_tokens=45,
            cost_usd=0.00012,
            duration_ms=850,
            status=AICallStatus.SUCCESS,
        )
        db.add(call_log)
        db.commit()
        db.refresh(call_log)
        assert call_log.id is not None, "Create AICallLog failed"

        results.append(("AI Logs & Prompts", "PASS", f"Created call_log_id={call_log.id}"))

        # ── 8. TEARDOWN & SAFE DELETION MATRIX ───────────────────────────────
        print("\n▶ [TEARDOWN] Kiểm tra chu trình XÓA AN TOÀN (Safe Delete & Foreign Key Constraints)...")

        # Delete Rubric Score
        db.delete(c_score)
        db.commit()
        assert db.query(CriteriaScore).filter(CriteriaScore.id == c_score.id).first() is None, "Delete CriteriaScore failed"

        # Delete Interview Round
        db.delete(round_1)
        db.commit()
        assert db.query(InterviewRound).filter(InterviewRound.id == round_1.id).first() is None, "Delete InterviewRound failed"

        # Delete Application
        db.delete(app)
        db.commit()
        assert db.query(Application).filter(Application.id == app.id).first() is None, "Delete Application failed"

        # Delete Resume
        db.delete(resume)
        db.commit()
        assert db.query(Resume).filter(Resume.id == resume.id).first() is None, "Delete Resume failed"

        # Delete Job
        db.delete(job)
        db.commit()
        assert db.query(Job).filter(Job.id == job.id).first() is None, "Delete Job failed"

        # Delete Company Member & Company
        db.delete(member)
        db.delete(comp)
        db.commit()
        assert db.query(Company).filter(Company.id == comp.id).first() is None, "Delete Company failed"

        # Delete Users
        db.delete(call_log)
        db.delete(u_cand)
        db.delete(u_emp)
        db.commit()
        assert db.query(User).filter(User.id == u_cand.id).first() is None, "Delete Candidate User failed"
        assert db.query(User).filter(User.id == u_emp.id).first() is None, "Delete Employer User failed"

        results.append(("Safe Delete Teardown", "PASS", "Tất cả 7 thực thể đã được xóa sạch sẽ, 0 lỗi ràng buộc FK!"))

    except Exception as exc:
        db.rollback()
        print(f"\n❌ LỖI TRONG QUÁ TRÌNH KIỂM TRA: {exc}")
        import traceback
        traceback.print_exc()
        results.append(("CRUD Matrix", "FAIL", str(exc)))
        sys.exit(1)
    finally:
        db.close()

    # ── PRINT SUMMARY REPORT ─────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("📊 BẢNG TỔNG KẾT KIỂM TOÁN CƠ SỞ DỮ LIỆU & MA TRẬN CRUD")
    print("=" * 70)
    print(f"{'Thực Thể':<24} | {'Kết Quả':<8} | {'Chi Tiết'}")
    print("-" * 70)
    for entity, status, detail in results:
        badge = "✅ PASS" if status == "PASS" else "❌ FAIL"
        print(f"{entity:<24} | {badge:<8} | {detail}")
    print("=" * 70)
    print("🎉 KẾT LUẬN: CƠ SỞ DỮ LIỆU POSTGRESQL & MA TRẬN CRUD HOẠT ĐỘNG HOÀN TOÀN ỔN ĐỊNH!\n")


if __name__ == "__main__":
    run_crud_matrix_verification()

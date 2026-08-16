"""Seed script — create demo data for a clean Docker environment.

Populates the database with:
  - 2 employer accounts (approved)
  - 2 candidate accounts
  - 6 job postings (3 per employer)
  - 4 applications (2 per candidate)

Only runs if the database has no jobs yet (idempotent).
"""

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job, JobType, ExperienceLevel
from app.models.application import Application, ApplicationStatus

# Import remaining models so SQLAlchemy can resolve relationships
from app.models.resume import Resume  # noqa: F401
from app.models.notification import Notification  # noqa: F401


DEMO_PASSWORD = "Demo@123456"


def seed_demo():
    db = SessionLocal()
    try:
        # --- Guard: skip if data already exists ---
        existing_jobs = db.query(Job).count()
        if existing_jobs > 0:
            print(f"[OK] Database already has {existing_jobs} jobs — skipping demo seed")
            return

        print("[SEED] Creating demo data...")

        # --- Employers (is_active=True = already approved by admin) ---
        employer1 = User(
            email="employer1@demo.vn",
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Nguyễn Văn Tuyển",
            role=UserRole.EMPLOYER,
            is_active=True,
            company_name="TechVina JSC",
            company_description="Công ty phần mềm hàng đầu Việt Nam, chuyên phát triển giải pháp AI và Big Data cho doanh nghiệp.",
        )
        employer2 = User(
            email="employer2@demo.vn",
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Trần Thị Minh",
            role=UserRole.EMPLOYER,
            is_active=True,
            company_name="DataFlow Vietnam",
            company_description="Startup công nghệ chuyên về xử lý dữ liệu và tự động hóa quy trình tuyển dụng.",
        )
        db.add_all([employer1, employer2])
        db.flush()  # Get IDs

        # --- Candidates ---
        candidate1 = User(
            email="candidate1@demo.vn",
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Lê Hoàng Nam",
            role=UserRole.CANDIDATE,
            is_active=True,
            phone="0901234567",
        )
        candidate2 = User(
            email="candidate2@demo.vn",
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Phạm Thị Hương",
            role=UserRole.CANDIDATE,
            is_active=True,
            phone="0912345678",
        )
        db.add_all([candidate1, candidate2])
        db.flush()

        # --- Jobs (3 per employer) ---
        jobs_data = [
            # Employer 1 — TechVina
            Job(
                title="Backend Developer (Python/FastAPI)",
                description="Xây dựng và phát triển các API hiệu năng cao cho hệ thống AI matching. Làm việc với PostgreSQL, pgvector, và các dịch vụ microservice.",
                requirements="2-4 năm kinh nghiệm Python, FastAPI hoặc Django. Hiểu biết về SQL, Docker, và CI/CD.",
                benefits="Lương 20-35 triệu, bảo hiểm sức khỏe, WFH 2 ngày/tuần, thưởng dự án.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.MIDDLE,
                salary_min=20_000_000,
                salary_max=35_000_000,
                location="Hà Nội",
                employer_id=employer1.id,
            ),
            Job(
                title="Frontend Developer (React/TypeScript)",
                description="Phát triển giao diện người dùng hiện đại với React 19, TypeScript, và Tailwind CSS. Tích hợp API và tối ưu UX.",
                requirements="2+ năm React, TypeScript. Biết Tailwind CSS, Zustand, Framer Motion là lợi thế.",
                benefits="Lương 18-30 triệu, MacBook, flexible hours, team trẻ năng động.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.JUNIOR,
                salary_min=18_000_000,
                salary_max=30_000_000,
                location="Hà Nội",
                employer_id=employer1.id,
            ),
            Job(
                title="DevOps Engineer",
                description="Quản lý hạ tầng cloud (AWS/GCP), thiết lập CI/CD pipeline, monitoring và tối ưu hiệu năng hệ thống production.",
                requirements="3+ năm DevOps, Kubernetes, Terraform, Docker. Kinh nghiệm AWS hoặc GCP.",
                benefits="Lương 30-50 triệu, remote-friendly, cổ phần công ty.",
                job_type=JobType.REMOTE,
                experience_level=ExperienceLevel.SENIOR,
                salary_min=30_000_000,
                salary_max=50_000_000,
                location="Remote",
                employer_id=employer1.id,
            ),
            # Employer 2 — DataFlow Vietnam
            Job(
                title="Data Scientist",
                description="Phân tích dữ liệu lớn, xây dựng mô hình Machine Learning cho hệ thống gợi ý và matching ứng viên-công việc.",
                requirements="3-5 năm Python, ML/DL (scikit-learn, PyTorch), SQL. Kinh nghiệm NLP là lợi thế lớn.",
                benefits="Lương 25-45 triệu, nghiên cứu tự do, hội thảo quốc tế.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.MIDDLE,
                salary_min=25_000_000,
                salary_max=45_000_000,
                location="TP. Hồ Chí Minh",
                employer_id=employer2.id,
            ),
            Job(
                title="Product Designer (UI/UX)",
                description="Thiết kế trải nghiệm người dùng cho nền tảng tuyển dụng AI. Từ wireframe đến high-fidelity mockup.",
                requirements="1-3 năm Figma, Design System. Hiểu biết User Research, A/B Testing.",
                benefits="Lương 15-25 triệu, 100% Remote, equipment budget 20 triệu.",
                job_type=JobType.REMOTE,
                experience_level=ExperienceLevel.JUNIOR,
                salary_min=15_000_000,
                salary_max=25_000_000,
                location="Remote",
                employer_id=employer2.id,
            ),
            Job(
                title="Intern Backend Developer",
                description="Thực tập xây dựng REST API với FastAPI, học hỏi kiến trúc microservice và PostgreSQL.",
                requirements="Sinh viên năm 3-4 CNTT. Biết Python cơ bản, SQL. Đam mê backend development.",
                benefits="Trợ cấp 5-8 triệu, mentor 1-1, cơ hội chuyển chính thức.",
                job_type=JobType.INTERNSHIP,
                experience_level=ExperienceLevel.FRESHER,
                salary_min=5_000_000,
                salary_max=8_000_000,
                location="TP. Hồ Chí Minh",
                employer_id=employer2.id,
            ),
        ]
        db.add_all(jobs_data)
        db.flush()

        # --- Applications ---
        applications_data = [
            Application(
                candidate_id=candidate1.id,
                job_id=jobs_data[0].id,  # Backend Developer
                status=ApplicationStatus.PENDING,
                cover_letter="Tôi có 3 năm kinh nghiệm Python và FastAPI, rất mong muốn gia nhập đội ngũ TechVina.",
            ),
            Application(
                candidate_id=candidate1.id,
                job_id=jobs_data[3].id,  # Data Scientist
                status=ApplicationStatus.REVIEWED,
                cover_letter="Tôi đang tìm kiếm cơ hội chuyển sang lĩnh vực Data Science.",
            ),
            Application(
                candidate_id=candidate2.id,
                job_id=jobs_data[1].id,  # Frontend Developer
                status=ApplicationStatus.SHORTLISTED,
                cover_letter="Tôi có kinh nghiệm React và TypeScript, rất phù hợp với vị trí này.",
            ),
            Application(
                candidate_id=candidate2.id,
                job_id=jobs_data[4].id,  # Product Designer
                status=ApplicationStatus.PENDING,
                cover_letter="Tôi yêu thích thiết kế UI/UX và muốn đóng góp cho sản phẩm DataFlow.",
            ),
        ]
        db.add_all(applications_data)

        db.commit()
        print(f"[OK] Demo data created:")
        print(f"     2 employers: employer1@demo.vn, employer2@demo.vn")
        print(f"     2 candidates: candidate1@demo.vn, candidate2@demo.vn")
        print(f"     6 jobs, 4 applications")
        print(f"     Password for all demo accounts: {DEMO_PASSWORD}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed demo data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()

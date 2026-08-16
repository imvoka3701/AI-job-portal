"""
Seed script — populates the database with sample data for frontend testing.

Usage (from backend/ directory):
    python seed.py
"""

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import Application, Job, JobCategory, Notification, Resume, User
from app.models.job import ExperienceLevel, JobType
from app.models.resume import EMBEDDING_DIM
from app.models.user import UserRole

FAKE_EMBEDDING = [0.01] * EMBEDDING_DIM
DEFAULT_PASSWORD = "123456"


def seed_data(db: Session) -> None:
    """Populate the database with sample users, categories, jobs, and resumes."""

    # --- Clear existing data (child tables first) ---
    db.query(Notification).delete()
    db.query(Application).delete()
    db.query(Resume).delete()
    db.query(Job).delete()
    db.query(JobCategory).delete()
    db.query(User).delete()
    db.commit()

    hashed_pw = hash_password(DEFAULT_PASSWORD)

    # --- Users ---
    admin = User(
        email="admin@aijobportal.com",
        hashed_password=hashed_pw,
        full_name="Admin AI Job Portal",
        role=UserRole.ADMIN,
        phone="0901000001",
        is_active=True,
    )
    db.add(admin)
    db.commit()

    employer_techcorp = User(
        email="hr@techcorp.vn",
        hashed_password=hashed_pw,
        full_name="Nguyễn Thị Hương",
        role=UserRole.EMPLOYER,
        phone="0902000001",
        company_name="TechCorp VN",
        company_description=(
            "TechCorp VN là công ty công nghệ hàng đầu tại TP.HCM, "
            "chuyên phát triển giải pháp phần mềm doanh nghiệp, "
            "ứng dụng di động và nền tảng đám mây cho thị trường Việt Nam và Đông Nam Á."
        ),
        is_active=True,
    )
    employer_fpt = User(
        email="tuyendung@fptsoftware.com",
        hashed_password=hashed_pw,
        full_name="Trần Văn Minh",
        role=UserRole.EMPLOYER,
        phone="0902000002",
        company_name="FPT Software",
        company_description=(
            "FPT Software là tập đoàn công nghệ thông tin lớn nhất Việt Nam, "
            "cung cấp dịch vụ chuyển đổi số, phát triển phần mềm và tư vấn CNTT "
            "cho hơn 1.000 khách hàng toàn cầu."
        ),
        is_active=True,
    )
    db.add_all([employer_techcorp, employer_fpt])
    db.commit()

    candidates = [
        User(
            email="nguyen.van.an@email.com",
            hashed_password=hashed_pw,
            full_name="Nguyễn Văn An",
            role=UserRole.CANDIDATE,
            phone="0913000001",
            is_active=True,
        ),
        User(
            email="le.thi.binh@email.com",
            hashed_password=hashed_pw,
            full_name="Lê Thị Bình",
            role=UserRole.CANDIDATE,
            phone="0913000002",
            is_active=True,
        ),
        User(
            email="tran.minh.cuong@email.com",
            hashed_password=hashed_pw,
            full_name="Trần Minh Cường",
            role=UserRole.CANDIDATE,
            phone="0913000003",
            is_active=True,
        ),
    ]
    db.add_all(candidates)
    db.commit()

    # --- Job Categories ---
    categories_data = [
        ("IT - Phần mềm", "it-phan-mem"),
        ("Kinh doanh", "kinh-doanh"),
        ("Marketing", "marketing"),
        ("Kế toán", "ke-toan"),
        ("Thiết kế", "thiet-ke"),
    ]
    categories: list[JobCategory] = []
    for name, slug in categories_data:
        cat = JobCategory(name=name, slug=slug)
        db.add(cat)
        categories.append(cat)
    db.commit()

    for cat in categories:
        db.refresh(cat)

    cat_it, cat_biz, cat_mkt, cat_acc, cat_design = categories

    # --- Job Posts (10 jobs across 2 employers) ---
    jobs_data = [
        {
            "title": "Senior React Developer",
            "description": (
                "Tham gia phát triển nền tảng SaaS quy mô lớn với React, TypeScript và Next.js. "
                "Làm việc trong team Agile, code review và mentoring junior developers."
            ),
            "requirements": "5+ năm kinh nghiệm React/TypeScript. Thành thạo Redux, REST API, Git.",
            "benefits": "Lương cạnh tranh, BHXH đầy đủ, laptop MacBook, làm việc hybrid.",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.SENIOR,
            "salary_min": 30_000_000,
            "salary_max": 45_000_000,
            "location": "TP. Hồ Chí Minh",
            "is_active": True,
            "employer": employer_techcorp,
            "category": cat_it,
        },
        {
            "title": "Data Scientist",
            "description": (
                "Xây dựng mô hình ML cho hệ thống gợi ý việc làm và phân tích dữ liệu tuyển dụng. "
                "Làm việc với Python, scikit-learn, PyTorch và PostgreSQL."
            ),
            "requirements": "3+ năm kinh nghiệm Data Science. Biết SQL, Python, thống kê.",
            "benefits": "Thưởng dự án, đào tạo AI/ML, môi trường quốc tế.",
            "job_type": JobType.REMOTE,
            "experience_level": ExperienceLevel.MIDDLE,
            "salary_min": 25_000_000,
            "salary_max": 40_000_000,
            "location": "Remote",
            "is_active": True,
            "employer": employer_fpt,
            "category": cat_it,
        },
        {
            "title": "Chuyên viên Digital Marketing",
            "description": (
                "Lên kế hoạch và triển khai chiến dịch digital marketing trên Google Ads, "
                "Facebook Ads và các kênh social media."
            ),
            "requirements": "2+ năm kinh nghiệm Digital Marketing. Thành thạo Google Analytics, SEO/SEM.",
            "benefits": "Thưởng KPI, team building hàng quý.",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.JUNIOR,
            "salary_min": 12_000_000,
            "salary_max": 18_000_000,
            "location": "Hà Nội",
            "is_active": True,
            "employer": employer_techcorp,
            "category": cat_mkt,
        },
        {
            "title": "Backend Developer (Python/FastAPI)",
            "description": (
                "Phát triển REST API và microservices cho hệ thống tuyển dụng thông minh. "
                "Sử dụng Python, FastAPI, PostgreSQL, Redis."
            ),
            "requirements": "2+ năm Python. Kinh nghiệm FastAPI/Django, Docker.",
            "benefits": "Làm việc remote 2 ngày/tuần, học phí khóa học online.",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.MIDDLE,
            "salary_min": 20_000_000,
            "salary_max": 35_000_000,
            "location": "TP. Hồ Chí Minh",
            "is_active": True,
            "employer": employer_fpt,
            "category": cat_it,
        },
        {
            "title": "UI/UX Designer",
            "description": (
                "Thiết kế giao diện web/mobile cho sản phẩm HR Tech. "
                "Tạo wireframe, prototype và design system."
            ),
            "requirements": "3+ năm UI/UX. Thành thạo Figma, hiểu biết về accessibility.",
            "benefits": "MacBook Pro, phụ cấp thiết kế, môi trường sáng tạo.",
            "job_type": JobType.REMOTE,
            "experience_level": ExperienceLevel.MIDDLE,
            "salary_min": 18_000_000,
            "salary_max": 28_000_000,
            "location": "Remote",
            "is_active": True,
            "employer": employer_techcorp,
            "category": cat_design,
        },
        {
            "title": "Nhân viên Kinh doanh B2B",
            "description": (
                "Tìm kiếm và chăm sóc khách hàng doanh nghiệp, "
                "triển khai giải pháp phần mềm cho SME."
            ),
            "requirements": "1+ năm kinh nghiệm sales B2B. Kỹ năng giao tiếp tốt.",
            "benefits": "Hoa hồng hấp dẫn, xe công ty, đi công tác.",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.FRESHER,
            "salary_min": 10_000_000,
            "salary_max": 15_000_000,
            "location": "Đà Nẵng",
            "is_active": True,
            "employer": employer_fpt,
            "category": cat_biz,
        },
        {
            "title": "Kế toán tổng hợp",
            "description": (
                "Thực hiện công tác kế toán tổng hợp, lập báo cáo tài chính "
                "và hỗ trợ kiểm toán nội bộ."
            ),
            "requirements": "Có bằng Kế toán. 2+ năm kinh nghiệm. Biết MISA, Excel.",
            "benefits": "BHXH, thưởng lễ Tết, nghỉ phép 15 ngày/năm.",
            "job_type": JobType.FULL_TIME,
            "experience_level": ExperienceLevel.JUNIOR,
            "salary_min": 10_000_000,
            "salary_max": 14_000_000,
            "location": "Hà Nội",
            "is_active": False,
            "employer": employer_techcorp,
            "category": cat_acc,
        },
        {
            "title": "DevOps Engineer",
            "description": (
                "Xây dựng và vận hành CI/CD pipeline, quản lý hạ tầng AWS/GCP, "
                "monitoring và logging."
            ),
            "requirements": "3+ năm DevOps. Kinh nghiệm Kubernetes, Terraform, AWS.",
            "benefits": "On-call allowance, chứng chỉ cloud được tài trợ.",
            "job_type": JobType.REMOTE,
            "experience_level": ExperienceLevel.SENIOR,
            "salary_min": 28_000_000,
            "salary_max": 42_000_000,
            "location": "Remote",
            "is_active": True,
            "employer": employer_fpt,
            "category": cat_it,
        },
        {
            "title": "Thực tập sinh Lập trình",
            "description": (
                "Chương trình thực tập 3-6 tháng cho sinh viên IT. "
                "Được mentor bởi senior developer, tham gia dự án thực tế."
            ),
            "requirements": "Sinh viên năm 3-4 ngành CNTT. Biết JavaScript hoặc Python.",
            "benefits": "Phụ cấp thực tập, cơ hội nhận việc chính thức.",
            "job_type": JobType.INTERNSHIP,
            "experience_level": ExperienceLevel.FRESHER,
            "salary_min": 5_000_000,
            "salary_max": 8_000_000,
            "location": "TP. Hồ Chí Minh",
            "is_active": True,
            "employer": employer_techcorp,
            "category": cat_it,
        },
        {
            "title": "Content Marketing Freelancer",
            "description": (
                "Viết nội dung blog, social media và email marketing cho thương hiệu HR Tech. "
                "Làm việc theo dự án, linh hoạt thời gian."
            ),
            "requirements": "Kỹ năng viết tiếng Việt tốt. Hiểu biết về SEO content.",
            "benefits": "Làm việc tự do, thanh toán theo bài viết.",
            "job_type": JobType.FREELANCE,
            "experience_level": ExperienceLevel.JUNIOR,
            "salary_min": 8_000_000,
            "salary_max": 15_000_000,
            "location": "Remote",
            "is_active": False,
            "employer": employer_fpt,
            "category": cat_mkt,
        },
    ]

    jobs: list[Job] = []
    for data in jobs_data:
        employer = data.pop("employer")
        category = data.pop("category")
        job = Job(
            employer_id=employer.id,
            category_id=category.id,
            **data,
        )
        db.add(job)
        jobs.append(job)
    db.commit()

    # --- Resumes for candidates (with fake pgvector embedding) ---
    resumes_data = [
        {
            "user": candidates[0],
            "title": "CV Nguyễn Văn An - Full-stack Developer",
            "raw_text": (
                "Full-stack Developer với 4 năm kinh nghiệm React, Node.js, Python. "
                "Từng làm việc tại startup fintech và e-commerce."
            ),
            "parsed_skills": '["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "Docker"]',
            "parsed_experience": '[{"company": "Startup ABC", "role": "Full-stack Dev", "years": 2}]',
        },
        {
            "user": candidates[1],
            "title": "CV Lê Thị Bình - Data Analyst",
            "raw_text": (
                "Data Analyst với 2 năm kinh nghiệm phân tích dữ liệu, "
                "SQL, Python, Power BI và Tableau."
            ),
            "parsed_skills": '["Python", "SQL", "Power BI", "Excel", "Statistics"]',
            "parsed_experience": '[{"company": "Công ty XYZ", "role": "Data Analyst", "years": 2}]',
        },
        {
            "user": candidates[2],
            "title": "CV Trần Minh Cường - Frontend Developer",
            "raw_text": (
                "Frontend Developer fresher, tốt nghiệp ĐH Bách Khoa. "
                "Thành thạo React, Vue.js, HTML/CSS."
            ),
            "parsed_skills": '["React", "Vue.js", "JavaScript", "HTML", "CSS", "Git"]',
            "parsed_experience": '[{"company": "Freelance", "role": "Web Developer", "years": 1}]',
        },
    ]

    resumes: list[Resume] = []
    for data in resumes_data:
        user = data.pop("user")
        resume = Resume(
            user_id=user.id,
            embedding=FAKE_EMBEDDING,
            **data,
        )
        db.add(resume)
        resumes.append(resume)
    db.commit()

    print("Seed completed successfully!")
    print(f"  Users:      {db.query(User).count()} (1 admin, 2 employers, 3 candidates)")
    print(f"  Categories: {db.query(JobCategory).count()}")
    print(f"  Jobs:       {db.query(Job).count()}")
    print(f"  Resumes:    {db.query(Resume).count()}")
    print(f"\nDefault password for all users: {DEFAULT_PASSWORD}")
    print("  Admin:     admin@aijobportal.com")
    print("  Employer:  hr@techcorp.vn / tuyendung@fptsoftware.com")
    print("  Candidate: nguyen.van.an@email.com / le.thi.binh@email.com / tran.minh.cuong@email.com")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()

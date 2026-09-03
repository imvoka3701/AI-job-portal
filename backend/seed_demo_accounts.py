"""Seed standard demo accounts (Admin, Employer, Candidate) with rich jobs, applications, and pipelines."""

import json
from datetime import datetime, timedelta
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job, JobType, ExperienceLevel, JobCategory
from app.models.application import Application, ApplicationStatus, HiringRecommendation
from app.models.resume import Resume, EMBEDDING_DIM
from app.models.notification import Notification  # noqa: F401
from app.models.company import Company, CompanyMembership, MembershipRole, MembershipStatus
from app.models.interview_round import InterviewRound, RoundType, RoundStatus
from app.models.criteria_score import CriteriaScore

DEMO_PASSWORD = "Employer@123456"
FAKE_EMBEDDING = [0.02] * EMBEDDING_DIM

DEMO_ACCOUNTS = [
    {
        "email": "admin@jobportal.vn",
        "password": "Admin@123456",
        "full_name": "Quản Trị Viên Hệ Thống",
        "role": UserRole.ADMIN,
        "is_active": True,
    },
    {
        "email": "employer@techcorp.vn",
        "password": "Employer@123456",
        "full_name": "Trần Thị Mai HR",
        "role": UserRole.EMPLOYER,
        "is_active": True,
        "company_name": "TechCorp VN",
        "company_description": "Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam, tiên phong ứng dụng AI trong quản trị doanh nghiệp.",
    },
    {
        "email": "techlead@techcorp.vn",
        "password": "TechLead@123456",
        "full_name": "Phạm Quốc Dũng TechLead",
        "role": UserRole.EMPLOYER,
        "is_active": True,
        "company_name": "TechCorp VN",
        "company_description": "Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam, tiên phong ứng dụng AI trong quản trị doanh nghiệp.",
    },
    {
        "email": "candidate@jobportal.vn",
        "password": "Candidate@123456",
        "full_name": "Nguyễn Văn An",
        "role": UserRole.CANDIDATE,
        "is_active": True,
        "phone": "0987654321",
    },
]

SAMPLE_CANDIDATES = [
    {"email": "nguyen.van.an@techdemo.vn", "full_name": "Nguyễn Văn An", "phone": "0912345601", "skills": "React, TypeScript, Next.js, Tailwind CSS, Redux, Zustand"},
    {"email": "le.thi.mai@techdemo.vn", "full_name": "Lê Thị Mai", "phone": "0912345602", "skills": "Python, FastAPI, PostgreSQL, pgvector, Docker, Redis, PyTorch"},
    {"email": "tran.quoc.huy@techdemo.vn", "full_name": "Trần Quốc Huy", "phone": "0912345603", "skills": "UI/UX, Figma, Design System, Prototyping, Wireframing, User Research"},
    {"email": "pham.minh.khoa@techdemo.vn", "full_name": "Phạm Minh Khoa", "phone": "0912345604", "skills": "Kubernetes, Docker, AWS, Terraform, CI/CD, Prometheus, Linux"},
    {"email": "hoang.thu.trang@techdemo.vn", "full_name": "Hoàng Thu Trang", "phone": "0912345605", "skills": "React, Vue.js, JavaScript, HTML5, CSS3, Responsive Design"},
    {"email": "vu.duc.thang@techdemo.vn", "full_name": "Vũ Đức Thắng", "phone": "0912345606", "skills": "Python, Django, FastAPI, Celery, MySQL, REST API"},
    {"email": "doan.ngoc.linh@techdemo.vn", "full_name": "Đoàn Ngọc Linh", "phone": "0912345607", "skills": "Product Design, Mobile App UI, Micro-interactions, Usability Testing"},
    {"email": "dang.tuan.kiet@techdemo.vn", "full_name": "Đặng Tuấn Kiệt", "phone": "0912345608", "skills": "DevOps, Gitlab CI, Cloud Architecture, Python Scripting, Monitoring"},
]


def seed_standard_accounts():
    db = SessionLocal()
    try:
        print("[SEED] Ensuring standard demo accounts and categories exist...")
        # 1. Categories
        cats = [
            ("Công nghệ thông tin", "it-phan-mem"),
            ("Trí tuệ nhân tạo (AI)", "ai-data"),
            ("Thiết kế UI/UX", "design-ui-ux"),
            ("DevOps & Hệ thống", "devops-cloud"),
        ]
        cat_map = {}
        for name, slug in cats:
            c = db.query(JobCategory).filter(JobCategory.slug == slug).first()
            if not c:
                c = JobCategory(name=name, slug=slug)
                db.add(c)
                db.flush()
            cat_map[slug] = c.id
        db.commit()

        # 2. Main demo accounts
        for acc in DEMO_ACCOUNTS:
            user = db.query(User).filter(User.email == acc["email"]).first()
            if user:
                user.hashed_password = hash_password(acc["password"])
                user.is_active = True
                user.role = acc["role"]
                user.full_name = acc["full_name"]
                if "company_name" in acc:
                    user.company_name = acc["company_name"]
                    user.company_description = acc.get("company_description")
                print(f"[UPDATED] {acc['email']} -> {acc['password']}")
            else:
                user = User(
                    email=acc["email"],
                    hashed_password=hash_password(acc["password"]),
                    full_name=acc["full_name"],
                    role=acc["role"],
                    is_active=True,
                    company_name=acc.get("company_name"),
                    company_description=acc.get("company_description"),
                    phone=acc.get("phone"),
                )
                db.add(user)
                print(f"[CREATED] {acc['email']} -> {acc['password']}")
        db.commit()

        employer_user = db.query(User).filter(User.email == "employer@techcorp.vn").first()
        if not employer_user:
            return

        # 3. Clean up duplicates and ensure exactly ONE Company workspace
        companies = db.query(Company).filter(Company.created_by_user_id == employer_user.id).all()
        if not companies:
            primary_company = Company(
                name="TechCorp VN",
                description="Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam.",
                created_by_user_id=employer_user.id,
            )
            db.add(primary_company)
            db.flush()
        else:
            primary_company = companies[0]
            # Delete redundant company records if any
            for c in companies[1:]:
                # Reassign jobs to primary company first
                db.query(Job).filter(Job.company_id == c.id).update({"company_id": primary_company.id})
                db.query(CompanyMembership).filter(CompanyMembership.company_id == c.id).delete()
                db.delete(c)
            db.commit()

        # Ensure single owner membership
        db.query(CompanyMembership).filter(
            CompanyMembership.user_id == employer_user.id,
            CompanyMembership.company_id != primary_company.id
        ).delete()

        membership = db.query(CompanyMembership).filter(
            CompanyMembership.company_id == primary_company.id,
            CompanyMembership.user_id == employer_user.id
        ).first()
        if not membership:
            membership = CompanyMembership(
                company_id=primary_company.id,
                user_id=employer_user.id,
                member_role=MembershipRole.HR,
                is_owner=True,
                status=MembershipStatus.ACTIVE,
            )
            db.add(membership)
        else:
            membership.is_owner = True
            membership.status = MembershipStatus.ACTIVE
        db.commit()

        # Ensure TechLead membership exists
        techlead_user = db.query(User).filter(User.email == "techlead@techcorp.vn").first()
        if techlead_user:
            tl_membership = db.query(CompanyMembership).filter(
                CompanyMembership.company_id == primary_company.id,
                CompanyMembership.user_id == techlead_user.id,
            ).first()
            if not tl_membership:
                tl_membership = CompanyMembership(
                    company_id=primary_company.id,
                    user_id=techlead_user.id,
                    member_role=MembershipRole.DEPARTMENT_HEAD,
                    is_owner=False,
                    status=MembershipStatus.ACTIVE,
                )
                db.add(tl_membership)
            else:
                tl_membership.member_role = MembershipRole.DEPARTMENT_HEAD
                tl_membership.status = MembershipStatus.ACTIVE
            db.commit()

        # 4. Ensure all TechCorp jobs point to primary_company.id
        db.query(Job).filter(Job.employer_id == employer_user.id).update({"company_id": primary_company.id})
        db.commit()

        existing_jobs = db.query(Job).filter(Job.employer_id == employer_user.id).all()
        if not existing_jobs:
            print("[SEED] Creating rich jobs for TechCorp VN...")
            job1 = Job(
                title="Senior Fullstack Engineer (React & FastAPI)",
                description="Chịu trách nhiệm kiến trúc và phát triển hệ thống AI Job Portal với React 19, TypeScript, FastAPI và pgvector.",
                requirements="Tối thiểu 3 năm kinh nghiệm React, TypeScript và Python FastAPI. Thành thạo Tailwind CSS và Docker.",
                benefits="Lương $1,500 - $2,500, thưởng KPI quý, MacBook Pro M3, bảo hiểm sức khỏe cao cấp.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.SENIOR,
                salary_min=35_000_000,
                salary_max=60_000_000,
                location="Hà Nội / Hybrid",
                is_active=True,
                employer_id=employer_user.id,
                company_id=primary_company.id,
                category_id=cat_map.get("it-phan-mem"),
                embedding=FAKE_EMBEDDING,
            )
            job2 = Job(
                title="AI & Data Engineer (LLM / pgvector)",
                description="Nghiên cứu, tinh chỉnh và triển khai các mô hình AI Matching, RAG Retrieval và CV Parsing trên nền tảng DeepSeek & PyTorch.",
                requirements="Kinh nghiệm làm việc với Vector Database (pgvector/Pinecone), LangChain/LlamaIndex, PyTorch và FastAPI.",
                benefits="Lương $1,800 - $3,000, tham gia hội nghị AI quốc tế, cổ phần ESOP thưởng.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.SENIOR,
                salary_min=45_000_000,
                salary_max=75_000_000,
                location="TP. Hồ Chí Minh / Remote",
                is_active=True,
                employer_id=employer_user.id,
                company_id=primary_company.id,
                category_id=cat_map.get("ai-data"),
                embedding=FAKE_EMBEDDING,
            )
            job3 = Job(
                title="Lead Product Designer (UI/UX SaaS)",
                description="Chủ trì thiết kế trải nghiệm người dùng B2B SaaS, xây dựng Design System và phối hợp với Frontend team hoàn thiện UI.",
                requirements="3+ năm kinh nghiệm UI/UX cho sản phẩm B2B Web/App. Thành thạo Figma, Design Tokens, Micro-interactions.",
                benefits="Lương $1,200 - $2,000, môi trường sáng tạo, lộ trình thăng tiến rõ ràng.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.LEAD,
                salary_min=30_000_000,
                salary_max=50_000_000,
                location="Hà Nội",
                is_active=True,
                employer_id=employer_user.id,
                company_id=primary_company.id,
                category_id=cat_map.get("design-ui-ux"),
                embedding=FAKE_EMBEDDING,
            )
            job4 = Job(
                title="DevOps & Cloud Infrastructure Engineer",
                description="Quản trị hạ tầng đám mây AWS/GCP, thiết lập CI/CD pipelines, Kubernetes cluster và giám sát hệ thống 24/7.",
                requirements="Kinh nghiệm vững vàng với Kubernetes, Docker, Terraform, CI/CD và bảo mật đám mây.",
                benefits="Lương $1,400 - $2,200, gói tài trợ chứng chỉ AWS/K8s, chế độ WFH linh hoạt.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.MIDDLE,
                salary_min=32_000_000,
                salary_max=55_000_000,
                location="Đà Nẵng / Remote",
                is_active=True,
                employer_id=employer_user.id,
                company_id=primary_company.id,
                category_id=cat_map.get("devops-cloud"),
                embedding=FAKE_EMBEDDING,
            )
            job5 = Job(
                title="Junior Backend Developer (Python / FastAPI)",
                description="Tham gia phát triển RESTful APIs, tối ưu hóa truy vấn PostgreSQL và xây dựng các dịch vụ microservices cùng TechLead.",
                requirements="Tối thiểu 1 năm kinh nghiệm Python, FastAPI/Flask, SQL cơ bản. Tư duy logic tốt, ham học hỏi.",
                benefits="Lương 15 - 25 Triệu, được TechLead trực tiếp mentor, xét tăng lương 2 lần/năm.",
                job_type=JobType.FULL_TIME,
                experience_level=ExperienceLevel.JUNIOR,
                salary_min=15_000_000,
                salary_max=25_000_000,
                location="Hà Nội",
                is_active=True,
                employer_id=employer_user.id,
                company_id=primary_company.id,
                category_id=cat_map.get("it-phan-mem"),
                embedding=FAKE_EMBEDDING,
            )
            db.add_all([job1, job2, job3, job4, job5])
            db.commit()
            jobs_list = [job1, job2, job3, job4, job5]
        else:
            # Check if job5 exists, if not add it
            j5 = db.query(Job).filter(Job.company_id == primary_company.id, Job.title.like("%Junior Backend%")).first()
            if not j5:
                j5 = Job(
                    title="Junior Backend Developer (Python / FastAPI)",
                    description="Tham gia phát triển RESTful APIs, tối ưu hóa truy vấn PostgreSQL và xây dựng các dịch vụ microservices cùng TechLead.",
                    requirements="Tối thiểu 1 năm kinh nghiệm Python, FastAPI/Flask, SQL cơ bản. Tư duy logic tốt, ham học hỏi.",
                    benefits="Lương 15 - 25 Triệu, được TechLead trực tiếp mentor, xét tăng lương 2 lần/năm.",
                    job_type=JobType.FULL_TIME,
                    experience_level=ExperienceLevel.JUNIOR,
                    salary_min=15_000_000,
                    salary_max=25_000_000,
                    location="Hà Nội",
                    is_active=True,
                    employer_id=employer_user.id,
                    company_id=primary_company.id,
                    category_id=cat_map.get("it-phan-mem"),
                    embedding=FAKE_EMBEDDING,
                )
                db.add(j5)
                db.commit()
            jobs_list = db.query(Job).filter(Job.company_id == primary_company.id).all()

        # 5. Candidate users, resumes & applications
        print("[SEED] Creating sample candidates and applications for TechCorp VN...")
        for i, cand_info in enumerate(SAMPLE_CANDIDATES):
            cand_user = db.query(User).filter(User.email == cand_info["email"]).first()
            if not cand_user:
                cand_user = User(
                    email=cand_info["email"],
                    hashed_password=hash_password("Candidate@123456"),
                    full_name=cand_info["full_name"],
                    role=UserRole.CANDIDATE,
                    phone=cand_info["phone"],
                    is_active=True,
                )
                db.add(cand_user)
                db.flush()

            resume = db.query(Resume).filter(Resume.user_id == cand_user.id).first()
            if not resume:
                resume = Resume(
                    user_id=cand_user.id,
                    title=f"CV {cand_info['full_name']}",
                    file_url="/uploads/resumes/demo_cv.pdf",
                    raw_text=f"Ứng viên chuyên nghiệp với thế mạnh về {cand_info['skills']}. 4 năm kinh nghiệm phát triển phần mềm.",
                    parsed_skills=json.dumps(cand_info["skills"].split(", ")),
                    parsed_experience=json.dumps([{"role": "Software Engineer", "company": "Tech Corp", "duration": "3 years"}]),
                    embedding=FAKE_EMBEDDING,
                )
                db.add(resume)
                db.flush()

            target_job = jobs_list[i % len(jobs_list)]
            existing_app = db.query(Application).filter(
                Application.candidate_id == cand_user.id,
                Application.job_id == target_job.id
            ).first()

            statuses = [
                ApplicationStatus.INTERVIEW,
                ApplicationStatus.SHORTLISTED,
                ApplicationStatus.REVIEWED,
                ApplicationStatus.ACCEPTED,
                ApplicationStatus.PENDING,
                ApplicationStatus.INTERVIEW,
                ApplicationStatus.SHORTLISTED,
                ApplicationStatus.REVIEWED,
            ]
            scores = [96.5, 91.0, 88.5, 85.0, 82.0, 78.5, 74.0, 68.0]
            recs = [
                HiringRecommendation.RECOMMENDED,
                HiringRecommendation.RECOMMENDED,
                HiringRecommendation.RECOMMENDED,
                HiringRecommendation.RECOMMENDED,
                HiringRecommendation.NEEDS_MORE_REVIEW,
                HiringRecommendation.NEEDS_MORE_REVIEW,
                HiringRecommendation.NEEDS_MORE_REVIEW,
                HiringRecommendation.NOT_RECOMMENDED,
            ]

            if not existing_app:
                app = Application(
                    candidate_id=cand_user.id,
                    job_id=target_job.id,
                    resume_id=resume.id,
                    status=statuses[i % len(statuses)],
                    ai_matching_score=scores[i % len(scores)],
                    ai_feedback=f"Ứng viên có độ tương thích cao ({scores[i % len(scores)]}%) với vị trí {target_job.title}. Điểm mạnh về {cand_info['skills'].split(',')[0]} và kinh nghiệm thực chiến.",
                    hiring_recommendation=recs[i % len(recs)],
                    cover_letter=f"Kính gửi TechCorp VN, Tôi là {cand_info['full_name']}, xin nộp hồ sơ ứng tuyển vị trí {target_job.title}.",
                    applied_at=datetime.now() - timedelta(days=i * 2 + 1),
                )
                db.add(app)
                db.flush()
            else:
                app = existing_app

            # Add or update interview round for interview / shortlisted candidates
            intv = db.query(InterviewRound).filter(InterviewRound.application_id == app.id).first()
            if not intv and app.status in (ApplicationStatus.INTERVIEW, ApplicationStatus.ACCEPTED):
                intv = InterviewRound(
                    application_id=app.id,
                    round_number=1,
                    round_type=RoundType.TECH_INTERVIEW.value,
                    round_name="Phỏng vấn Kỹ thuật Chuyên sâu",
                    status=RoundStatus.IN_PROGRESS.value if app.status == ApplicationStatus.INTERVIEW else RoundStatus.PASSED.value,
                )
                db.add(intv)
                db.flush()

            if intv:
                # If candidate 1 (le.thi.mai), make it overdue to trigger Admin Alerts
                if i == 1:
                    intv.scheduled_at = datetime.now() - timedelta(days=4)
                    intv.location = "Phòng Họp 302, Tòa nhà TechCorp, Cầu Giấy, Hà Nội"
                    intv.needs_review = True
                    intv.review_reason = "Vòng phỏng vấn kỹ thuật quá hạn 4 ngày chưa cập nhật biên bản đánh giá."
                # If candidate 3 (pham.minh.khoa), add passed score with CriteriaScores
                elif i == 3:
                    intv.score = 9
                    intv.feedback = "Ứng viên nắm rất vững kiến thức Docker, Kubernetes, CI/CD, văn hóa phù hợp."
                    existing_crit = db.query(CriteriaScore).filter(CriteriaScore.round_id == intv.id).count()
                    if existing_crit == 0:
                        db.add_all([
                            CriteriaScore(round_id=intv.id, criteria_name="Kỹ năng Chuyên môn & DevOps", score=9, notes="Thành thạo Kubernetes, CI/CD, Linux"),
                            CriteriaScore(round_id=intv.id, criteria_name="Tư duy Kiến trúc Hệ thống", score=9, notes="Khả năng thiết kế High Availability rất tốt"),
                            CriteriaScore(round_id=intv.id, criteria_name="Văn hóa & Giao tiếp", score=8, notes="Tự tin, tinh thần trách nhiệm cao"),
                        ])

        # 6. Ensure default candidate@jobportal.vn has application + upcoming interview
        main_candidate = db.query(User).filter(User.email == "candidate@jobportal.vn").first()
        if main_candidate and jobs_list:
            c_resume = db.query(Resume).filter(Resume.user_id == main_candidate.id).first()
            if not c_resume:
                c_resume = Resume(
                    user_id=main_candidate.id,
                    title="CV Nguyễn Văn An — Senior Fullstack",
                    file_url="/uploads/resumes/demo_cv.pdf",
                    raw_text="Senior Fullstack Engineer với 5 năm kinh nghiệm React, Node.js, Python, PostgreSQL, Docker.",
                    parsed_skills=json.dumps(["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker"]),
                    parsed_experience=json.dumps([{"role": "Senior Engineer", "company": "VinaTech", "duration": "4 years"}]),
                    embedding=FAKE_EMBEDDING,
                )
                db.add(c_resume)
                db.flush()

            c_app = db.query(Application).filter(
                Application.candidate_id == main_candidate.id,
                Application.job_id == jobs_list[0].id
            ).first()
            if not c_app:
                c_app = Application(
                    candidate_id=main_candidate.id,
                    job_id=jobs_list[0].id,
                    resume_id=c_resume.id,
                    status=ApplicationStatus.INTERVIEW,
                    ai_matching_score=94.5,
                    ai_feedback=f"Ứng viên có độ tương thích xuất sắc (94.5%) với vị trí {jobs_list[0].title}. Thành thạo toàn bộ tech stack chính.",
                    hiring_recommendation=HiringRecommendation.RECOMMENDED,
                    cover_letter=f"Kính gửi ban tuyển dụng TechCorp, tôi rất hào hứng ứng tuyển vị trí {jobs_list[0].title}.",
                    applied_at=datetime.now() - timedelta(days=2),
                )
                db.add(c_app)
                db.flush()

            c_intv = db.query(InterviewRound).filter(InterviewRound.application_id == c_app.id).first()
            if not c_intv:
                c_intv = InterviewRound(
                    application_id=c_app.id,
                    round_number=1,
                    round_type=RoundType.TECH_INTERVIEW.value,
                    round_name="Phỏng vấn Kỹ thuật Trực tiếp",
                    status=RoundStatus.IN_PROGRESS.value,
                    scheduled_at=datetime.now() + timedelta(days=1, hours=2),
                    location="Google Meet: https://meet.google.com/abc-xyz-demo",
                    notes="Phỏng vấn trực tuyến với TechLead Phạm Quốc Dũng và HR Manager.",
                    reviewer_id=techlead_user.id if techlead_user else employer_user.id,
                )
                db.add(c_intv)
            else:
                c_intv.scheduled_at = datetime.now() + timedelta(days=1, hours=2)
                c_intv.location = "Google Meet: https://meet.google.com/abc-xyz-demo"
                c_intv.notes = "Phỏng vấn trực tuyến với TechLead Phạm Quốc Dũng và HR Manager."
                c_intv.reviewer_id = techlead_user.id if techlead_user else employer_user.id

        db.commit()
        print("[SUCCESS] All TechCorp demo jobs and candidate applications are active and populated!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_standard_accounts()

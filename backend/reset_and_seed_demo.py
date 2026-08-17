"""Reset & Seed Demo Script for Live Presentations and Defenses.

Wipes old test/junk data and populates clean, ultra-realistic data
tailored for demonstrating the AI-Powered Job Portal on stage.

Run command:
  python reset_and_seed_demo.py
"""

import json
import logging
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.company import Company, CompanyMembership, Department, MembershipRole, MembershipStatus, JobAssignment, CompanyInvitation
from app.models.job import Job, JobType, ExperienceLevel, JobCategory
from app.models.resume import Resume, EMBEDDING_DIM
from app.models.cv_document import CvDocument
from app.models.application import Application, ApplicationStatus, HiringRecommendation
from app.models.interview_round import InterviewRound, RoundType, RoundStatus
from app.models.criteria_score import CriteriaScore
from app.models.recruitment_request import RecruitmentRequest, RecruitmentPriority, RecruitmentRequestStatus
from app.models.notification import Notification, NotificationType
from app.models.admin_audit_log import AdminAuditLog

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("seed_demo")

DEMO_PASSWORD = "Employer@123456"
ADMIN_PASSWORD = "Admin@123456"
CANDIDATE_PASSWORD = "Candidate@123456"
TECHLEAD_PASSWORD = "TechLead@123456"

FAKE_EMBEDDING = [0.035] * EMBEDDING_DIM


def clean_database(db):
    """Safely wipe old data while preserving table structures."""
    logger.info("🧹 Cleaning old test data...")
    # Delete in order respecting foreign key constraints
    tables_to_clean = [
        CriteriaScore,
        InterviewRound,
        Application,
        CvDocument,
        Resume,
        JobAssignment,
        Job,
        RecruitmentRequest,
        Notification,
        AdminAuditLog,
        CompanyInvitation,
        CompanyMembership,
        Department,
        Company,
        JobCategory,
        User,
    ]
    for model in tables_to_clean:
        try:
            count = db.query(model).delete()
            logger.info(f"  - Cleared {count} records from {model.__tablename__}")
        except Exception as e:
            logger.warning(f"  - Note on {model.__tablename__}: {e}")
    db.commit()


def seed_demo_data():
    db = SessionLocal()
    try:
        clean_database(db)

        logger.info("🌱 Seeding realistic demo data...")

        # ── 1. Job Categories ──────────────────────────────────────────────────
        cats_data = [
            ("Công nghệ thông tin & Phần mềm", "it-phan-mem"),
            ("Trí tuệ nhân tạo & Dữ liệu", "ai-data"),
            ("Thiết kế UI/UX & Đồ họa", "design-ui-ux"),
            ("DevOps, Cloud & Hạ tầng", "devops-cloud"),
            ("Kinh doanh & Tiếp thị số", "marketing-sales"),
        ]
        cat_map = {}
        for name, slug in cats_data:
            cat = JobCategory(name=name, slug=slug)
            db.add(cat)
            db.flush()
            cat_map[slug] = cat.id
        logger.info("  ✓ Created 5 job categories")

        # ── 2. Core Demo Accounts ──────────────────────────────────────────────
        # Admin User
        admin_user = User(
            email="admin@jobportal.vn",
            hashed_password=hash_password(ADMIN_PASSWORD),
            full_name="Quản Trị Viên Hệ Thống",
            role=UserRole.ADMIN,
            is_active=True,
            phone="0901000001",
        )
        db.add(admin_user)

        # Employer User (HR Manager / Owner of TechCorp)
        employer_user = User(
            email="employer@techcorp.vn",
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Trần Thị Mai HR",
            role=UserRole.EMPLOYER,
            is_active=True,
            company_name="TechCorp Vietnam",
            company_description="Tập đoàn giải pháp công nghệ số và phần mềm hàng đầu tại Việt Nam.",
            phone="0901234567",
        )
        db.add(employer_user)

        # Department Head (Tech Lead)
        techlead_user = User(
            email="techlead@techcorp.vn",
            hashed_password=hash_password(TECHLEAD_PASSWORD),
            full_name="Hoàng Nam - Tech Lead",
            role=UserRole.EMPLOYER,
            is_active=True,
            company_name="TechCorp Vietnam",
            phone="0909888999",
        )
        db.add(techlead_user)

        # Primary Candidate (Nguyen Van An)
        primary_candidate = User(
            email="candidate@jobportal.vn",
            hashed_password=hash_password(CANDIDATE_PASSWORD),
            full_name="Nguyễn Văn An",
            role=UserRole.CANDIDATE,
            is_active=True,
            phone="0912345678",
        )
        db.add(primary_candidate)
        db.commit()
        db.refresh(employer_user)
        db.refresh(techlead_user)
        db.refresh(primary_candidate)
        logger.info("  ✓ Created 4 primary demo users (Admin, HR, TechLead, Candidate)")

        # ── 3. Company & Departments ──────────────────────────────────────────
        company = Company(
            name="TechCorp Vietnam",
            description="Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam, chuyên cung cấp các giải pháp AI B2B SaaS, Chuyển đổi số và Điện toán đám mây cho thị trường trong nước và quốc tế.",
            created_by_user_id=employer_user.id,
            is_active=True,
            website="https://techcorp.vn",
            address="Tầng 28, Tòa nhà Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội",
            tax_code="0108998877",
            industry="Công nghệ thông tin & Trí tuệ nhân tạo (AI)",
            company_size="100 - 500 nhân sự",
            contact_person_name="Trần Thị Mai",
            contact_person_email="recruitment@techcorp.vn",
            contact_person_phone="0901234567",
        )
        db.add(company)
        db.flush()

        # Memberships
        owner_membership = CompanyMembership(
            company_id=company.id,
            user_id=employer_user.id,
            member_role=MembershipRole.HR,
            is_owner=True,
            status=MembershipStatus.ACTIVE,
        )
        db.add(owner_membership)

        # Departments
        dept_engineering = Department(
            company_id=company.id,
            name="Phòng Kỹ thuật & Công nghệ (Engineering)",
            description="Phụ trách kiến trúc hệ thống, phát triển Backend, Frontend, AI/ML và Hạ tầng Cloud.",
            is_active=True,
        )
        dept_product = Department(
            company_id=company.id,
            name="Phòng Thiết kế & Sản phẩm (Product & Design)",
            description="Chịu trách nhiệm nghiên cứu người dùng, thiết kế UI/UX và quản trị sản phẩm.",
            is_active=True,
        )
        db.add_all([dept_engineering, dept_product])
        db.flush()

        # Assign Tech Lead to Engineering Department
        lead_membership = CompanyMembership(
            company_id=company.id,
            user_id=techlead_user.id,
            department_id=dept_engineering.id,
            member_role=MembershipRole.DEPARTMENT_HEAD,
            is_owner=False,
            status=MembershipStatus.ACTIVE,
        )
        db.add(lead_membership)
        db.commit()
        logger.info("  ✓ Created TechCorp company, 2 departments, and role memberships")

        # ── 4. High-Quality Jobs ──────────────────────────────────────────────
        jobs_data = [
            {
                "title": "Senior Fullstack Engineer (React 19 & Python FastAPI)",
                "description": "Chịu trách nhiệm thiết kế kiến trúc và phát triển hệ thống nền tảng AI Job Portal. Xây dựng các module AI Matching, phễu tuyển dụng Kanban, tối ưu hóa truy vấn Vector Database và đảm bảo tính mở rộng cao.",
                "requirements": "3+ năm kinh nghiệm với React, TypeScript và Python FastAPI. Thành thạo Tailwind CSS, PostgreSQL, Docker. Hiểu biết về Sentence Transformers hoặc pgvector là lợi thế lớn.",
                "benefits": "Thu nhập 35 - 60 triệu VNĐ, thưởng dự án theo quý, trang bị MacBook Pro M3, bảo hiểm sức khỏe VIP toàn diện.",
                "job_type": JobType.FULL_TIME,
                "experience_level": ExperienceLevel.SENIOR,
                "salary_min": 35_000_000,
                "salary_max": 60_000_000,
                "location": "Hà Nội / Hybrid",
                "category_id": cat_map["it-phan-mem"],
                "department_id": dept_engineering.id,
            },
            {
                "title": "AI & Data Engineer (LLM / RAG / pgvector)",
                "description": "Nghiên cứu, tinh chỉnh và triển khai các mô hình AI Matching, RAG Retrieval, CV Parser trên nền tảng DeepSeek API, PyTorch và FastAPI. Xây dựng pipeline kiểm soát thiên lệch AI (Bias-free AI).",
                "requirements": "Kinh nghiệm thực chiến với Vector Database (pgvector, Milvus), Prompt Engineering, Fine-tuning LLM, Python, PyTorch, FastAPI.",
                "benefits": "Thu nhập 45 - 75 triệu VNĐ, cổ phần ESOP thưởng, tài trợ 100% chi phí tham dự hội thảo công nghệ quốc tế.",
                "job_type": JobType.FULL_TIME,
                "experience_level": ExperienceLevel.SENIOR,
                "salary_min": 45_000_000,
                "salary_max": 75_000_000,
                "location": "TP. Hồ Chí Minh / Remote",
                "category_id": cat_map["ai-data"],
                "department_id": dept_engineering.id,
            },
            {
                "title": "Lead Product Designer (UI/UX B2B SaaS)",
                "description": "Chủ trì thiết kế trải nghiệm người dùng cho hệ thống B2B SaaS, xây dựng Design System chuẩn mực, thiết kế luồng quản trị phễu tuyển dụng và dashboard phân tích thông minh.",
                "requirements": "3+ năm kinh nghiệm thiết kế UI/UX cho sản phẩm B2B Web/Mobile. Thành thạo Figma, Design Tokens, Micro-interactions và User Research.",
                "benefits": "Thu nhập 30 - 50 triệu VNĐ, môi trường sáng tạo cởi mở, lộ trình thăng tiến rõ ràng lên vị trí Giám đốc Thiết kế.",
                "job_type": JobType.FULL_TIME,
                "experience_level": ExperienceLevel.LEAD,
                "salary_min": 30_000_000,
                "salary_max": 50_000_000,
                "location": "Hà Nội",
                "category_id": cat_map["design-ui-ux"],
                "department_id": dept_product.id,
            },
            {
                "title": "DevOps & Cloud Infrastructure Engineer",
                "description": "Quản trị hạ tầng đám mây AWS/GCP, thiết lập CI/CD pipelines tự động, quản lý Kubernetes cluster, triển khai pgvector và giám sát hệ thống với Prometheus/Grafana.",
                "requirements": "Kinh nghiệm vững vàng với Kubernetes, Docker, Terraform, GitLab CI/CD, Nginx và bảo mật mạng đám mây.",
                "benefits": "Thu nhập 32 - 55 triệu VNĐ, gói tài trợ thi chứng chỉ AWS/CKA không giới hạn, chế độ làm việc linh hoạt WFH.",
                "job_type": JobType.FULL_TIME,
                "experience_level": ExperienceLevel.MIDDLE,
                "salary_min": 32_000_000,
                "salary_max": 55_000_000,
                "location": "Đà Nẵng / Remote",
                "category_id": cat_map["devops-cloud"],
                "department_id": dept_engineering.id,
            },
            {
                "title": "Frontend React Developer (TypeScript / Tailwind)",
                "description": "Phát triển các component giao diện người dùng tương tác cao, kết nối RESTful API, tối ưu hóa tốc độ tải trang và trải nghiệm người dùng trên đa thiết bị.",
                "requirements": "1 - 3 năm kinh nghiệm với React, TypeScript, Tailwind CSS, Zustand/Redux. Tư duy thẩm mỹ tốt và chú trọng chi tiết.",
                "benefits": "Thu nhập 18 - 32 triệu VNĐ, đào tạo chuyên sâu bởi các Tech Lead hàng đầu, tham gia các dự án cốt lõi.",
                "job_type": JobType.FULL_TIME,
                "experience_level": ExperienceLevel.JUNIOR,
                "salary_min": 18_000_000,
                "salary_max": 32_000_000,
                "location": "Hà Nội",
                "category_id": cat_map["it-phan-mem"],
                "department_id": dept_engineering.id,
            },
        ]

        created_jobs = []
        for jd in jobs_data:
            job = Job(
                **jd,
                is_active=True,
                employer_id=employer_user.id,
                company_id=company.id,
                embedding=FAKE_EMBEDDING,
            )
            db.add(job)
            created_jobs.append(job)
        db.commit()
        for j in created_jobs:
            db.refresh(j)
        logger.info(f"  ✓ Created {len(created_jobs)} rich jobs with embeddings")

        # ── 5. Candidates, Resumes & AI Skill Analysis ────────────────────────
        candidates_data = [
            {
                "user": primary_candidate,
                "title": "CV Nguyễn Văn An - Senior Fullstack",
                "skills": ["React", "TypeScript", "FastAPI", "PostgreSQL", "Tailwind CSS", "Docker"],
                "skill_scores": {"React": 9.5, "TypeScript": 9.0, "FastAPI": 9.0, "PostgreSQL": 8.5, "Tailwind CSS": 9.5, "Docker": 8.5},
                "target_job": created_jobs[0],  # Fullstack
                "status": ApplicationStatus.INTERVIEW,
                "score": 94.5,
                "rec": HiringRecommendation.RECOMMENDED,
                "rec_note": "Ứng viên có kiến trúc phần mềm tốt, kỹ năng fullstack vững vàng và phù hợp cao với văn hóa đội ngũ.",
                "feedback": "Hồ sơ xuất sắc (94.5%). Điểm mạnh nổi trội về React, TypeScript và FastAPI. Khả năng thiết kế hệ thống tốt.",
            },
            {
                "email": "le.thi.mai@techdemo.vn",
                "name": "Lê Thị Mai",
                "phone": "0912345602",
                "title": "CV Lê Thị Mai - AI & Data Engineer",
                "skills": ["Python", "PyTorch", "pgvector", "FastAPI", "Docker", "LangChain"],
                "skill_scores": {"Python": 9.5, "PyTorch": 9.0, "pgvector": 9.0, "FastAPI": 8.5, "Docker": 8.5, "LangChain": 9.0},
                "target_job": created_jobs[1],  # AI Engineer
                "status": ApplicationStatus.SHORTLISTED,
                "score": 91.0,
                "rec": HiringRecommendation.RECOMMENDED,
                "rec_note": "Kinh nghiệm về RAG và vector embeddings rất thực chiến.",
                "feedback": "Khớp 91% yêu cầu JD. Điểm mạnh về Python, Vector Database và mô hình ngôn ngữ lớn.",
            },
            {
                "email": "tran.quoc.huy@techdemo.vn",
                "name": "Trần Quốc Huy",
                "phone": "0912345603",
                "title": "CV Trần Quốc Huy - Lead Product Designer",
                "skills": ["Figma", "Design System", "UI/UX", "User Research", "Wireframing", "Prototyping"],
                "skill_scores": {"Figma": 9.5, "Design System": 9.0, "UI/UX": 9.0, "User Research": 8.5, "Wireframing": 9.0, "Prototyping": 9.0},
                "target_job": created_jobs[2],  # Designer
                "status": ApplicationStatus.REVIEWED,
                "score": 88.0,
                "rec": HiringRecommendation.RECOMMENDED,
                "rec_note": "Portfolio B2B SaaS rất ấn tượng, visual sạch sẽ.",
                "feedback": "Khớp 88% yêu cầu. Kinh nghiệm dày dặn về thiết kế Design System và tối ưu trải nghiệm B2B.",
            },
            {
                "email": "pham.minh.khoa@techdemo.vn",
                "name": "Phạm Minh Khoa",
                "phone": "0912345604",
                "title": "CV Phạm Minh Khoa - DevOps Engineer",
                "skills": ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Linux"],
                "skill_scores": {"Kubernetes": 9.5, "Docker": 9.5, "AWS": 9.0, "Terraform": 8.5, "CI/CD": 9.0, "Linux": 9.0},
                "target_job": created_jobs[3],  # DevOps
                "status": ApplicationStatus.ACCEPTED,
                "score": 96.0,
                "rec": HiringRecommendation.RECOMMENDED,
                "rec_note": "Chuyên gia DevOps hàng đầu, có chứng chỉ CKA và AWS Solutions Architect.",
                "feedback": "Đạt điểm khớp tuyệt đối 96%. Thành thạo hạ tầng đám mây và tự động hóa quy trình CI/CD.",
            },
            {
                "email": "hoang.thu.trang@techdemo.vn",
                "name": "Hoàng Thu Trang",
                "phone": "0912345605",
                "title": "CV Hoàng Thu Trang - Frontend Dev",
                "skills": ["React", "JavaScript", "CSS3", "HTML5", "Tailwind", "Responsive"],
                "skill_scores": {"React": 8.5, "JavaScript": 8.5, "CSS3": 9.0, "HTML5": 9.0, "Tailwind": 8.5, "Responsive": 9.0},
                "target_job": created_jobs[4],  # Frontend
                "status": ApplicationStatus.PENDING,
                "score": 82.5,
                "rec": HiringRecommendation.NEEDS_MORE_REVIEW,
                "rec_note": "Ứng viên tiềm năng, cần kiểm tra thêm khả năng giải quyết thuật toán.",
                "feedback": "Khớp 82.5% với vị trí Junior Frontend. Nền tảng CSS/HTML vững và thao tác React tốt.",
            },
            {
                "email": "vu.duc.thang@techdemo.vn",
                "name": "Vũ Đức Thắng",
                "phone": "0912345606",
                "title": "CV Vũ Đức Thắng - Fullstack Dev",
                "skills": ["Python", "FastAPI", "React", "MySQL", "Docker", "REST API"],
                "skill_scores": {"Python": 8.0, "FastAPI": 8.0, "React": 7.5, "MySQL": 8.0, "Docker": 7.0, "REST API": 8.5},
                "target_job": created_jobs[0],  # Fullstack
                "status": ApplicationStatus.INTERVIEW,
                "score": 79.0,
                "rec": HiringRecommendation.NEEDS_MORE_REVIEW,
                "rec_note": "Cần phỏng vấn thêm về kiến trúc Microservices.",
                "feedback": "Độ tương thích 79%. Có kinh nghiệm xây dựng API nhưng cần nâng cao kỹ năng TypeScript.",
            },
            {
                "email": "doan.ngoc.linh@techdemo.vn",
                "name": "Đoàn Ngọc Linh",
                "phone": "0912345607",
                "title": "CV Đoàn Ngọc Linh - UI Designer",
                "skills": ["Figma", "UI Design", "Mobile UI", "Prototyping", "Design System", "Adobe XD"],
                "skill_scores": {"Figma": 8.5, "UI Design": 8.5, "Mobile UI": 9.0, "Prototyping": 8.0, "Design System": 7.5, "Adobe XD": 8.0},
                "target_job": created_jobs[2],  # Designer
                "status": ApplicationStatus.SHORTLISTED,
                "score": 85.0,
                "rec": HiringRecommendation.RECOMMENDED,
                "rec_note": "Thiết kế mobile app rất tinh tế, tư duy màu sắc tốt.",
                "feedback": "Khớp 85% vị trí Product Designer. Thế mạnh về giao diện ứng dụng di động.",
            },
            {
                "email": "dang.tuan.kiet@techdemo.vn",
                "name": "Đặng Tuấn Kiệt",
                "phone": "0912345608",
                "title": "CV Đặng Tuấn Kiệt - Systems",
                "skills": ["Linux", "Bash", "Docker", "Git", "Monitoring", "Python"],
                "skill_scores": {"Linux": 7.0, "Bash": 7.0, "Docker": 6.5, "Git": 7.0, "Monitoring": 6.0, "Python": 6.0},
                "target_job": created_jobs[3],  # DevOps
                "status": ApplicationStatus.REJECTED,
                "score": 62.0,
                "rec": HiringRecommendation.NOT_RECOMMENDED,
                "rec_note": "Chưa có kinh nghiệm thực tế với Kubernetes và hạ tầng đám mây AWS.",
                "feedback": "Độ tương thích 62%. Chưa đáp ứng đủ yêu cầu chuyên sâu về Kubernetes và Terraform.",
            },
        ]

        logger.info("  ✓ Seeding candidate resumes, applications, and radar charts...")
        for i, cdata in enumerate(candidates_data):
            days_ago = 12 - i
            user_created_date = datetime.now() - timedelta(days=days_ago + 2)
            app_applied_date = datetime.now() - timedelta(days=days_ago)

            if "user" in cdata:
                cand_user = cdata["user"]
                cand_user.created_at = user_created_date
            else:
                cand_user = User(
                    email=cdata["email"],
                    hashed_password=hash_password(CANDIDATE_PASSWORD),
                    full_name=cdata["name"],
                    role=UserRole.CANDIDATE,
                    phone=cdata["phone"],
                    is_active=True,
                    created_at=user_created_date,
                )
                db.add(cand_user)
                db.flush()

            # Create Resume with 6-Axis AI Skill Analysis JSON for Radar Chart
            ai_eval_payload = {
                "overall_score": cdata["score"],
                "strengths": [f"Thành thạo {cdata['skills'][0]}", f"Có kinh nghiệm thực chiến với {cdata['skills'][1]}"],
                "weaknesses": ["Cần bổ sung thêm chứng chỉ quốc tế"],
                "skill_analysis": cdata["skill_scores"],
                "summary": f"Ứng viên có {len(cdata['skills'])} kỹ năng cốt lõi phù hợp với thị trường.",
            }

            resume = Resume(
                user_id=cand_user.id,
                title=cdata["title"],
                file_url=f"/uploads/resumes/cv_sample_{i+1}.pdf",
                raw_text=f"Hồ sơ ứng viên {cand_user.full_name}. Chuyên môn cao về {', '.join(cdata['skills'])}. 3-5 năm kinh nghiệm.",
                parsed_skills=json.dumps(cdata["skills"]),
                parsed_experience=json.dumps([{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]),
                embedding=FAKE_EMBEDDING,
                ai_evaluation_json=json.dumps(ai_eval_payload),
                created_at=user_created_date,
            )
            db.add(resume)
            db.flush()

            # Create CV Document (CV Builder) for primary candidate
            if cand_user.id == primary_candidate.id:
                cv_doc = CvDocument(
                    user_id=primary_candidate.id,
                    template_key="ats-minimal",
                    status="published",
                    title="CV Chuyên Nghiệp - Nguyễn Văn An",
                    content_json={
                        "version": 1,
                        "personal": {
                            "full_name": "Nguyễn Văn An",
                            "email": "candidate@jobportal.vn",
                            "phone": "0912345678",
                            "title": "Senior Fullstack Software Engineer",
                            "summary": "Kỹ sư phần mềm Fullstack với 4+ năm kinh nghiệm phát triển ứng dụng web quy mô lớn bằng React, TypeScript, FastAPI và PostgreSQL.",
                            "location": "Hà Nội, Việt Nam",
                        },
                        "experiences": [
                            {
                                "company": "VNG Corporation",
                                "position": "Senior Software Engineer",
                                "start_date": "2023-01",
                                "end_date": "2026-06",
                                "description": "Kiến trúc hệ thống Microservices phục vụ 2 triệu người dùng hàng ngày. Tối ưu hóa API response time giảm 40%.",
                            }
                        ],
                        "skills": ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "pgvector", "Docker", "Tailwind CSS"],
                        "educations": [
                            {
                                "school": "Đại học Bách Khoa Hà Nội",
                                "degree": "Kỹ sư Công nghệ Thông tin",
                                "start_date": "2018",
                                "end_date": "2022",
                            }
                        ],
                    },
                )
                db.add(cv_doc)
                db.flush()

            # Create Application
            app = Application(
                candidate_id=cand_user.id,
                job_id=cdata["target_job"].id,
                resume_id=resume.id,
                status=cdata["status"],
                ai_matching_score=cdata["score"],
                ai_feedback=cdata["feedback"],
                hiring_recommendation=cdata["rec"],
                recommendation_note=cdata["rec_note"],
                recommendation_by_id=techlead_user.id if cdata["rec"] != HiringRecommendation.NOT_RECOMMENDED else None,
                recommended_at=datetime.now() - timedelta(days=2),
                cover_letter=f"Kính gửi Quý công ty TechCorp Vietnam, Tôi là {cand_user.full_name}, kính nộp hồ sơ ứng tuyển vị trí {cdata['target_job'].title}. Với kinh nghiệm và thế mạnh về {', '.join(cdata['skills'][:3])}, tôi tin mình sẽ đóng góp xuất sắc cho công ty.",
                applied_at=app_applied_date,
            )
            db.add(app)
            db.flush()

            # Create realistic Interview Rounds across all 4 stages
            if cdata["status"] == ApplicationStatus.ACCEPTED:
                # Candidate completed and passed all 4 rounds
                r1 = InterviewRound(application_id=app.id, round_number=1, round_type="cv_screen", round_name="1. Sàng lọc hồ sơ CV", scheduled_at=app_applied_date + timedelta(days=1), status=RoundStatus.PASSED.value, score=9)
                r2 = InterviewRound(application_id=app.id, round_number=2, round_type=RoundType.TECH_INTERVIEW.value, round_name="2. Phỏng vấn Kỹ thuật", scheduled_at=app_applied_date + timedelta(days=3), status=RoundStatus.PASSED.value, reviewer_id=techlead_user.id, score=9)
                r3 = InterviewRound(application_id=app.id, round_number=3, round_type="hr", round_name="3. Phỏng vấn Văn hóa & HR", scheduled_at=app_applied_date + timedelta(days=5), status=RoundStatus.PASSED.value, reviewer_id=employer_user.id, score=9)
                r4 = InterviewRound(application_id=app.id, round_number=4, round_type="final", round_name="4. Offer & Trúng tuyển", scheduled_at=app_applied_date + timedelta(days=7), status=RoundStatus.PASSED.value, score=10)
                db.add_all([r1, r2, r3, r4])
                db.flush()
            elif cdata["status"] == ApplicationStatus.INTERVIEW:
                # Currently in Tech round
                r1 = InterviewRound(application_id=app.id, round_number=1, round_type="cv_screen", round_name="1. Sàng lọc hồ sơ CV", scheduled_at=app_applied_date + timedelta(days=1), status=RoundStatus.PASSED.value, score=9)
                r2 = InterviewRound(application_id=app.id, round_number=2, round_type=RoundType.TECH_INTERVIEW.value, round_name="2. Phỏng vấn Kỹ thuật", scheduled_at=datetime.now() + timedelta(days=1), status=RoundStatus.IN_PROGRESS.value, reviewer_id=techlead_user.id, score=8)
                db.add_all([r1, r2])
                db.flush()
                # Add criteria scores
                criteria_list = [
                    CriteriaScore(round_id=r2.id, criteria_name="Kiến trúc hệ thống & Clean Code", score=9, notes="Tư duy thiết kế module rất rõ ràng."),
                    CriteriaScore(round_id=r2.id, criteria_name="Kỹ năng React & TypeScript", score=9, notes="Nắm chắc React hooks và TypeScript strict typing."),
                    CriteriaScore(round_id=r2.id, criteria_name="Kỹ năng Backend FastAPI & Database", score=8, notes="Tối ưu query SQL và transaction tốt."),
                ]
                db.add_all(criteria_list)
            elif cdata["status"] in (ApplicationStatus.SHORTLISTED, ApplicationStatus.REVIEWED):
                r1 = InterviewRound(application_id=app.id, round_number=1, round_type="cv_screen", round_name="1. Sàng lọc hồ sơ CV", scheduled_at=app_applied_date + timedelta(days=1), status=RoundStatus.PASSED.value, score=8)
                db.add(r1)

        db.commit()
        logger.info("  ✓ Created 8 applications with staggered dates and 4-stage interview rounds")

        # ── 6. Recruitment Requests ───────────────────────────────────────────
        req1 = RecruitmentRequest(
            company_id=company.id,
            department_id=dept_engineering.id,
            requested_by_id=techlead_user.id,
            title="Tuyển dụng 2 Kỹ sư Backend (Python / FastAPI)",
            headcount=2,
            job_type=JobType.FULL_TIME,
            priority=RecruitmentPriority.HIGH,
            reason="Mở rộng dự án AI Matching Engine cho khách hàng Enterprise, khối lượng công việc tăng 80%.",
            responsibilities="Xây dựng API Backend với FastAPI, tích hợp pgvector, tối ưu hóa hiệu năng cơ sở dữ liệu và triển khai CI/CD.",
            requirements="3+ năm kinh nghiệm Python, FastAPI, PostgreSQL, Docker. Có kinh nghiệm với Vector Search là lợi thế.",
            status=RecruitmentRequestStatus.APPROVED,
            review_note="Đã phê duyệt ngân sách tuyển dụng cho quý 3.",
            reviewed_by_id=employer_user.id,
            submitted_at=datetime.now() - timedelta(days=5),
            reviewed_at=datetime.now() - timedelta(days=3),
        )
        req2 = RecruitmentRequest(
            company_id=company.id,
            department_id=dept_product.id,
            requested_by_id=techlead_user.id,
            title="Tuyển dụng 1 Chuyên viên UI/UX Designer",
            headcount=1,
            job_type=JobType.FULL_TIME,
            priority=RecruitmentPriority.NORMAL,
            reason="Tái cấu trúc giao diện Mobile App và xây dựng thư viện Design System mới.",
            responsibilities="Thiết kế Wireframe, Prototype trên Figma, phỏng vấn người dùng và phối hợp với Frontend team.",
            requirements="2+ năm kinh nghiệm thiết kế sản phẩm SaaS hoặc Mobile App. Thành thạo Figma và Design Tokens.",
            status=RecruitmentRequestStatus.SUBMITTED,
            submitted_at=datetime.now() - timedelta(hours=4),
        )
        db.add_all([req1, req2])
        db.commit()
        logger.info("  ✓ Created 2 Recruitment Requests (1 Approved, 1 Submitted)")

        # ── 7. Realistic Notifications ────────────────────────────────────────
        notifications_data = [
            # For Primary Candidate
            Notification(
                user_id=primary_candidate.id,
                title="Lịch phỏng vấn mới được lên",
                message="Bạn có lịch phỏng vấn vị trí 'Senior Fullstack Engineer (React 19 & Python FastAPI)' vào ngày mai lúc 10:00 qua Google Meet.",
                type=NotificationType.APPLICATION_UPDATE,
                is_read=False,
            ),
            Notification(
                user_id=primary_candidate.id,
                title="Hồ sơ CV đã được xem",
                message="Nhà tuyển dụng TechCorp Vietnam đã duyệt hồ sơ ứng tuyển của bạn.",
                type=NotificationType.APPLICATION_UPDATE,
                is_read=False,
            ),
            # For Employer
            Notification(
                user_id=employer_user.id,
                title="Ứng viên mới có điểm AI Match cao (94.5%)",
                message="Ứng viên Nguyễn Văn An vừa nộp đơn ứng tuyển vào vị trí Senior Fullstack Engineer với điểm AI Matching 94.5%.",
                type=NotificationType.APPLICATION_UPDATE,
                is_read=False,
            ),
            Notification(
                user_id=employer_user.id,
                title="Yêu cầu tuyển dụng mới cần duyệt",
                message="Trưởng bộ phận Hoàng Nam vừa gửi yêu cầu tuyển dụng: 'Tuyển dụng 1 Chuyên viên UI/UX Designer'.",
                type=NotificationType.SYSTEM,
                is_read=False,
            ),
        ]
        db.add_all(notifications_data)
        db.commit()
        logger.info("  ✓ Created realistic notifications for candidate and employer")

        # ── 8. Realistic Audit Logs for Admin ─────────────────────────────────
        logs_data = [
            AdminAuditLog(
                actor_user_id=admin_user.id,
                actor_email=admin_user.email,
                action="SYSTEM_INIT",
                target_type="system",
                target_id="1",
                target_label="Hệ thống AI Job Portal",
                details_json={"message": "Khởi tạo nền tảng tuyển dụng AI Job Portal phiên bản Enterprise."},
            ),
            AdminAuditLog(
                actor_user_id=employer_user.id,
                actor_email=employer_user.email,
                company_id=company.id,
                action="JOB_CREATE",
                target_type="job",
                target_id=str(created_jobs[0].id),
                target_label=created_jobs[0].title,
                details_json={"message": "Đăng tin tuyển dụng 'Senior Fullstack Engineer (React 19 & Python FastAPI)'."},
            ),
            AdminAuditLog(
                actor_user_id=employer_user.id,
                actor_email=employer_user.email,
                company_id=company.id,
                action="AI_MATCH_RUN",
                target_type="application",
                target_id="1",
                target_label="Ứng viên Nguyễn Văn An",
                details_json={"score": 94.5, "message": "Chạy thuật toán Cosine Similarity AI Matching cho hồ sơ ứng viên Nguyễn Văn An."},
            ),
        ]
        db.add_all(logs_data)
        db.commit()
        logger.info("  ✓ Created audit logs for Admin oversight")

        print("\n" + "=" * 70)
        print("🎉 HOÀN THÀNH DỌN DẸP & NẠP DỮ LIỆU DEMO THỰC TẾ 100%!")
        print("=" * 70)
        print("📋 TÀI KHOẢN TRÌNH CHIẾU DEMO TRÊN GIẢNG ĐƯỜNG:")
        print("  1. ADMIN         : admin@jobportal.vn     / Admin@123456")
        print("  2. HR MANAGER    : employer@techcorp.vn   / Employer@123456")
        print("  3. TECH LEAD     : techlead@techcorp.vn   / TechLead@123456")
        print("  4. CANDIDATE     : candidate@jobportal.vn / Candidate@123456")
        print("=" * 70 + "\n")

    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Lỗi khi seed dữ liệu demo: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()

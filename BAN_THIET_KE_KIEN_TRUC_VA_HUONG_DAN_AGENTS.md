# BẢN THIẾT KẾ KIẾN TRÚC HỆ THỐNG VÀ CHỈ THỊ THỰC THI CHO AI AGENTS
# DỰ ÁN: CỔNG THÔNG TIN TUYỂN DỤNG THÔNG MINH TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI-JOB-PORTAL)

> **Tài liệu Kỹ thuật Tối cao dành cho AI Developer Agents** (Claude Code, Cursor, Windsurf, GitHub Copilot Workspace).  
> **Ngôn ngữ:** Tiếng Việt (Vietnamese) | **Kiến trúc:** B2B Multi-tenant SaaS | **Mô hình AI:** Hybrid 2-Tier AI Engine.
> *(Bản cập nhật v2.0 - Phản ánh chính xác Database Schema 20 bảng & Toàn bộ API hiện tại)*

---

## 1. PHÂN CÔNG VAI TRÒ TÁC NHÂN (AGENT PERSONAS) VÀ QUY TẮC BẤT DI BẤT DỊCH

### 1.1. Bản đồ Phân công Vai trò Tác nhân
- `@backend_architect_agent`:
  - Chịu trách nhiệm toàn bộ mã nguồn tại `backend/app/`.
  - Nghiêm ngặt tuân thủ cấu trúc phân tầng 4 lớp: `Routers -> Services -> CRUD -> Models/Schemas`.
  - Triển khai thuật toán pgvector (khoảng cách Cosine) đạt tốc độ truy vấn dưới 15ms.
  - Đảm bảo cô lập dữ liệu doanh nghiệp đa bên (*Multi-tenant Data Isolation*): Mọi câu truy vấn dữ liệu doanh nghiệp phải có mệnh đề `WHERE company_id = :current_company_id`.
- `@frontend_systems_agent`:
  - Chịu trách nhiệm toàn bộ mã nguồn tại `frontend/src/`.
  - Áp dụng hệ thống Design Tokens của Tailwind CSS v4: Dùng dải màu xám chuẩn `gray-*`, màu nền trang `#F5F7F8`, bo góc `rounded-lg (8px)`.
  - Mọi màn hình tải dữ liệu bắt buộc hỗ trợ đủ 4 trạng thái giao diện: *Đang tải (Skeleton), Dữ liệu rỗng (Empty State), Thất bại (Error with Retry), Thành công (Data Display)*.
  - Quản lý trạng thái bằng Zustand có cấu hình lưu trữ cục bộ (`persist`), Axios Interceptor tự động bắt mã lỗi 401 và 403.
- `@qa_compliance_agent`:
  - Quản lý bộ kiểm thử tại `backend/tests/` và `frontend/tests/`.
  - Giám sát nguyên tắc bảo vệ dữ liệu cá nhân (**Zero-PII**): Tuyệt đối không ghi nhận họ tên, số điện thoại, số CCCD, địa chỉ vào bảng `admin_audit_logs` hoặc gửi ra LLM bên ngoài.
  - Đảm bảo tính kiểm soát của con người (**Human-in-the-Loop - HITL**): Tuyệt đối không để AI tự động loại bỏ hồ sơ ứng viên (*No Auto-Reject*) hoặc tự ý gửi thư điện tử đi (*No Auto-Send*).

### 1.2. Các Quy tắc Kỹ thuật Thép (Non-Negotiables)
1. **Môi trường cách ly (Air-gapped Python Environment):** Không được tự ý cài đặt gói mới bằng `pip install`. Chỉ sử dụng các thư viện có sẵn trong môi trường (FastAPI, SQLAlchemy, Pydantic v2, SentenceTransformers, v.v.).
2. **Động cơ Trắc nghiệm Tất định (Deterministic Scoring Engine):** Nghiêm cấm dùng LLM để chấm điểm trắc nghiệm MBTI hoặc Đa trí tuệ (MI). Việc tính điểm phải sử dụng logic toán học tất định 100% tại backend.
3. **Cơ chế Phòng thủ AI (AI Guardrails):** Mọi lệnh gọi tới Cloud LLM (`deepseek-chat`) bắt buộc dùng chế độ phản hồi JSON (`response_format={"type": "json_object"}`), bọc trong lớp Pydantic Schema Validator, tự động thử lại 2 lần với thuật toán giãn cách thời gian lũy thừa (Exponential Backoff).
4. **Phân quyền Doanh nghiệp (RBAC Multi-tenant):**
   - `owner`: Quản lý toàn bộ công ty, cấu hình thành viên.
   - `hr`: Đăng tin tuyển dụng, quản lý ứng viên, gửi thư, điều phối phỏng vấn.
   - `reviewer` (Trưởng bộ phận): Chỉ xem hồ sơ ứng viên thuộc phòng ban mình phụ trách, chấm điểm tiêu chí chuyên môn và gửi phiếu đề xuất tuyển dụng nội bộ.

---

## 2. CÂY THƯ MỤC VẬT LÝ DỰ ÁN (PROJECT DIRECTORY STRUCTURE)

```
AI-Job-Portal/
├── backend/
│   ├── app/
│   │   ├── main.py                     # Khởi tạo ứng dụng FastAPI, CORS, gắn 17 routers
│   │   ├── core/                       # config.py, database.py, security.py, dependencies.py
│   │   ├── models/                     # Thực thể CSDL SQLAlchemy 20 bảng
│   │   │   ├── user.py, oauth_account.py, company.py, job.py, application.py, resume.py
│   │   │   ├── cv_document.py, assessment.py, interview_round.py, criteria_score.py
│   │   │   └── recruitment_request.py, admin_audit_log.py, ai_call_log.py, ai_prompt_config.py, notification.py
│   │   ├── schemas/                    # Mô hình xác thực dữ liệu Pydantic v2
│   │   ├── crud/                       # Tầng thao tác cơ sở dữ liệu chuyên biệt (DB operations)
│   │   ├── services/                   # Tầng nghiệp vụ xử lý logic và trí tuệ nhân tạo
│   │   │   ├── ai_vector_service.py    # Local MiniLM-L12-v2 (Vector 384 chiều, Cosine Match)
│   │   │   ├── ai_llm_service.py       # Tích hợp DeepSeek-Chat (Tóm tắt CV, Sinh email, Bộ câu hỏi)
│   │   │   ├── scoring_service.py      # Động cơ chấm điểm toán học tất định MBTI/MI
│   │   │   └── email_service.py        # Soạn thảo thư nhân sự, mã hóa URL mở trực tiếp Gmail Web
│   │   └── routers/                    # Tầng giao tiếp RESTful API Endpoints (17 modules)
│   │       ├── admin.py, admin_ai.py, ai.py, applications.py, assessments.py, auth.py
│   │       ├── company_team.py, criteria_scores.py, cv_documents.py, email_webhooks.py
│   │       ├── employer.py, interview_rounds.py, jobs.py, notifications.py, recruitment_requests.py
│   │       └── resumes.py, users.py
│   ├── tests/                          # Bộ kiểm thử Pytest tự động
│   ├── alembic/                        # Quản lý phiên bản di chuyển cấu trúc CSDL (Migrations)
│   └── Dockerfile                      # Đóng gói hạ tầng Backend đa tầng (Multi-stage Python 3.13)
├── frontend/
│   ├── src/
│   │   ├── App.tsx                     # Định tuyến React Router v7, khung điều hướng phân quyền
│   │   ├── api/                        # Cấu hình HTTP Client (Axios Client, Interceptors)
│   │   ├── components/                 # Các khối giao diện tái sử dụng
│   │   ├── pages/                      # Các trang màn hình chính
│   │   │   ├── admin/                  # AdminDashboard, AIPromptsPage, AdminAILogsPage, v.v.
│   │   │   ├── ai/                     # RoadmapPage
│   │   │   ├── auth/                   # LoginPage, RegisterPage, OAuthCallback
│   │   │   ├── candidate/              # CandidateDashboard, cv/...
│   │   │   ├── employer/               # EmployerDashboard, EmployerTeamPage, RecruitmentRequestsPage...
│   │   │   ├── jobs/                   # JobListPage, JobDetailPage
│   │   │   └── tools/                  # CVBuilderPage, AssessmentPage
│   │   ├── store/                      # Quản lý trạng thái ứng dụng Zustand (authStore, cvStore)
│   │   ├── types/                      # Định nghĩa kiểu dữ liệu TypeScript (Mirror models backend)
│   │   └── styles/                     # Tailwind CSS v4 configuration, token styles
│   └── package.json                    # Dependencies: Vite, Tailwind 4, Zustand, Zod, React Hook Form
└── docker-compose.yml                  # Điều phối container: frontend, backend, db (Postgres pgvector)
```

---

## 3. HỢP ĐỒNG DỮ LIỆU & ĐỊNH NGHĨA KIỂU (DATA CONTRACTS & DDL)

**Quan trọng:** Dưới đây là lược đồ cơ sở dữ liệu vật lý (DDL) gồm 20 bảng đang chạy thực tế. Khi thiết kế chức năng, Agents BẮT BUỘC tham chiếu chính xác tên trường và kiểu dữ liệu ở đây.

### 3.1. Mã DDL Khởi tạo Cơ sở Dữ liệu (PostgreSQL 17 + pgvector)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Bảng NGƯỜI DÙNG & XÁC THỰC SSO
CREATE TABLE users (
	id SERIAL NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255), 
	full_name VARCHAR(100) NOT NULL, 
	phone_number VARCHAR(20), 
	role userrole NOT NULL, 
	status userstatus NOT NULL, 
	avatar_url VARCHAR(500), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), UNIQUE (email)
);
CREATE TABLE oauth_accounts (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	provider VARCHAR(50) NOT NULL, 
	provider_account_id VARCHAR(255) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), UNIQUE (provider, provider_account_id),
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 2. BẢNG DOANH NGHIỆP, PHÒNG BAN & NHÂN SỰ
CREATE TABLE companies (
	id SERIAL NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	slug VARCHAR(255) NOT NULL, 
	website VARCHAR(255), 
	logo_url VARCHAR(500), 
	description TEXT, 
	industry VARCHAR(100), 
	company_size VARCHAR(50), 
	status companystatus NOT NULL, 
	owner_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), UNIQUE (slug),
	FOREIGN KEY(owner_id) REFERENCES users (id)
);
CREATE TABLE departments (
	id SERIAL NOT NULL, 
	company_id INTEGER NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id),
	FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE
);
CREATE TABLE company_memberships (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	company_id INTEGER NOT NULL, 
	role membershiprole NOT NULL, 
	department_id INTEGER, 
	status membershipstatus NOT NULL, 
	joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), CONSTRAINT uq_user_company UNIQUE (user_id, company_id),
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE, 
	FOREIGN KEY(department_id) REFERENCES departments (id) ON DELETE SET NULL
);
CREATE TABLE company_invitations (
	id SERIAL NOT NULL, 
	company_id INTEGER NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	role membershiprole NOT NULL, 
	department_id INTEGER, 
	invited_by INTEGER NOT NULL, 
	token VARCHAR(100) NOT NULL, 
	status invitationstatus NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), UNIQUE (token),
	FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE, 
	FOREIGN KEY(department_id) REFERENCES departments (id) ON DELETE SET NULL, 
	FOREIGN KEY(invited_by) REFERENCES users (id)
);

-- 3. BẢNG TIN TUYỂN DỤNG & CÔNG VIỆC
CREATE TABLE job_categories (
	id SERIAL NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	slug VARCHAR(100) NOT NULL, 
	PRIMARY KEY (id), UNIQUE (name), UNIQUE (slug)
);
CREATE TABLE jobs (
	id SERIAL NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	requirements TEXT, 
	benefits TEXT, 
	job_type jobtype NOT NULL, 
	experience_level experiencelevel NOT NULL, 
	salary_min INTEGER, 
	salary_max INTEGER, 
	location VARCHAR(255), 
	is_active BOOLEAN NOT NULL, 
	embedding VECTOR(384), 
	employer_id INTEGER NOT NULL, 
	company_id INTEGER, 
	department_id INTEGER, 
	category_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(employer_id) REFERENCES users (id), 
	FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE, 
	FOREIGN KEY(department_id) REFERENCES departments (id) ON DELETE SET NULL, 
	FOREIGN KEY(category_id) REFERENCES job_categories (id)
);
CREATE TABLE job_assignments (
	id SERIAL NOT NULL, 
	job_id INTEGER NOT NULL, 
	membership_id INTEGER NOT NULL, 
	assigned_by INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), CONSTRAINT uq_job_assignment_membership UNIQUE (job_id, membership_id), 
	FOREIGN KEY(job_id) REFERENCES jobs (id) ON DELETE CASCADE, 
	FOREIGN KEY(membership_id) REFERENCES company_memberships (id) ON DELETE CASCADE, 
	FOREIGN KEY(assigned_by) REFERENCES users (id)
);
CREATE TABLE recruitment_requests (
	id SERIAL NOT NULL, 
	company_id INTEGER NOT NULL, 
	department_id INTEGER NOT NULL, 
	requested_by_id INTEGER NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	headcount INTEGER NOT NULL, 
	job_type jobtype NOT NULL, 
	priority recruitmentpriority NOT NULL, 
	reason TEXT NOT NULL, 
	responsibilities TEXT NOT NULL, 
	requirements TEXT NOT NULL, 
	target_start_date DATE, 
	status recruitmentrequeststatus NOT NULL, 
	review_note TEXT, 
	reviewed_by_id INTEGER, 
	submitted_at TIMESTAMP WITH TIME ZONE, 
	reviewed_at TIMESTAMP WITH TIME ZONE, 
	cancelled_at TIMESTAMP WITH TIME ZONE, 
	converted_job_id INTEGER, 
	converted_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), UNIQUE (converted_job_id),
	FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE, 
	FOREIGN KEY(department_id) REFERENCES departments (id) ON DELETE RESTRICT, 
	FOREIGN KEY(requested_by_id) REFERENCES users (id) ON DELETE RESTRICT, 
	FOREIGN KEY(reviewed_by_id) REFERENCES users (id) ON DELETE SET NULL, 
	FOREIGN KEY(converted_job_id) REFERENCES jobs (id) ON DELETE SET NULL
);

-- 4. BẢNG HỒ SƠ CV VÀ ỨNG TUYỂN (ATS)
CREATE TABLE resumes (
	id SERIAL NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	file_url VARCHAR(500), 
	raw_text TEXT, 
	parsed_skills TEXT, 
	parsed_experience TEXT, 
	ai_evaluation_json TEXT, 
	embedding VECTOR(384), 
	user_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE TABLE cv_documents (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	template_key VARCHAR(64) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	content_json JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE applications (
	id SERIAL NOT NULL, 
	cover_letter TEXT, 
	status applicationstatus NOT NULL, 
	ai_matching_score FLOAT, 
	ai_feedback TEXT, 
	hiring_recommendation hiringrecommendation, 
	recommendation_note TEXT, 
	recommendation_by_id INTEGER, 
	recommended_at TIMESTAMP WITH TIME ZONE, 
	decision_by_id INTEGER, 
	decided_at TIMESTAMP WITH TIME ZONE, 
	decision_reason TEXT, 
	candidate_id INTEGER NOT NULL, 
	job_id INTEGER NOT NULL, 
	resume_id INTEGER, 
	cv_document_id INTEGER, 
	applied_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(recommendation_by_id) REFERENCES users (id) ON DELETE SET NULL, 
	FOREIGN KEY(decision_by_id) REFERENCES users (id) ON DELETE SET NULL, 
	FOREIGN KEY(candidate_id) REFERENCES users (id), 
	FOREIGN KEY(job_id) REFERENCES jobs (id), 
	FOREIGN KEY(resume_id) REFERENCES resumes (id), 
	FOREIGN KEY(cv_document_id) REFERENCES cv_documents (id) ON DELETE SET NULL
);

-- 5. BẢNG PHỎNG VẤN & BÀI TEST TRẮC NGHIỆM
CREATE TABLE interview_rounds (
	id SERIAL NOT NULL, 
	application_id INTEGER NOT NULL, 
	round_number INTEGER NOT NULL, 
	round_type VARCHAR(50) NOT NULL, 
	round_name VARCHAR(255), 
	status VARCHAR(50) DEFAULT 'pending' NOT NULL, 
	scheduled_at TIMESTAMP WITH TIME ZONE, 
	location VARCHAR(500), 
	notes TEXT, 
	reviewer_id INTEGER, 
	score INTEGER, 
	feedback TEXT, 
	needs_review BOOLEAN DEFAULT 'false' NOT NULL, 
	review_reason TEXT, 
	marked_by_admin_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(application_id) REFERENCES applications (id) ON DELETE CASCADE, 
	FOREIGN KEY(reviewer_id) REFERENCES users (id), 
	FOREIGN KEY(marked_by_admin_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE TABLE round_criteria_scores (
	id SERIAL NOT NULL, 
	round_id INTEGER NOT NULL, 
	criteria_name VARCHAR(255) NOT NULL, 
	score INTEGER NOT NULL, 
	notes TEXT, 
	PRIMARY KEY (id), CONSTRAINT ck_criteria_score_range CHECK (score >= 0 AND score <= 10), 
	FOREIGN KEY(round_id) REFERENCES interview_rounds (id) ON DELETE CASCADE
);
CREATE TABLE assessment_attempts (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	assessment_type VARCHAR(20) NOT NULL, 
	questionnaire_version VARCHAR(30) NOT NULL, 
	answers_json JSON NOT NULL, 
	result_code VARCHAR(30) NOT NULL, 
	result_json JSON NOT NULL, 
	completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 6. BẢNG KIỂM TOÁN VÀ QUẢN TRỊ (ADMIN)
CREATE TABLE admin_audit_logs (
	id SERIAL NOT NULL, 
	actor_user_id INTEGER, 
	company_id INTEGER, 
	actor_email VARCHAR(255) NOT NULL, 
	action VARCHAR(100) NOT NULL, 
	target_type VARCHAR(50) NOT NULL, 
	target_id VARCHAR(64), 
	target_label VARCHAR(255), 
	details_json JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(actor_user_id) REFERENCES users (id) ON DELETE SET NULL, 
	FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE
);
CREATE TABLE ai_call_logs (
	id SERIAL NOT NULL, 
	feature aifeature NOT NULL, 
	user_id INTEGER, 
	related_id INTEGER, 
	input_tokens INTEGER, 
	output_tokens INTEGER, 
	cost_usd FLOAT, 
	status aicallstatus NOT NULL, 
	error_message VARCHAR(500), 
	duration_ms INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE TABLE ai_prompt_configs (
	id SERIAL NOT NULL, 
	feature VARCHAR(50) NOT NULL, 
	system_prompt TEXT NOT NULL, 
	user_prompt_template TEXT, 
	is_active BOOLEAN NOT NULL, 
	updated_by INTEGER, 
	updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(updated_by) REFERENCES users (id) ON DELETE SET NULL
);
CREATE TABLE notifications (
	id SERIAL NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	message TEXT NOT NULL, 
	type notificationtype NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	user_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
```

### 3.2. Khung Mô hình Pydantic Schemas Cốt lõi
*(Lưu ý: Các module Schema chi tiết đặt tại `backend/app/schemas/`)*

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ApplicationCreate(BaseModel):
    job_id: int = Field(..., description="ID của tin tuyển dụng cần nộp")
    resume_id: Optional[int] = Field(None, description="ID của CV tải lên")
    cv_document_id: Optional[int] = Field(None, description="ID của CV tạo từ Studio")
    cover_letter: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    candidate_name: str
    ai_matching_score: Optional[float]
    status: str
    applied_at: datetime
    class Config: from_attributes = True

class CVEvaluationResponse(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0)
    match_level: str
    radar_scores: Dict[str, float] # 6 trục: frontend, backend, database, system_design, devops, soft_skills
    strengths: List[str]
    weaknesses: List[str]
    recommendation: str

class AIEmailGenerateRequest(BaseModel):
    application_id: int
    email_type: str = Field(..., pattern="^(interview|rejection|offer|technical_test)$")
    custom_notes: Optional[str] = None
```

### 3.3. Định nghĩa Kiểu Dữ liệu Frontend (TypeScript Interfaces)
*(Tương tự, các Type định nghĩa đặt tại `frontend/src/types/`)*

```typescript
export type UserRole = 'admin' | 'employer' | 'candidate';
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'accepted' | 'rejected';

export interface ApplicationItem {
  id: number;
  job_id: number;
  candidate_id: number;
  candidate_name: string;
  ai_matching_score: number | null;
  status: ApplicationStatus;
  applied_at: string;
}

export interface RadarDataPoint {
  subject: string;
  candidate_score: number;
  job_requirement: number;
  fullMark: number;
}
```

---

## 4. HỢP ĐỒNG API ROUTES THỰC TẾ (API CONTRACTS MATRIX)

Cấu trúc API hiện tại bao gồm 17 Module, bao phủ toàn bộ 24 User Cases:

| Module | Phương thức | Đường dẫn API | Chức năng (Ý nghĩa) | Cấu trúc Dữ liệu Đầu vào |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Đăng nhập lấy Token | `{ email, password }` |
| **Auth** | `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới | `{ email, password, full_name, role }` |
| **Users** | `GET` | `/api/v1/users/me` | Lấy profile hiện tại | *(Không)* |
| **Jobs** | `GET` | `/api/v1/jobs` | Tìm & Lọc Job (`?keyword=...`) | QueryParams |
| **Applications** | `POST` | `/api/v1/applications` | Nộp hồ sơ ứng tuyển | `ApplicationCreate` |
| **Applications** | `PATCH`| `/api/v1/employer/applications/{id}/status` | Đổi trạng thái (ATS Kanban) | `{ status }` |
| **AI** | `POST` | `/api/v1/ai/generate-email` | Soạn thư Bias-free 1-click | `AIEmailGenerateRequest` |
| **AI** | `POST` | `/api/v1/ai/evaluate-cv` | Gọi AI đánh giá Radar CV | `{ application_id }` |
| **Company Team** | `POST` | `/api/v1/company-team/invitations` | Gửi Email mời nhân sự | `{ email, role, department_id }` |
| **CV Builder** | `POST` | `/api/v1/cv-documents` | Lưu CV Studio Template | `{ template_key, content_json }` |
| **Assessments** | `POST` | `/api/v1/assessments/submit` | Nộp bài MBTI / Đa trí tuệ | `{ type, answers_json }` |
| **Interviews** | `POST` | `/api/v1/interview-rounds` | Lên lịch phỏng vấn chặng | `{ round_type, scheduled_at, location... }` |
| **Scores** | `POST` | `/api/v1/criteria-scores` | Lưu điểm chuyên môn | `{ scores: [...] }` |
| **Admin Logs** | `GET` | `/api/v1/admin/audit-logs` | Xem lịch sử Zero-PII | QueryParams (`?page=1`) |
| **Admin AI** | `PUT` | `/api/v1/admin-ai/prompts/{feature}`| Đổi System Prompt động | `{ system_prompt, is_active }` |
| **Requests** | `POST` | `/api/v1/recruitment-requests` | Lập phiếu xin người nội bộ | `{ title, headcount, reason... }` |
| **Notifications** | `GET` | `/api/v1/notifications` | Lấy danh sách thông báo web| *(Không)* |

---

## 5. DANH MỤC CÔNG VIỆC (CHECKLIST & DOD)
*(Toàn bộ các module cốt lõi đã hoàn thiện và passed nghiệm thu).*

### 5.1. Các Hạng Mục Đã Hoàn Thành `[x]`
- [x] Tạo 20 bảng PostgreSQL và cấu hình Index `pgvector HNSW`.
- [x] Ánh xạ 20 Models SQLAlchemy (có Foreign Keys chặt chẽ).
- [x] Cấu hình FastAPI (`main.py`) nạp 17 Router Modules.
- [x] Tích hợp Zustand (State), React Router v7, Tailwind 4.
- [x] Màn hình Kanban ATS kéo thả ứng viên.
- [x] Màn hình phân tích CV bằng Radar Chart AI (đã tích hợp `deepseek-chat`).
- [x] Form Đánh giá MBTI và Lộ trình Career Roadmap.
- [x] Modul Quản lý Team nội bộ (Mời HR/Reviewer gia nhập bằng Token).
- [x] Zero-PII Audit Logs (Lưu action nhưng không lưu CCCD/số ĐT).

### 5.2. Tiêu Chuẩn Hoàn Thành Khi Có Thay Đổi Mã Nguồn (Definition of Done)
Bất kỳ Agent nào thao tác viết thêm tính năng hoặc refactor mã nguồn đều phải đảm bảo vượt qua:

1. **Kiểm tra Cú pháp & Typings Backend:**
   ```bash
   ruff check backend/app/
   mypy --strict backend/app/
   ```
2. **Kiểm tra Typings Frontend:**
   ```bash
   npm --prefix frontend run typecheck
   # Yêu cầu: 0 lỗi TypeScript
   ```
3. **Hiệu năng Vector:**
   Truy vấn Cosine Similarity trên `jobs` và `resumes` phải mất `< 15ms`.

---

## 6. HƯỚNG DẪN DÀNH CHO CÁC CÔNG CỤ LẬP TRÌNH AI (AGENT SYSTEM PROMPT INJECTION)


> *"Bạn là hệ thống AI Developer Agents chuyên trách dự án AI-Job-Portal. Hãy đọc kỹ toàn bộ tệp `BAN_THIET_KE_KIEN_TRUC_VA_HUONG_DAN_AGENTS.md` này. Lưu ý kiến trúc hiện tại gồm **20 bảng CSDL** (chi tiết tại mục 3.1) và **17 API Routers**. Bất kỳ đề xuất thay đổi hoặc tạo mới bảng/router nào đều BẮT BUỘC phải dựa trên sơ đồ DDL gốc này và không được bịa đặt (hallucinate) các trường dữ liệu không tồn tại. Tuân thủ DOD (Mục 5.2) trước khi hoàn tất công việc."*

# 🚀 AI-Powered Job Portal — Enterprise Edition (v2.0)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17_pgvector-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![DeepSeek](https://img.shields.io/badge/AI_Engine-DeepSeek_V3-007ACC.svg?style=flat)](https://platform.deepseek.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=TailwindCSS&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=Docker&logoColor=white)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/Tests-100%25_Passing-brightgreen.svg?style=flat)](#-7-kiểm-thử--đảm-bảo-chất-lượng-qa--cicd)

---

## 📖 1. Giới Thiệu Tổng Quan (Executive Summary)

**AI Job Portal** là nền tảng tuyển dụng thông minh và hướng nghiệp thế hệ mới được thiết kế theo mô hình **B2B SaaS Multi-tenant Enterprise-ready**. Hệ thống tích hợp sâu kiến trúc **RAG (Retrieval-Augmented Generation)**, thuật toán tìm kiếm vector ngữ nghĩa với **`pgvector`** và mô hình ngôn ngữ lớn **DeepSeek-V3 LLM**.

Nền tảng giải quyết triệt để bài toán tuyển dụng hiện đại:
- **Doanh nghiệp (Employer):** Tối ưu hóa quy trình sàng lọc hồ sơ tự động, tìm kiếm nhân tài bằng ngữ nghĩa (Semantic Talent Search), phễu ATS Kanban kéo thả và hỗ trợ soạn thảo thư tuyển dụng chuẩn mực không thiên lệch (Bias-Free).
- **Ứng viên (Candidate):** Trợ lý AI CV Copilot đồng hành trong quá trình soạn thảo, đối soát ATS tức thì, đánh giá mức độ phù hợp công việc và định hướng lộ trình nghề nghiệp dựa trên bài test tâm lý học chuẩn hóa.
- **Quản trị viên (Admin):** Toàn quyền kiểm soát và giám sát Vector Store, điều phối thuật toán Hybrid Search, công tắc dừng AI khẩn cấp (Emergency Kill Switch), thống kê chi phí Token thời gian thực và quản lý phản hồi sự cố từ người dùng.

---

## ✨ 2. Các Phân Hệ & Tính Năng Cốt Lõi (Core Features)

### 2.1. Động Cơ RAG & Quản Trị Vector Store (RAG Vector Governance)
- **Tìm Kiếm Lai Đột Phá (Hybrid Search):** Kết hợp thuật toán tìm kiếm vector Dense Embeddings (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` 384 chiều) qua khoảng cách Cosine (`<=>`) trên `pgvector` và thuật toán tìm kiếm từ khóa Sparse Search (BM25 / Trigram Full-text tiếng Việt).
- **Trang Quản Trị RAG Chuyên Biệt (`/admin/ai/rag-governance`):**
  - **Chỉ số Vector Thời Gian Thực:** Thống kê tổng số vector chunks (Resumes, CV Documents, Job Postings), tốc độ phản hồi truy vấn (trung bình ~45ms) và tỷ lệ lỗi vector store.
  - **Biểu Đồ Xu Hướng Recharts:** Trực quan hóa số lượt tìm kiếm RAG và độ trễ theo từng ngày trong tuần.
  - **Bảng Nhật Ký Tìm Kiếm (RAG Search Logs):** Lưu vết toàn bộ câu hỏi của nhà tuyển dụng/ứng viên, độ khớp cao nhất, độ trễ và trạng thái thực thi.
  - **Tinh Chỉnh Thuật Toán (Algorithm Tuning):** Cho phép Admin cân chỉnh trực tiếp tỷ trọng Vector Weight vs Keyword Weight, ngưỡng lọc tương đồng tối thiểu (Min Similarity Threshold) và số lượng chunks tối đa (Top-K) ngay trên giao diện.
  - **Công Tắc Dừng Khẩn Cấp (Emergency Kill Switch):** Cho phép tắt lập tức động cơ RAG trong trường hợp hệ thống bị quá tải hoặc cần bảo trì, tự động chuyển về chế độ tìm kiếm cơ bản.
  - **Cơ Chế Nạp Lại Chỉ Mục Đồng Loạt (Batch Reindexing):** Tái tạo toàn bộ embedding chunks cho toàn bộ tin tuyển dụng và hồ sơ ứng viên chỉ bằng 1-Click.

### 2.2. Cổng Bảo Mật AI Zero-Trust (AI Security Gateway)
Hệ thống được bọc lót bởi 3 lớp phòng ngự độc lập:
- **Prompt Armor (`prompt_armor.py`):**
  - Phát hiện và vô hiệu hóa tấn công **Prompt Injection** và **Jailbreak** (như `"Ignore all previous instructions"`, DAN mode, Markdown/HTML obfuscation, system prompt extraction).
  - Phân tích rủi ro dựa trên bộ mẫu RegEx đa ngữ và đo lường chỉ số Entropy của chuỗi đầu vào. Tự động chuyển hướng về thông điệp phòng thủ an toàn khi phát hiện can thiệp độc hại.
- **Secret Masker (`secret_masker.py`):**
  - Tự động quét và che giấu (redact) các dữ liệu nhạy cảm trong logs và lỗi: DeepSeek API Keys (`sk-...`), OpenAI Keys, AWS Access Keys, Bearer JWT Tokens, chuỗi kết nối cơ sở dữ liệu và mật khẩu người dùng.
- **LLM Guard (`llm_guard.py`):**
  - Trình phân tích JSON thông minh với cơ chế tự động sửa lỗi (Self-healing JSON parser) khi AI trả về chuỗi JSON bị thiếu ngoặc đóng hoặc lẫn Markdown codeblock.
  - Giới hạn độ dài văn bản nghiêm ngặt (Clamping) chống tràn bộ nhớ và tấn công DoS token.
- **Cách Ly Đa Doanh Nghiệp (Strict Multi-tenant Isolation):**
  - Ngăn chặn triệt để lỗ hổng **IDOR (Insecure Direct Object Reference)**. Nhà tuyển dụng tuyệt đối không thể xem hồ sơ hoặc kết quả AI của ứng viên chưa ứng tuyển vào công ty mình.
  - Kiểm tra tính hợp lệ của định dạng UUID, phòng chống SQL Injection và giả mạo quyền hạn (Role-spoofing).
  - **Thu hồi phiên và WebSocket tức thì:** Thu hồi token JWT và ngắt ngay lập tức mọi kết nối WebSocket đang mở của người dùng khi có hành vi đổi mật khẩu hoặc bị vô hiệu hóa tài khoản.

### 2.3. Phân Hệ Doanh Nghiệp & Tuyển Dụng (B2B Employer ATS)
- **Săn Tìm Tài Năng Thông Minh (Semantic Talent Search - `/employer/talent-search`):**
  - Tìm kiếm ứng viên bằng ngôn ngữ tự nhiên (Ví dụ: *"Lập trình viên Backend có kinh nghiệm FastAPI, PostgreSQL và Docker"*).
  - **Thẻ Hồ Sơ Toàn Diện (Candidate Dossier Card):** Bóc tách điểm số AI Matching chi tiết, radar kỹ năng, điểm mạnh, điểm cần cải thiện, kinh nghiệm và học vấn.
  - Hỗ trợ lọc đa chiều: Chỉ tìm ứng viên đã nộp đơn vào công ty hoặc quét toàn bộ hồ sơ mở, lọc theo chức danh tin tuyển dụng.
- **Phễu Tuyển Dụng Trực Quan (Kanban ATS):** Kéo thả ứng viên mượt mà qua các vòng: Chờ duyệt $\rightarrow$ Đã xem $\rightarrow$ Sơ tuyển $\rightarrow$ Phỏng vấn $\rightarrow$ Đề xuất $\rightarrow$ Chấp nhận/Từ chối.
- **Quy Trình Duyệt Nhân Sự Đa Tầng:** Trưởng bộ phận lập Phiếu Yêu Cầu Tuyển Dụng (Recruitment Request) $\rightarrow$ Giám đốc/HR phê duyệt $\rightarrow$ Hệ thống tự động chuyển đổi thành Tin Tuyển Dụng.
- **Chấm Điểm Phỏng Vấn (Interview Rubric & Criteria Scoring):** Thiết lập tiêu chí điểm số theo thang điểm chuẩn hóa và đánh giá trực tiếp ứng viên theo từng vòng.
- **Soạn Thảo Email Tuyển Dụng Trung Tính (Bias-Free Email):** AI sinh thư mời phỏng vấn / thư từ chối trung tính, hỗ trợ 1-Click mở trực tiếp vào hộp thư Gmail Web.

### 2.4. Trải Nghiệm Ứng Viên & Trợ Lý AI CV Copilot
- **AI CV Copilot Drawer:** Trợ lý ảo tích hợp trực tiếp trong Studio soạn thảo CV (`/candidate/cv-editor`):
  - **Kiểm định ATS (ATS Readiness Audit):** Chấm điểm chuẩn hóa hồ sơ so với tiêu chuẩn định dạng ATS.
  - **Phân Tích Lỗ Hổng Kỹ Năng (Skill Gap Advisor):** Đối chiếu hồ sơ với các vị trí tuyển dụng mục tiêu và gợi ý kỹ năng cần bổ sung.
  - **Luyện Phỏng Vấn Thử (Mock Interview Prep):** Sinh bộ câu hỏi phỏng vấn sát thực tế dựa trên chính dự án và kinh nghiệm ghi trong CV.
- **CV Builder Studio:** Trình tạo CV chia đôi màn hình tương tác thời gian thực với cấu trúc dữ liệu JSON cấp độ cao. Tích hợp AI viết lại câu từ chuẩn phương pháp STAR.
- **Trắc Nghiệm Hướng Nghiệp Chuẩn Khoa Học:** Bộ công cụ trắc nghiệm MBTI và Đa Trí Tuệ (MI) hoạt động trên thuật toán toán học tất định (Deterministic Logic, không phụ thuộc LLM để chống ảo giác).

### 2.5. Phản Hồi Người Dùng & Báo Cáo Sự Cố (User Feedback & Incident Triage)
- **Nút Nổi Toàn Cục (Floating Feedback Button):** Nút gửi phản hồi và báo lỗi luôn sẵn sàng ở góc màn hình của ứng viên và nhà tuyển dụng.
- **Modal Báo Sự Cố & Góp Ý (`UserFeedbackModal`):** Tự động thu thập bối cảnh trang web (URL hiện tại, loại thiết bị, kích thước màn hình, thông tin người dùng) giúp việc điều tra lỗi chính xác tuyệt đối.
- **Trang Quản Trị Phản Hồi (`/admin/feedback`):** Admin dễ dàng lọc theo phân loại (Báo lỗi, Góp ý tính năng, Đánh giá chất lượng AI), chuyển đổi trạng thái xử lý (Pending $\rightarrow$ In Progress $\rightarrow$ Resolved $\rightarrow$ Closed) và lưu vết audit log.

---

## 🛠️ 3. Sơ Đồ Kiến Trúc & Cấu Trúc Mã Nguồn

Dự án được tổ chức bài bản theo kiến trúc phân lớp sạch sẽ (Clean Architecture), phân định rõ ràng giữa tầng hiển thị, tầng nghiệp vụ và tầng dữ liệu:

```text
ai-job-portal/
├── backend/                              # Python 3.13 + FastAPI RESTful API
│   ├── alembic/                          # 23 Database Migrations (bao gồm pgvector & AI caching)
│   ├── app/
│   │   ├── core/                         # Bảo mật lõi: JWT, PromptArmor, SecretMasker, LLMGuard, RateLimiter
│   │   ├── crud/                         # Tầng truy vấn cơ sở dữ liệu tối ưu (SQLAlchemy ORM + Raw SQL)
│   │   ├── models/                       # Schema ORM: 20+ bảng quan hệ (PostgreSQL + pgvector)
│   │   ├── schemas/                      # Pydantic v2 Models (Validation & Serialization)
│   │   ├── services/                     # Nghiệp vụ: RAG Service, RAG Governance, AI Audit, CV Evaluator...
│   │   └── routers/                      # 18 API Routers (/admin_rag, /ai, /resumes, /applications...)
│   ├── tests/                            # 99+ Unit & Integration Tests (Bảo mật, RAG, AI, RBAC)
│   ├── reset_and_seed_demo.py            # Script nạp dữ liệu mẫu thực tế 100% kèm RAG indexing
│   ├── seed_ai_call_logs.py              # Script mô phỏng 30 ngày lịch sử AI và chi phí token
│   └── entrypoint.sh                     # Script tự động migrate DB và khởi chạy Uvicorn server
├── frontend/                             # React 18.3 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── employer/talent-search/   # CandidateDossierCard, TalentSearchCommandBar, TalentDiscoveryHub
│   │   │   ├── feedback/                 # FloatingFeedbackButton, UserFeedbackModal
│   │   │   ├── layout/                   # AdminLayout, EmployerLayout, CandidateLayout, Navbar, Footer
│   │   │   ├── rag/                      # CVCopilotDrawer, AIDisclaimerBanner
│   │   │   └── ui/                       # Shadcn UI Design System components
│   │   ├── lib/api/                      # Axios clients: adminRAG, rag, adminAI, feedback, resumes...
│   │   ├── pages/
│   │   │   ├── admin/                    # AdminRAGGovernancePage, AdminAILogsPage, AdminFeedbackPage...
│   │   │   │   └── rag/                  # RAGMetricCards, RAGTrendCharts, RAGAlgorithmTuningCard...
│   │   │   ├── candidate/                # CandidateDashboard, CVEditorPage, AssessmentPage, RoadmapPage...
│   │   │   └── employer/                 # EmployerTalentSearch, EmployerDashboard, RecruitmentRequestsPage...
│   │   └── styles/                       # Tailwind CSS v4 + Design Tokens
├── docs/                                 # Báo cáo kiểm toán bảo mật, AI Code Review, Minh chứng AI
├── scripts/
│   ├── export_backup.bat                 # Script tự động xuất bản sao lưu database từ Docker container
│   ├── restore_db.bat                    # Script khôi phục nhanh database
│   └── clean_for_transfer.bat            # Dọn dẹp mã nguồn để đóng gói bàn giao (< 10MB)
└── docker-compose.yml                    # Điều phối 3 Containers: aijob-db, aijob-backend, aijob-frontend
```

---

## 🚀 4. Hướng Dẫn Khởi Chạy Nhanh Bằng Docker (Khuyên Dùng)

### Bước 1: Khởi tạo biến môi trường
Mở Terminal/PowerShell tại thư mục gốc của dự án:
```bash
# Trên Windows
copy .env.example .env

# Trên Linux / macOS
cp .env.example .env
```
Mở tệp `.env` vừa tạo và cập nhật cấu hình API Key:
```env
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
JWT_SECRET=your_super_secret_jwt_key_here
```

### Bước 2: Khởi động hệ thống bằng Docker Compose
```bash
docker compose up -d --build
```
Hệ thống sẽ tự động:
1. Kích hoạt PostgreSQL 17 và nạp extension `pgvector`.
2. Build Backend FastAPI, tự động chạy 23 migrations Alembic và tải mô hình nhúng embedding.
3. Build và phục vụ Frontend trên Web server siêu tốc.

### Bước 3: Nạp dữ liệu mẫu thực tế & Lịch sử AI
Khởi tạo toàn bộ dữ liệu ứng viên, tin tuyển dụng, và tự động tạo chỉ mục RAG:
```bash
# Nạp dữ liệu demo và lập chỉ mục RAG tự động
docker exec aijob-backend python reset_and_seed_demo.py

# Nạp 30 ngày lịch sử gọi AI phục vụ biểu đồ Admin
docker exec aijob-backend python seed_ai_call_logs.py
```

### Bước 4: Truy cập các dịch vụ
| Dịch vụ | URL Truy cập | Chức năng chính |
| :--- | :--- | :--- |
| **Giao Diện Web (SPA)** | [http://localhost:3000](http://localhost:3000) | Toàn bộ giao diện người dùng (Admin, Employer, Candidate) |
| **Tài liệu API (Swagger UI)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Kiểm thử trực quan toàn bộ 18 cụm API RESTful |
| **API Healthcheck** | [http://localhost:8000/healthz](http://localhost:8000/healthz) | Kiểm tra tình trạng sẵn sàng của Backend |
| **PostgreSQL 17 Database** | `localhost:5433` | Cơ sở dữ liệu quan hệ kết hợp pgvector (User: `postgres`) |

---

## 💻 5. Hướng Dẫn Thiết Lập Môi Trường Code Local (Developer Mode)

### 1. Cơ sở dữ liệu (PostgreSQL + pgvector)
Chỉ chạy riêng container Database:
```bash
docker compose up -d aijob-db
```

### 2. Backend (FastAPI + Python 3.13)
```bash
cd backend
python -m venv venv

# Kích hoạt venv (Windows):
.\venv\Scripts\activate
# Kích hoạt venv (Linux/macOS):
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python reset_and_seed_demo.py

uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Giao diện dev server sẽ chạy tại `http://localhost:5173`.

---

## 🔑 6. Danh Sách Tài Khoản Trải Nghiệm (Demo Accounts)

Sau khi chạy lệnh nạp dữ liệu mẫu, bạn có thể đăng nhập ngay với các tài khoản sau:

| Vai trò | Email Đăng Nhập | Mật khẩu chung | Phạm vi quyền hạn & Trải nghiệm |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@jobportal.vn` | `Admin@123456` | Quản trị RAG Governance, xem biểu đồ Token, Kill Switch, kiểm duyệt toàn sàn |
| **HR Director** | `employer@techcorp.vn` | `Employer@123456` | Chủ sở hữu TechCorp, duyệt tuyển dụng, Talent Search ngữ nghĩa, Kanban ATS |
| **Department Head** | `techlead@techcorp.vn` | `TechLead@123456` | Trưởng phòng Kỹ thuật, tạo yêu cầu tuyển dụng, phỏng vấn và chấm điểm ứng viên |
| **Ứng Viên** | `candidate@jobportal.vn` | `Candidate@123456` | Quản lý CV Studio, mở AI CV Copilot Drawer, làm trắc nghiệm MBTI / MI |

---

## 🧪 7. Kiểm Thử & Đảm Bảo Chất Lượng (QA & CI/CD)

Dự án áp dụng quy chuẩn kiểm thử nghiêm ngặt trước mỗi lần commit:

### 1. Backend Automated Tests (99+ Tests — 100% Passed)
```bash
# Chạy bộ test bảo mật và tính năng toàn diện:
docker exec aijob-backend pytest --no-cov \
  tests/test_candidate_security.py \
  tests/test_employer_security.py \
  tests/test_ai_gateway_security.py \
  tests/test_admin_rag.py \
  tests/test_admin_core.py \
  tests/test_admin_ai.py \
  tests/test_admin_rbac.py \
  tests/test_feedback.py \
  tests/test_direct_chat.py \
  tests/test_rag_pipeline.py
```

### 2. Frontend Tests & Build (88+ Tests — 0 Errors)
```bash
cd frontend

# Kiểm tra cú pháp TypeScript & đóng gói production:
npm run build

# Chạy toàn bộ 27 tệp kiểm thử tự động với Vitest:
npm test -- --run
```

### 3. Kiểm tra Mã Nguồn & Định Dạng (Linting)
- **Backend:** `ruff check app tests` (Tuân thủ chuẩn PEP8, loại bỏ biến mơ hồ, quản lý import chặt chẽ).
- **Frontend:** `npm run lint` (ESLint kiểm soát cấu trúc React Hooks và TypeScript strict mode).

---

## 📦 8. Sao Lưu & Đóng Gói Mã Nguồn (Backup & Transfer)

### Xuất bản sao lưu Database:
```bash
# Tự động xuất toàn bộ cấu trúc và dữ liệu ra backup.sql:
scripts\export_backup.bat
```

### Đóng gói mã nguồn bàn giao (< 10 MB):
```bash
# Tự động dọn dẹp node_modules, .venv, dist, __pycache__:
scripts\clean_for_transfer.bat
```

---

## 📄 9. Bản Quyền & Giấy Phép (License)

Dự án được phát triển và phân phối dưới giấy phép **MIT License**. Mọi đóng góp nâng cấp lõi AI, bảo mật và trải nghiệm người dùng đều được hoan nghênh.

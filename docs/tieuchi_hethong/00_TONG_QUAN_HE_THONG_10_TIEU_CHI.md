# BÁO CÁO TỔNG QUAN 10 TIÊU CHÍ KỸ THUẬT PHẦN MỀM
## DỰ ÁN: AI-POWERED JOB PORTAL (NỀN TẢNG TUYỂN DỤNG THÔNG MINH B2B)

> **Mục đích:** Cung cấp hồ sơ dữ kiện kỹ thuật chính xác 100% từ cơ sở mã nguồn thực tế nhằm phục vụ soạn thảo Báo cáo Nghiệm thu, Báo cáo Đồ án cơ sở / Đồ án tốt nghiệp chuyên ngành Kỹ thuật Phần mềm.
> **Phạm vi đánh giá:** Kiến trúc phân tầng, Cơ chế xác thực & Phân quyền, Nghiệp vụ CRUD, Công cụ tìm kiếm & lọc, Báo cáo Dashboard, Thiết kế UI/UX, Quản trị CSDL & Migration, Cơ chế xử lý lỗi, Minh chứng ứng dụng AI khi lập trình và Quy chuẩn quản lý mã nguồn.

---

## I. SƠ ĐỒ USE CASE TỔNG QUAN TOÀN HỆ THỐNG (MASTER USE CASE DIAGRAM)

Hệ thống phục vụ 3 nhóm tác nhân chính: **Ứng viên (Candidate)**, **Nhà tuyển dụng (Employer)** và **Quản trị viên (Admin)** với sự trợ lực xuyên suốt từ **Động cơ Trí tuệ nhân tạo (AI Engine)**:

```mermaid
flowchart LR
    %% Actors
    Candidate(["👤 Ứng viên<br>(Candidate)"])
    Employer(["🏢 Nhà tuyển dụng<br>(Employer)"])
    Admin(["👑 Quản trị viên<br>(Admin)"])
    AIEngine["🤖 AI Engine<br>(DeepSeek V3 / pgvector)"]

    %% Candidate Use Cases
    subgraph UC_Candidate ["Phân hệ Ứng viên"]
        UC_Auth_C["Đăng ký / Đăng nhập<br>(OAuth2 & Google)"]
        UC_CV["Tạo CV Builder /<br>Tải lên PDF"]
        UC_SearchJob["Tìm kiếm & Lọc<br>việc làm đa chiều"]
        UC_Apply["Nộp hồ sơ ứng tuyển<br>(Chống spam duplicate)"]
        UC_TrackStatus["Theo dõi tiến trình<br>ứng tuyển 4 bước"]
        UC_Test["Làm trắc nghiệm tính cách<br>& Xem Lộ trình AI"]
    end

    %% Employer Use Cases
    subgraph UC_Employer ["Phân hệ Nhà tuyển dụng"]
        UC_PostJob["Đăng & Quản lý<br>tin tuyển dụng (CRUD)"]
        UC_Kanban["Quản lý ứng viên<br>trên bảng Kanban"]
        UC_AIMatch["Đối soát AI Matching<br>3 trục & Radar Chart"]
        UC_AIQuestions["Sinh bộ câu hỏi<br>phỏng vấn kỹ thuật"]
        UC_AIEmail["Soạn email mời / từ chối<br>chuẩn văn hóa công ty"]
        UC_Export["Xuất dữ liệu ứng viên<br>báo cáo dạng CSV"]
    end

    %% Admin Use Cases
    subgraph UC_Admin ["Phân hệ Quản trị viên"]
        UC_VerifyEmp["Xét duyệt tài khoản<br>Doanh nghiệp"]
        UC_PromptMgmt["Cấu hình động<br>System Prompts"]
        UC_RAGGov["Giám sát RAG Governance<br>& Độ trễ P95"]
        UC_Audit["Kiểm tra nhật ký<br>kiểm toán (Audit Logs)"]
    end

    %% Connections
    Candidate --> UC_Auth_C
    Candidate --> UC_CV
    Candidate --> UC_SearchJob
    Candidate --> UC_Apply
    Candidate --> UC_TrackStatus
    Candidate --> UC_Test

    Employer --> UC_PostJob
    Employer --> UC_Kanban
    Employer --> UC_AIMatch
    Employer --> UC_AIQuestions
    Employer --> UC_AIEmail
    Employer --> UC_Export

    Admin --> UC_VerifyEmp
    Admin --> UC_PromptMgmt
    Admin --> UC_RAGGov
    Admin --> UC_Audit

    %% AI Integrations
    UC_AIMatch -.-> AIEngine
    UC_AIQuestions -.-> AIEngine
    UC_AIEmail -.-> AIEngine
    UC_Test -.-> AIEngine
    UC_CV -.-> AIEngine
```

---

## II. BẢNG MA TRẬN ĐỐI CHIẾU 10 TIÊU CHÍ KỸ THUẬT

| STT | Tiêu chí đánh giá | Trạng thái | Vị trí mã nguồn / CSDL chính | Minh chứng kỹ thuật then chốt | Mức độ đáp ứng |
| :---: | :---| :---: | :---| :---| :---: |
| **TC01** | **Cấu trúc dự án hợp lý** | ✅ **ĐẠT** | `backend/app/`<br>`frontend/src/`<br>`docker-compose.yml` | Backend phân tầng 4 lớp chuẩn mực (`routers` ➔ `services` ➔ `crud` ➔ `models`/`schemas`). Frontend module hóa (`pages`, `components`, `hooks`, `services`, `types`). Triển khai Docker hóa và CI/CD GitHub Actions. | **100%** |
| **TC02** | **Đăng nhập và phân quyền** | ✅ **ĐẠT** | `backend/app/routers/auth.py`<br>`backend/app/core/security.py`<br>`frontend/src/components/layout/ProtectedRoute.tsx` | Xác thực OAuth2 Password Flow + Google OAuth2, mã hóa mật khẩu Bcrypt, cấp phát JWT Token (HS256). Phân quyền RBAC 4 vai trò (`CANDIDATE`, `EMPLOYER`, `ADMIN`, `SUPERADMIN`). Bảo vệ route đa tầng ở cả API và UI. | **100%** |
| **TC03** | **Hoàn thiện CRUD nghiệp vụ chính** | ✅ **ĐẠT** | `backend/app/routers/jobs.py`<br>`backend/app/routers/applications.py`<br>`backend/app/routers/cv_documents.py` | 4 cụm CRUD hoàn thiện 100%: Tin tuyển dụng (`jobs`), Hồ sơ CV Builder (`cv_documents`), Đơn ứng tuyển (`applications`), Doanh nghiệp (`companies`). Có kiểm soát ràng buộc toàn vẹn và khóa ngoại `CASCADE`/`SET NULL`. | **100%** |
| **TC04** | **Xây dựng tìm kiếm và lọc dữ liệu** | ✅ **ĐẠT** | `backend/app/routers/jobs.py`<br>`backend/app/services/rag_service.py`<br>`frontend/src/pages/jobs/` | Tìm kiếm việc làm Fulltext/Trigram, bộ lọc đa tiêu chí (địa điểm, mức lương, cấp bậc, hình thức). Tìm kiếm ứng viên Hybrid Search (kết hợp từ khóa và Vector Cosine Distance `<=>`). Giao diện Debounced Search 300ms. | **100%** |
| **TC05** | **Xây dựng thống kê / báo cáo** | ✅ **ĐẠT** | `frontend/src/pages/employer/EmployerDashboard.tsx`<br>`frontend/src/pages/admin/AdminDashboardPage.tsx` | Dashboard Nhà tuyển dụng: Thống kê số tin đăng, Kanban counters theo trạng thái tuyển dụng, biểu đồ ứng tuyển theo thời gian. Dashboard Quản trị: Giám sát RAG Governance, P95 latency, phân bố điểm AI bằng Recharts. | **100%** |
| **TC06** | **Thiết kế giao diện rõ ràng, dễ dùng** | ✅ **ĐẠT** | `frontend/src/components/ui/`<br>`frontend/src/pages/employer/` | Thẩm mỹ B2B SaaS hiện đại (TopCV B2B / Stripe), Tailwind CSS + Shadcn UI. Chuẩn hóa 4 trạng thái giao diện (Ideal, Loading Skeleton, Empty State có CTA, Error State). Thông báo phản hồi Toast qua `sonner`. | **100%** |
| **TC07** | **Kết nối & thao tác CSDL ổn định** | ✅ **ĐẠT** | `backend/app/database.py`<br>`backend/alembic/`<br>`backend/seed_demo_data.py` | PostgreSQL 17 kết nối qua SQLAlchemy 2.0 ORM, cấu hình Connection Pooling (`pool_size=10`, `pool_pre_ping=True`). Quản lý di trú CSDL bằng Alembic. Script Seed Data tự động khởi tạo 100+ bản ghi mẫu phục vụ demo. | **100%** |
| **TC08** | **Xử lý lỗi cơ bản & Khả năng phục hồi** | ✅ **ĐẠT** | `backend/app/main.py`<br>`backend/app/services/ai_errors.py`<br>`frontend/src/lib/axios.ts` | Validate dữ liệu chặt chẽ qua Pydantic v2 (trả lỗi 422 chi tiết). Bắt xung đột dữ liệu trả về HTTP 409 Conflict. Axios Interceptor tự động xử lý mã lỗi 401/403/409, giữ nguyên trạng thái biểu mẫu, không làm crash ứng dụng. | **100%** |
| **TC09** | **Minh chứng sử dụng AI khi lập trình** | ✅ **ĐẠT** | `.agents/rules/jobportal.md`<br>`docs/AI_CODE_REVIEW.md`<br>`docs/PROMPT_OPTIMIZATION_LOG.md` | Hồ sơ minh chứng phương pháp Meta-prompting điều phối 3 tác nhân chuyên trách (`@backend_db_agent`, `@frontend_agent`, `@ui_ux_architect`). Có nhật ký prompt, các ca code review, phát hiện race condition và refactor mã nguồn. | **100%** |
| **TC10** | **Quản lý mã nguồn & Tài liệu chạy thử** | ✅ **ĐẠT** | `README.md`<br>`.env.example`<br>`.github/workflows/ci.yml` | Tài liệu README Enterprise chuẩn mực cung cấp sơ đồ kiến trúc, tài khoản demo, hướng dẫn chạy 1-click qua Docker Compose. File `.env.example` chuẩn hóa. Lịch sử Git tuân thủ nghiêm ngặt Conventional Commits. | **100%** |

---

## III. SƠ ĐỒ PHÂN TẦNG KIẾN TRÚC HỆ THỐNG FULLSTACK

```mermaid
flowchart TB
    subgraph Client_Layer ["1. CLIENT TIER (Trình duyệt Web)"]
        UI_SPA["React 18 Single Page Application"]
        UI_Zustand["Global State (Zustand & AuthContext)"]
        UI_Interceptors["Axios Client (Bearer Token & Error Handlers)"]
        UI_Components["Shadcn UI + Tailwind CSS + Recharts"]
        UI_SPA --> UI_Zustand
        UI_SPA --> UI_Interceptors
        UI_SPA --> UI_Components
    end

    subgraph Gateway_Layer ["2. API GATEWAY & SECURITY TIER (FastAPI)"]
        GW_Auth["OAuth2 & JWT Verification"]
        GW_RateLimit["Sliding Window Rate Limiter (20 req/min)"]
        GW_Armor["Prompt Armor & PII Sanitizer"]
        GW_CORS["CORS Middleware & Static Server"]
    end

    subgraph Service_Layer ["3. BUSINESS SERVICE TIER (Logic & AI)"]
        SVC_Matching["AI Matching 3-Axis Rubric Engine"]
        SVC_RAG["RAG Service (Hybrid Search & Retrieval)"]
        SVC_Generators["Email & Interview Question Generators"]
        SVC_Cache["Intelligent Cache SHA-256 & Circuit Breaker"]
    end

    subgraph Data_Layer ["4. DATA ACCESS LAYER (ORM & Repository)"]
        CRUD_Ops["CRUD Classes (Jobs, Resumes, Applications, Users)"]
        SQLA_Engine["SQLAlchemy 2.0 Engine (Connection Pool)"]
        Pydantic_Val["Pydantic v2 Schema Validation"]
    end

    subgraph Persistence_Layer ["5. PERSISTENCE & VECTOR TIER (PostgreSQL 17)"]
        DB_Relational[("Bảng quan hệ<br>(users, companies, jobs, apps)")]
        DB_Vector[("Kho Vector pgvector<br>(document_chunks, MiniLM 384 dim)")]
        DB_Index["Chỉ mục HNSW Cosine Distance (<=>)"]
        DB_Vector --- DB_Index
    end

    subgraph External_AI ["6. EXTERNAL LLM PROVIDER"]
        DeepSeek["DeepSeek V3 API (OpenAI Compatible)"]
    end

    %% Flow connections
    Client_Layer -- "HTTPS / REST JSON" --> Gateway_Layer
    Gateway_Layer --> Service_Layer
    Service_Layer --> Data_Layer
    Data_Layer --> Persistence_Layer
    Service_Layer -- "Async HTTPX (/chat/completions)" --> External_AI
```

---

## IV. MỤC LỤC TRA CỨU CÁC FILE MINH CHỨNG CHI TIẾT

Các tài liệu đối chiếu chi tiết từng tiêu chí được lưu trữ tại thư mục `docs/tieuchi_hethong/`:

1. [TC01: Cấu trúc dự án hợp lý](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC01_CAU_TRUC_DU_AN_HOP_LY.md)
2. [TC02: Xây dựng chức năng đăng nhập và phân quyền](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC02_DANG_NHAP_VA_PHAN_QUYEN.md)
3. [TC03: Hoàn thiện CRUD nghiệp vụ chính](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC03_CRUD_NGHIEP_VU_CHINH.md)
4. [TC04: Xây dựng chức năng tìm kiếm và lọc](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC04_TIM_KIEM_VA_LOC_DU_LIEU.md)
5. [TC05: Xây dựng thống kê / báo cáo cơ bản](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC05_THONG_KE_VA_BAO_CAO.md)
6. [TC06: Thiết kế giao diện rõ ràng, dễ sử dụng](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC06_THIET_KE_GIAO_DIEN_UI_UX.md)
7. [TC07: Kết nối và thao tác CSDL ổn định & Seed Data](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC07_CSDL_KET_NOI_VA_SEED_DATA.md)
8. [TC08: Xử lý lỗi cơ bản và kiểm soát luồng](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC08_XU_LY_LOI_VA_EXCEPTION.md)
9. [TC09: Minh chứng sử dụng AI khi lập trình](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC09_MINH_CHUNG_SU_DUNG_AI_CODE.md)
10. [TC10: Quản lý mã nguồn và tài liệu chạy thử](file:///d:/ai-job-portal/docs/tieuchi_hethong/TC10_QUAN_LY_MA_NGUON_VA_RUNBOOK.md)

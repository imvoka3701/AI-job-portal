# 🚀 AI-Powered Job Portal (Sách Hướng Dẫn & Tài Liệu Kỹ Thuật Toàn Diện)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17_pgvector-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![DeepSeek](https://img.shields.io/badge/AI_Engine-DeepSeek_V3-007ACC.svg?style=flat)](https://platform.deepseek.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=TailwindCSS&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=Docker&logoColor=white)](https://www.docker.com)

---

## 📖 1. Giới Thiệu Tổng Quan

**AI Job Portal** là nền tảng tuyển dụng và hướng nghiệp thế hệ mới được xây dựng theo mô hình **B2B SaaS (Software as a Service) Multi-tenant**. 
Hệ thống kết hợp sức mạnh của **Trí tuệ Nhân tạo (LLM DeepSeek)** và thuật toán tìm kiếm vector **`pgvector`** để tự động hóa, tối ưu hóa quy trình tuyển dụng (ATS), đồng thời định hướng nghề nghiệp chuẩn khoa học cho ứng viên.

Đây là tài liệu hướng dẫn sử dụng và cài đặt chi tiết dành cho Nhà phát triển, Quản trị viên và Người dùng cuối.

---

## ✨ 2. Các Tính Năng Cốt Lõi (Core Features)

### 2.1. Động Cơ Trí Tuệ Nhân Tạo (AI Hybrid Engine)
- **AI Vector Matching (Độ trễ < 15ms):** Sử dụng mô hình Machine Learning cục bộ `paraphrase-multilingual-MiniLM-L12-v2` để nhúng (embed) JD và CV thành các vector 384 chiều. Sau đó lưu trữ và truy vấn bằng khoảng cách Cosine trên cơ sở dữ liệu `pgvector`.
- **Chấm Điểm CV 360 Độ (Radar Chart):** DeepSeek LLM phân tích sâu CV, chấm điểm theo 6 trục kỹ năng (Frontend, Backend, Database, System Design, DevOps, Soft Skills) và đưa ra phân tích Điểm mạnh / Điểm yếu.
- **Trợ Lý Soạn Thư (Bias-Free Email):** AI tự động soạn thảo Thư mời phỏng vấn hoặc Thư từ chối dựa trên bối cảnh, đảm bảo 100% tuân thủ quy tắc trung tính, không thiên lệch giới tính/tuổi tác. Hỗ trợ 1-Click mở tab Gmail Web.

### 2.2. Phân Hệ Quản Lý Tuyển Dụng Doanh Nghiệp (B2B ATS)
- **Kiến Trúc Cô Lập Dữ Liệu (Multi-tenant):** Dữ liệu của từng doanh nghiệp (Company) được tách biệt hoàn toàn. Có cấu trúc quản lý Đội ngũ (HR, Trưởng phòng, Thành viên).
- **Phễu Tuyển Dụng Trực Quan (Kanban ATS):** Kéo thả ứng viên qua các vòng: Chờ duyệt $\rightarrow$ Lọc CV $\rightarrow$ Phỏng vấn $\rightarrow$ Đề xuất $\rightarrow$ Chấp nhận/Từ chối.
- **Quy Trình Duyệt Nhân Sự Đa Tầng:** Trưởng bộ phận lập Phiếu Yêu Cầu Tuyển Dụng (Recruitment Request) $\rightarrow$ Giám đốc/HR duyệt $\rightarrow$ Hệ thống tự động chuyển đổi thành Tin Tuyển Dụng (Job Posting).
- **Chấm Điểm Phỏng Vấn (Criteria Scoring):** Trưởng phòng thiết lập tiêu chí và chấm điểm trực tiếp tại từng vòng phỏng vấn.

### 2.3. Phân Hệ Trải Nghiệm Ứng Viên (Candidate Experience)
- **CV Builder Studio:** Công cụ tạo CV trực tuyến chia đôi màn hình, cấu trúc dữ liệu JSON cấp độ cao. Tích hợp AI sửa câu từ chuẩn phương pháp STAR.
- **Động Cơ Trắc Nghiệm Tâm Lý (Deterministic Logic):** Cung cấp bộ test MBTI và Đa Trí Tuệ (MI) dựa trên thuật toán tính điểm toán học (không dùng LLM để tránh ảo giác).
- **Lộ Trình Nghề Nghiệp (Career Roadmap):** Sinh lộ trình phát triển chi tiết cho ứng viên sau khi đánh giá kết quả trắc nghiệm và lịch sử nộp đơn.

### 2.4. Phân Hệ Quản Trị Hệ Thống (Admin Oversight)
- **Audit Logs Zero-PII:** Lưu vết 100% hành động của người dùng (Action, Target) nhưng được mã hóa và lọc bỏ dữ liệu định danh cá nhân nhạy cảm.
- **Quản Trị AI Prompts:** Admin có quyền thay đổi linh hoạt các System Prompt (nhắc lệnh hệ thống) của AI mà không cần khởi động lại server.

---

## 🛠️ 3. Kiến Trúc Kỹ Thuật (Architecture)

Hệ thống được thiết kế nguyên khối (Monolith) cho phần Backend API nhưng sẵn sàng chuyển đổi Microservices, và kiến trúc SPA cho Frontend.

```text
ai-job-portal/
├── backend/                  # Python 3.13 + FastAPI
│   ├── app/
│   │   ├── core/             # Cấu hình lõi (DB, JWT Security, RBAC)
│   │   ├── models/           # ORM: 20 bảng cơ sở dữ liệu (PostgreSQL)
│   │   ├── schemas/          # Pydantic v2 (Data Validation)
│   │   ├── services/         # Logic tầng nghiệp vụ (AI LLM, Vector, Scoring, Emails)
│   │   └── routers/          # 17 Routers API (/auth, /jobs, /applications...)
│   └── alembic/              # Quản lý version Database Migrations
├── frontend/                 # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── api/              # Axios Client + Interceptors (Auto catch 401)
│   │   ├── pages/            # View theo Role: Admin, Candidate, Employer, Tools, AI
│   │   ├── store/            # Zustand Store (Lưu trữ trạng thái toàn cục)
│   │   └── styles/           # Tailwind CSS v4 + Shadcn UI Design Tokens
└── docker-compose.yml        # Orchestration cho Database, Backend, Frontend
```

---

## 🚀 4. Hướng Dẫn Khởi Chạy Nhanh Bằng Docker (Khuyên Dùng)

Bạn có thể đưa toàn bộ hệ thống lên hoạt động chỉ trong vài phút với Docker Compose.

### Bước 1: Khởi tạo biến môi trường
Mở Terminal/Command Prompt tại thư mục gốc dự án:
```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```
Mở tệp `.env` vừa tạo và điền khóa `DEEPSEEK_API_KEY` (Bắt buộc để sử dụng AI chấm điểm CV và sinh nội dung).

### Bước 2: Kích hoạt Hệ Thống
```bash
docker compose up -d --build
```
Quá trình này sẽ tải Image PostgreSQL 17 + pgvector, build Backend, tải Model AI nhúng vào RAM, và build giao diện Frontend tĩnh.

### Bước 3: Nạp Dữ Liệu Mẫu (Khôi phục Database)
Dự án đã có sẵn file `backup.sql` chứa cấu trúc 20 bảng và hàng ngàn record dữ liệu mẫu.
- **Windows:** Chạy script `scripts\restore_db.bat`
- **Linux/macOS:** Chạy script `./scripts/restore_db.sh`

*(Hoặc dùng lệnh thuần: `docker exec -i aijob-db psql -U postgres -d ai_job_portal < backup.sql`)*

### Bước 4: Trải nghiệm Hệ Thống
| Dịch vụ | URL Truy cập | Ghi chú |
| :--- | :--- | :--- |
| **Giao diện Web** | [http://localhost:3000](http://localhost:3000) | Dành cho tất cả người dùng |
| **Tài liệu API (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Nơi kiểm thử API trực tiếp |
| **API Healthcheck** | [http://localhost:8000/healthz](http://localhost:8000/healthz) | Kiểm tra trạng thái Backend |
| **Database** | `localhost:5433` | Port PostgreSQL (User: `postgres`) |

---

## 💻 5. Hướng Dẫn Cài Đặt Môi Trường Code Local (Dành Cho Developer)

Nếu bạn muốn chỉnh sửa code (Development Mode):

### 1. Database (PostgreSQL + pgvector)
Chỉ chạy Database qua Docker:
```bash
docker run -d --name aijob-db -p 5433:5432 \
  -e POSTGRES_DB=ai_job_portal -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  pgvector/pgvector:pg17
```

### 2. Backend (FastAPI)
Yêu cầu: `Python 3.13+`
```bash
cd backend
python -m venv venv

# Kích hoạt venv (Windows):
.\venv\Scripts\activate
# Kích hoạt venv (Mac/Linux):
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head         # Chạy migration tạo 20 bảng
python -m app.seed           # (Tuỳ chọn) Nạp dữ liệu mẫu bằng code Python

uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (React)
Yêu cầu: `Node.js 18+`
```bash
cd frontend
npm install
npm run dev
```
Truy cập Frontend Dev Server tại: `http://localhost:5173`.

---

## 📖 6. Hướng Dẫn Sử Dụng Chi Tiết Theo Vai Trò

### 👤 Vai Trò Ứng Viên (Candidate)
1. **Tìm việc:** Truy cập Trang chủ $\rightarrow$ Gõ từ khóa $\rightarrow$ Hệ thống tự tìm kiếm bằng Semantic Search.
2. **Soạn CV:** Truy cập mục **Hồ Sơ (CV Builder)** $\rightarrow$ Dùng thanh công cụ AI bên phải để được viết lại câu văn (Rewrite) theo chuẩn STAR. Nhấn "Lưu Template".
3. **Đánh Giá AI:** Khi nhấn "Nộp Hồ Sơ", hệ thống tức thì trả về **Điểm Phù Hợp (AI Matching Score %)** để bạn biết xác suất đỗ.
4. **Định Hướng:** Vào phần **Công cụ Trắc nghiệm**, làm bài Test MBTI để nhận Roadmap tương lai.

### 🏢 Vai Trò Nhà Tuyển Dụng (Employer / HR)
1. **Quản lý Ứng viên:** Vào **Bảng Điều Khiển (Employer Dashboard)** $\rightarrow$ Mở tab ATS Kanban. Tại đây bạn kéo thả ứng viên qua các giai đoạn.
2. **AI Đọc CV:** Click vào 1 ứng viên, chọn **Quét CV bằng AI**. Đợi 10s, AI sẽ vẽ biểu đồ Radar 6 trục kỹ năng và liệt kê ưu/nhược điểm.
3. **Soạn Thư Tự Động:** Tại hồ sơ ứng viên, bấm nút "Soạn Email" $\rightarrow$ Chọn loại Thư Mời / Thư Từ Chối $\rightarrow$ Bấm "Tạo bằng AI" $\rightarrow$ Bấm "Mở bằng Gmail" (Liên kết sẽ nhúng nội dung thẳng vào tab Gmail của bạn).
4. **Phân quyền:** Vào **Đội ngũ (Team)** để gửi link mời Trưởng bộ phận tham gia chấm điểm phỏng vấn.

### 🛡️ Vai Trò Quản Trị Viên (Admin)
1. **Dashboard:** Xem thống kê doanh thu, số lượng tin tuyển dụng, và cảnh báo hệ thống.
2. **Giám Sát AI:** Truy cập tab **AI Logs** để kiểm tra lịch sử gọi DeepSeek (số lượng Token đã tiêu thụ, chi phí, mã lỗi API nếu có).
3. **Tinh chỉnh Prompt:** Truy cập **AI Prompts** để cấu hình lại các System Prompt (VD: Đổi văn phong viết Email của AI) mà không cần can thiệp mã nguồn.

---

## 🔑 7. Tài Khoản Trải Nghiệm Có Sẵn (Demo Accounts)

Sau khi khôi phục `backup.sql`, bạn có thể đăng nhập ngay với các tài khoản sau:

| Vai trò | Email Đăng Nhập | Mật khẩu chung | Mô tả quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên** | `admin@jobportal.vn` | `Admin@123456` | Duyệt công ty, Quản lý toàn sàn, Đổi Prompt |
| **Giám Đốc Nhân Sự** | `employer@techcorp.vn` | `Employer@123456` | Owner của TechCorp, Quản lý Tin, Phễu ATS, Email AI |
| **Trưởng Bộ Phận** | `techlead@techcorp.vn` | `TechLead@123456` | Chỉ được xem ứng viên phòng Engineering, Chấm điểm |
| **Ứng Viên** | `candidate@jobportal.vn` | `Candidate@123456` | Nộp hồ sơ, Làm bài test, Quản lý CV Builder |

---

## 🧪 8. Chạy Kiểm Thử Hệ Thống (Testing)

Dự án có bộ test suite đồ sộ đảm bảo tính ổn định tuyệt đối:

- **Backend Pytest (145+ Bài test tự động)**:
  ```bash
  cd backend
  pytest -v --cov=app
  ```
- **Frontend Vitest & Typecheck**:
  ```bash
  cd frontend
  npm run typecheck
  npm test
  ```

---

## 📦 9. Quy Trình Bàn Giao & Đóng Gói (Transferring)
Nếu bạn cần nén file `.zip` để chia sẻ source code cho người khác:
Hãy chạy tệp tiện ích:
- **Windows:** `scripts\clean_for_transfer.bat`
- **Linux/Mac:** `./scripts/clean_for_transfer.sh`

Lệnh này sẽ tự động xóa sạch các thư mục rác cực nặng như `node_modules`, `venv`, `__pycache__` giúp dung lượng project giảm từ **1.5 GB xuống còn chưa tới 10 MB**. 
Người nhận chỉ cần giải nén và làm theo Bước 4 (Docker Compose) để máy tự động cài lại môi trường.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được phân phối dưới giấy phép **MIT License**. Mọi đóng góp (Pull Request) để nâng cấp lõi AI đều được hoan nghênh.

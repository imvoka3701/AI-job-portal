# 🚀 AI-Powered Job Portal (Hệ Thống Tuyển Dụng & Hướng Nghiệp Thông Minh)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17_pgvector-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![DeepSeek](https://img.shields.io/badge/AI_Engine-DeepSeek_V3-007ACC.svg?style=flat)](https://platform.deepseek.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=TailwindCSS&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=Docker&logoColor=white)](https://www.docker.com)

---

## 📖 Giới Thiệu Tổng Quan

**AI Job Portal** là nền tảng tuyển dụng và hướng nghiệp thế hệ mới theo mô hình B2B SaaS hiện đại, kết hợp sức mạnh của **Trí tuệ Nhân tạo (LLM DeepSeek + Vector Search `pgvector`)** để kết nối chuẩn xác giữa ứng viên và nhà tuyển dụng, tối ưu hóa toàn diện quy trình tuyển dụng (ATS) và định hướng nghề nghiệp theo chuẩn khoa học.

---

## ✨ Các Tính Năng Nổi Bật

### 1. 🤖 Hệ Thống AI Đánh Giá & Matching Đa Tầng
- **AI Matching Vector 3 Lớp**: Sử dụng mô hình `paraphrase-multilingual-MiniLM-L12-v2` tạo vector 384 chiều, tìm kiếm độ tương đồng Cosine (`<=>`) trên PostgreSQL `pgvector` với tốc độ mili-giây.
- **DeepSeek LLM Evaluation**: Chấm điểm chi tiết 4 tiêu chí (Kỹ năng chuyên môn, Kinh nghiệm, Học vấn, Mức độ phù hợp tổng thể) kèm biểu đồ Radar Chart và phân tích điểm mạnh/điểm yếu.
- **Roadmap Suggester**: Tự động gợi ý lộ trình học tập, chứng chỉ và kỹ năng cần cải thiện để nâng cao điểm match.

### 2. 📄 CV Builder & Phân Tích ATS
- **5 Mẫu CV Quốc Tế**: Modern, Creative, Executive, Minimalist, Tech Pro.
- **Tính năng cao cấp**: Tự động lưu bản nháp, xuất PDF chất lượng cao, AI chẩn đoán lỗi và gợi ý từ khóa chuẩn ATS.

### 3. 🧠 Bộ Công Cụ Trắc Nghiệm Tâm Lý & Hướng Nghiệp
- **Trắc nghiệm MBTI (40 câu hỏi)**: Phân loại 16 nhóm tính cách, văn hóa doanh nghiệp phù hợp và gợi ý nhóm ngành.
- **Trắc nghiệm Đa trí tuệ MI (40 câu hỏi)**: Phân tích 8 loại hình thông minh (Howard Gardner) và xếp hạng thế mạnh vượt trội.
- **Lịch sử bài test & Chia sẻ kết quả**: Lưu trữ toàn bộ kết quả để ứng viên theo dõi sự phát triển bản thân.

### 4. 💼 Hệ Thống Tuyển Dụng Doanh Nghiệp (B2B ATS)
- **Phân Quyền 5 Cấp Độ**: `Owner`, `HR Manager`, `Department Head`, `Interviewer`, `Viewer`.
- **Quy trình Phê duyệt Tuyển dụng**: Trưởng bộ phận gửi đề xuất $\rightarrow$ HR duyệt $\rightarrow$ Tạo tin tuyển dụng.
- **Quản lý Ứng viên Đa luồng**: Bộ lọc ứng viên theo vòng, AI score, gán nhãn, ghi chú nội bộ và nhật ký hoạt động (Audit Trail).
- **Trợ Lý Soạn Thảo**: Tự động viết JD chuẩn SEO và tạo bản nháp email phỏng vấn/thư từ chối lịch thiệp.

### 5. 🔮 JobPortal AI Advisor (Cố Vấn Khách Hàng 24/7)
- **Nhà Ngoại Giao Số**: Nhận diện ngữ cảnh và tư vấn chuyên sâu cho cả 3 tệp khách hàng (*Ứng viên, Doanh nghiệp, Khách vãng lai*).
- **Thẻ Tương Tác 1-Click**: Tự động nhúng thẻ việc làm, thẻ công cụ trắc nghiệm và gợi ý câu hỏi tiếp theo.
- **Giao diện Trắng Sáng Hiện Đại**: Tích hợp thanh sóng âm Neural Waveform, nút nghe đọc (TTS) và sao chép câu trả lời.

### 6. 🛡️ Bảng Điều Khiển Quản Trị Hệ Thống (Admin Oversight)
- Giám sát toàn diện người dùng, tin tuyển dụng, bài viết và doanh thu.
- **Live AI Monitor**: Theo dõi tình trạng kết nối LLM, thống kê thời gian phản hồi, số lượt gọi API và cấu hình nghiệp vụ.

---

## 🛠️ Kiến Trúc Công Nghệ

```
ai-job-portal/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── core/             # Auth, JWT, Dependencies, Database Session
│   │   ├── models/           # SQLAlchemy ORM Models (pgvector)
│   │   ├── schemas/          # Pydantic Schemas & Request/Response Validation
│   │   ├── services/         # Business Logic, AI Matching, DeepSeek LLM, ATS
│   │   └── routers/          # RESTful Endpoints (/auth, /jobs, /ai, /employer, /admin...)
│   └── tests/                # Pytest Test Suite (108+ tests)
├── frontend/                 # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── components/       # UI Components, AI Assistant, Layout, Navigation
│   │   ├── pages/            # Candidate, Employer, Admin, Tools, Jobs Pages
│   │   ├── stores/           # Zustand Global State Management
│   │   └── lib/              # API Axios Client & Utilities
│   └── tests/                # Vitest Test Suite (43+ tests)
└── docker-compose.yml        # Multi-Container Orchestration (DB, Backend, Frontend)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Cách 1: Khởi Chạy Nhanh Bằng Docker Compose (Khuyên Dùng)

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-username/ai-job-portal.git
   cd ai-job-portal
   ```

2. **Cấu hình biến môi trường**:
   ```bash
   cp .env.example .env
   # Mở tệp .env và điền DEEPSEEK_API_KEY của bạn
   ```

3. **Khởi chạy hệ thống**:
   ```bash
   docker compose up --build
   ```

4. **Truy cập ứng dụng**:
   - **Frontend Web**: [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database**: `localhost:5433`

---

### Cách 2: Chạy Môi Trường Local Development

#### 1. Khởi chạy CSDL PostgreSQL (với pgvector)
```bash
docker run -d --name aijob-db -p 5433:5432 \
  -e POSTGRES_DB=ai_job_portal \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  pgvector/pgvector:pg17
```

#### 2. Cài đặt & Chạy Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed.py               # Nạp dữ liệu mẫu
uvicorn app.main:app --reload --port 8000
```

#### 3. Cài đặt & Chạy Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại: `http://localhost:5173`.

---

## 🧪 Chạy Kiểm Thử (Testing)

- **Backend Pytest (108 tests)**:
  ```bash
  cd backend
  pytest -v
  ```

- **Frontend Vitest (43 tests)**:
  ```bash
  cd frontend
  npm test
  ```

- **TypeScript Typecheck**:
  ```bash
  cd frontend
  npx tsc -b --noEmit
  ```

---

## 🔑 Tài Khoản Mẫu Trải Nghiệm (Demo Accounts)

| Vai trò | Email | Mật khẩu mặc định |
|---|---|---|
| **Quản trị viên (Admin)** | `admin@jobportal.vn` | `Admin@123456` |
| **Nhà tuyển dụng (Employer)** | `employer@techcorp.vn` | `Employer@123456` |
| **Ứng viên (Candidate)** | `candidate@jobportal.vn` | `Candidate@123456` |

---

## 📄 Bản Quyền & Giấy Phép

Dự án được phân phối dưới giấy phép **MIT License**. Mọi đóng góp và cải tiến đều được hoan nghênh.

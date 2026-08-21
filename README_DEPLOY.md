# 🚀 Hướng Dẫn Triển Khai & Bàn Giao Dự Án AI Job Portal (Docker)

Tài liệu này cung cấp hướng dẫn từng bước để cài đặt và chạy toàn bộ hệ thống **AI-Powered Job Portal** trên máy mới chỉ bằng **1–2 câu lệnh Docker Compose**.

---

## 📋 1. Yêu Cầu Hệ Thống (Prerequisites)

- **Docker Desktop** (Windows/macOS) hoặc **Docker Engine & Docker Compose** (Linux).
- RAM trống tối thiểu: **4 GB** (khuyến nghị 8 GB để tải model AI embedding mượt mà).
- Dung lượng ổ đĩa trống: **5 GB**.

---

## ⚡ 2. Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### **Bước 1: Chuẩn bị file cấu hình môi trường**
Tạo file `.env` từ file mẫu `.env.example`:

**Trên Windows (Command Prompt / PowerShell):**
```cmd
copy .env.example .env
```

**Trên Linux / macOS / Git Bash:**
```bash
cp .env.example .env
```

> 💡 **Cấu hình AI (Khuyến nghị):**
> Mở file `.env` vừa tạo và điền `DEEPSEEK_API_KEY` của bạn để sử dụng đầy đủ các tính năng AI (chấm điểm CV, phân tích khớp lệnh, gợi ý phỏng vấn).

---

### **Bước 2: Khởi động toàn bộ hệ thống với Docker**
Chạy lệnh sau tại thư mục gốc của dự án:

```bash
docker compose up -d --build
```

Hệ thống sẽ tự động:
1. Tải image PostgreSQL 17 và kích hoạt extension `pgvector`.
2. Build Backend FastAPI, tải sẵn model AI embedding (`paraphrase-multilingual-MiniLM-L12-v2`).
3. Tự động chạy Database Migrations (Alembic) và khởi tạo tài khoản mẫu.
4. Build Frontend React TypeScript và phục vụ qua Web Server Nginx tối ưu.

---

## 🗄️ 3. Khôi Phục Dữ Liệu CSDL (Database Restore)

Dự án đã đính kèm sẵn file sao lưu đầy đủ `backup.sql`. Bạn có thể nạp lại dữ liệu bằng 1 trong 2 cách:

### **Cách 1: Sử dụng script tự động có sẵn**
- **Trên Windows:** Chạy file `scripts\restore_db.bat` hoặc gõ:
  ```cmd
  scripts\restore_db.bat
  ```
- **Trên Linux / macOS:** Chạy file `scripts/restore_db.sh`:
  ```bash
  chmod +x scripts/*.sh
  ./scripts/restore_db.sh
  ```

### **Cách 2: Sử dụng lệnh Docker trực tiếp**
```bash
docker exec -i aijob-db psql -U postgres -d ai_job_portal < backup.sql
```

---

## 🌐 4. Địa Chỉ Truy Cập Dịch Vụ

| Dịch vụ | Địa chỉ URL | Ghi chú |
| :--- | :--- | :--- |
| **Giao diện Web (Frontend)** | [http://localhost:3000](http://localhost:3000) | Giao diện Ứng viên & Nhà tuyển dụng |
| **API Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Tài liệu kiểm thử API tương tác |
| **API ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Tài liệu API chi tiết |
| **API Healthcheck** | [http://localhost:8000/healthz](http://localhost:8000/healthz) | Kiểm tra trạng thái Backend |
| **PostgreSQL Database** | `localhost:5433` | User: `postgres`, DB: `ai_job_portal` |

---

## 🔑 5. Danh Sách Tài Khoản Dùng Thử (Demo Accounts)

Hệ thống đã chuẩn bị sẵn các tài khoản demo tương ứng với các vai trò:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Quyền hạn |
| :--- | :--- | :--- | :--- |
| 🛡️ **Quản trị viên (Admin)** | `admin@aijobportal.vn` | `admin123456` | Toàn quyền quản trị hệ thống, duyệt công ty |
| 🏢 **Nhà tuyển dụng (Employer 1)** | `employer@fpt.com` | `employer123456` | Quản lý tin tuyển dụng, xem CV AI match |
| 🏢 **Nhà tuyển dụng (Employer 2)** | `recruiter@vng.com.vn` | `recruiter123456` | Quản lý vòng phỏng vấn, chấm điểm ứng viên |
| 👤 **Ứng viên (Candidate 1)** | `candidate@gmail.com` | `candidate123456` | Tạo CV, phân tích CV với AI, nộp hồ sơ |
| 👤 **Ứng viên (Candidate 2)** | `nguyenvana@gmail.com` | `candidate123456` | Hồ sơ Senior Frontend Engineer |

---

## 🛠️ 6. Các Lệnh Quản Trị & Script Tiện Ích

### **Sao lưu dữ liệu CSDL hiện tại ra `backup.sql`:**
- **Windows:** `scripts\export_db.bat`
- **Linux/macOS:** `./scripts/export_db.sh`

### **Xem log hệ thống khi đang chạy:**
```bash
# Xem log Backend FastAPI:
docker compose logs -f backend

# Xem log Database:
docker compose logs -f db

# Xem log Frontend Nginx:
docker compose logs -f frontend
```

### **Dừng hoặc khởi động lại hệ thống:**
```bash
# Dừng hệ thống:
docker compose down

# Dừng và xóa toàn bộ dữ liệu volume (làm mới từ đầu):
docker compose down -v

# Khởi động lại:
docker compose restart
```

---

## 📦 7. Hướng Dẫn Đóng Gói Dự Án Trước Khi Chuyển Giao

Trước khi nén `.zip` gửi cho người khác, bạn nên dọn dẹp các thư mục rác và dependencies nặng (`node_modules`, `venv`, `__pycache__`...) để giảm dung lượng file nén từ hàng GB xuống chỉ còn vài MB:

### **Cách 1: Chạy script dọn dẹp tự động**
- **Windows:** Chạy file `scripts\clean_for_transfer.bat`
- **Linux/macOS:** Chạy file `./scripts/clean_for_transfer.sh`

### **Danh sách file/thư mục KHÔNG nén gửi:**
- ❌ `frontend/node_modules/` (Docker sẽ tự cài đặt khi build)
- ❌ `.venv/`, `venv/`, `backend/venv/`
- ❌ `__pycache__/`, `*.pyc`
- ❌ `dist/`, `frontend/dist/`
- ❌ `test-results/`, `playwright-report/`
- ❌ `.env` (chỉ gửi `.env.example` để bảo mật thông tin cá nhân)

### **Các file BẮT BUỘC có khi chuyển giao:**
- ✅ Toàn bộ thư mục `backend/` và `frontend/` (mã nguồn)
- ✅ `docker-compose.yml`
- ✅ `.env.example`
- ✅ `backup.sql` (dữ liệu CSDL đã export)
- ✅ Thư mục `scripts/`
- ✅ `README_DEPLOY.md`

---

## ❓ 8. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### **1. Xung đột cổng (Port already in use):**
- Nếu cổng `3000`, `8000` hoặc `5433` bị trùng với ứng dụng khác trên máy:
  Mở file `docker-compose.yml`, sửa phần mapping cổng bên trái:
  - `ports: - "3001:80"` (Frontend)
  - `ports: - "8001:8000"` (Backend)
  - `ports: - "5434:5432"` (Database)

### **2. Lỗi line endings CRLF trên Linux/WSL (`entrypoint.sh: line 2: $'\r': command not found`):**
- Chạy lệnh chuyển định dạng LF cho file script:
  ```bash
  sed -i 's/\r$//' backend/entrypoint.sh
  sed -i 's/\r$//' scripts/*.sh
  ```

### **3. Dịch vụ AI báo lỗi hoặc không phản hồi:**
- Kiểm tra xem bạn đã điền `DEEPSEEK_API_KEY` hợp lệ trong file `.env` chưa.
- Khởi động lại container backend sau khi cập nhật key: `docker compose restart backend`.

# HƯỚNG DẪN KỊCH BẢN THUYẾT TRÌNH & DEMO TRÊN GIẢNG ĐƯỜNG
**Đồ án: Nền Tảng Tuyển Dụng Thông Minh Tích Hợp AI (AI-Powered Job Portal)**

---

## ⚡ BƯỚC 0: CHUẨN BỊ TRƯỚC KHI THUYẾT TRÌNH (1 LỆNH DUY NHẤT)

Trước khi bắt đầu buổi báo cáo, hãy mở Terminal và chạy lệnh sau để làm sạch 100% dữ liệu rác/thử nghiệm cũ và nạp bộ dữ liệu mẫu chân thực nhất:

```bash
cd backend
python reset_and_seed_demo.py
```
*(Chỉ mất 2 giây, toàn bộ database sẽ được đưa về trạng thái hoàn hảo).*

---

## 🔑 DANH SÁCH 4 TÀI KHOẢN DEMO CHÍNH

Tất cả tài khoản đều sử dụng cấu trúc mật khẩu đồng nhất, dễ nhớ:

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích trình diễn |
| :--- | :--- | :--- | :--- |
| **1. Quản trị viên (Admin)** | `admin@jobportal.vn` | `Admin@123456` | Giám sát toàn sàn, Analytics, Audit Trail, Kiểm duyệt |
| **2. Nhà tuyển dụng (HR / Owner)** | `employer@techcorp.vn` | `Employer@123456` | Tuyển dụng TechCorp VN, Phễu ứng viên, AI Matching, Radar Chart, Sinh Email |
| **3. Trưởng bộ phận (Tech Lead)** | `techlead@techcorp.vn` | `TechLead@123456` | Phân quyền phòng ban, Đánh giá chuyên môn, Đề xuất nhu cầu tuyển dụng |
| **4. Ứng viên (Candidate)** | `candidate@jobportal.vn` | `Candidate@123456` | Dashboard ứng viên, Radar kỹ năng, CV Builder, Lộ trình AI Roadmap |

---

## 🎬 KỊCH BẢN TRÌNH DIỄN TỪNG BƯỚC (7 - 10 PHÚT)

### 📌 Phần 1: Mở Đầu & Giới Thiệu Tổng Quan (~1 Phút)
- **Màn hình:** Mở Trang chủ Landing Page (`http://localhost:5173`).
- **Lời thuyết trình:**
  > *"Kính thưa Thầy/Cô và Hội đồng, hôm nay em xin phép trình bày đồ án **Nền tảng Tuyển dụng Thông minh tích hợp Trí tuệ Nhân tạo (AI-Powered Job Portal)**. Hệ thống mang phong cách B2B SaaS hiện đại, kết hợp React 19 / TypeScript ở Frontend cùng Python FastAPI và PostgreSQL/pgvector ở Backend. Đồ án tập trung giải quyết 3 bài toán lớn: (1) Sàng lọc và Matching ứng viên tự động bằng Vector Embeddings; (2) Trực quan hóa so sánh kỹ năng ứng viên với JD qua Radar Chart; (3) Tự động hóa tác vụ nhân sự bằng AI không thiên lệch."*

---

### 📌 Phần 2: Luồng Trải Nghiệm Ứng Viên — Candidate Experience (~2 Phút)
- **Đăng nhập:** `candidate@jobportal.vn` / `Candidate@123456`.
- **Thao tác & Lời thuyết trình:**
  1. **Candidate Dashboard:**
     > *"Tại Dashboard ứng viên, hệ thống hiển thị **Radar Chart Phân tích Kỹ năng** dựa trên CV của ứng viên (React, TypeScript, FastAPI, Tailwind CSS, PostgreSQL, Docker). Ngoài ra, ứng viên nhận được thông báo về **Lịch phỏng vấn sắp tới** ngay trên đầu trang."*
  2. **Tìm việc & AI Matching:**
     - Vào menu **Việc làm**, mở tin *Senior Fullstack Engineer (React 19 & Python FastAPI)*.
     > *"Khi xem chi tiết JD, hệ thống sử dụng thuật toán Cosine Similarity để tính điểm **AI Matching Score** tức thời (94.5%) cùng nhận xét điểm mạnh phù hợp."*
  3. **Trình tạo CV (CV Builder):**
     - Mở trang **CV Builder**, cho Hội đồng xem bản CV mẫu đã được tạo theo chuẩn ATS.
  4. **Lộ trình phát triển sự nghiệp (AI Roadmap):**
     - Mở trang **AI Roadmap** để giới thiệu khả năng gợi ý khóa học và kỹ năng cần bổ sung.

---

### 📌 Phần 3: Luồng Nhà Tuyển Dụng & Quản Trị Nhân Sự HR (~3 Phút)
- **Đăng nhập:** Mở tab ẩn danh hoặc đăng xuất, đăng nhập `employer@techcorp.vn` / `Employer@123456`.
- **Thao tác & Lời thuyết trình:**
  1. **Bảng điều khiển Tuyển dụng (Employer Dashboard):**
     > *"Tại Dashboard nhà tuyển dụng tập đoàn **TechCorp Vietnam**, HR có thể theo dõi tỷ lệ chuyển đổi qua các giai đoạn trong phễu tuyển dụng (Mới nộp → Đã duyệt → Phỏng vấn → Trúng tuyển)."*
  2. **Quản lý Tin tuyển dụng (`/employer/jobs`):**
     - Mở trang Quản lý tin, demo thanh tìm kiếm thời gian thực, bộ lọc trạng thái.
     - Bấm nút **Sửa tin** để mở Modal chỉnh sửa tin trực tiếp.
     - Bấm chuyển đổi trạng thái nhanh **Tạm đóng / Mở lại**.
  3. **Quản lý Ứng viên & Radar Chart So sánh Kỹ năng:**
     - Vào danh sách ứng viên của tin *Senior Fullstack Engineer*.
     - Chỉ cho Hội đồng thấy danh sách tự động sắp xếp theo **AI Matching Score** cao nhất xuống thấp.
     - Mở hồ sơ ứng viên *Nguyễn Văn An*, bấm xem **Radar Chart So sánh Kỹ năng Ứng viên vs Yêu cầu JD** (so sánh trực quan năng lực ứng viên so với chuẩn đầu vào của công ty).
  4. **AI Sinh Email Tự Động (AI Email Generator):**
     - Bấm **Soạn Email bằng AI**:
       * *Mời phỏng vấn:* Tự điền placeholder ngày giờ, địa điểm.
       * *Từ chối lịch sự:* Tự sinh nội dung khéo léo, tuân thủ nguyên tắc không thiên lệch (Bias-free AI).
  5. **Quy trình Phỏng vấn & Chấm điểm tiêu chí:**
     - Cho thấy vòng phỏng vấn kỹ thuật và bảng chấm điểm theo tiêu chí: Kiến trúc hệ thống (9/10), React/TypeScript (9/10), Backend/Database (8/10).
  6. **Cài đặt Doanh nghiệp (`/employer/settings`):**
     - Cho xem thông tin pháp nhân công ty, cấu hình ngưỡng điểm AI Fast-track và Quản lý API Key.

---

### 📌 Phần 4: Luồng Phối Hợp Trưởng Bộ Phận — Team Collaboration (~1.5 Phút)
- **Đăng nhập:** `techlead@techcorp.vn` / `TechLead@123456`.
- **Thao tác & Lời thuyết trình:**
  1. **Phân quyền theo phòng ban (Department Scope):**
     > *"Trưởng bộ phận Kỹ thuật chỉ nhìn thấy và quản trị các tin tuyển dụng và hồ sơ thuộc **Phòng Kỹ thuật & Công nghệ (Engineering)**."*
  2. **Gửi Đánh giá & Đề xuất (Hiring Recommendation):**
     - Mở hồ sơ ứng viên, nhập nhận xét kỹ thuật và chọn trạng thái **Đề xuất tuyển dụng (Recommended)**.
  3. **Yêu cầu Nhu cầu Tuyển dụng (Recruitment Request):**
     - Trình diễn phiếu yêu cầu *'Tuyển dụng 2 Kỹ sư Backend (Python/FastAPI)'* đã được gửi lên ban giám đốc và HR phê duyệt.

---

### 📌 Phần 5: Luồng Quản Trị Hệ Thống — Admin Oversight (~1.5 Phút)
- **Đăng nhập:** `admin@jobportal.vn` / `Admin@123456`.
- **Thao tác & Lời thuyết trình:**
  1. **Admin Analytics Dashboard:** Xem biểu đồ tổng quan sàn tuyển dụng, tỷ lệ nguồn ứng viên, thời gian tuyển dụng trung bình.
  2. **Quản trị Người dùng & Doanh nghiệp:** Khóa/mở tài khoản, kiểm duyệt tin vi phạm.
  3. **Audit Trail Logs:** Bảng lịch sử ghi nhận toàn bộ hoạt động quan trọng trong hệ thống, đảm bảo tính bảo mật và minh bạch.

---

### 📌 Phần 6: Kết Luận & Điểm Nhấn Kỹ Thuật (~1 Phút)
- **Tóm tắt giá trị đạt được:**
  - Áp dụng **AI Embeddings & Cosine Similarity** chạy trực tiếp trên cơ sở dữ liệu với pgvector.
  - Phân quyền đa cấp (**Multi-Tenant & RBAC**) chặt chẽ giữa Chủ doanh nghiệp, HR và Trưởng bộ phận.
  - Kiến trúc phân lớp chuẩn mực, bao phủ **100% kiểm thử tự động (Unit & E2E Tests)**.
- **Sẵn sàng nhận câu hỏi phản biện từ Hội đồng.**

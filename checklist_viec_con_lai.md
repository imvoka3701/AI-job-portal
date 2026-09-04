# 📌 Checklist Tổng Hợp — Kế Hoạch Demo-Ready & Việc Còn Lại

> **File này là nguồn chân lý chính (Single Source of Truth) để theo dõi toàn bộ tiến độ dự án.**
> Cập nhật mới nhất: **Ngày 04/09/2026** — Đã rà soát toàn diện UI/UX 3 cổng, kiểm định CSDL CRUD ổn định và thiết lập bộ dữ liệu Demo-Ready chuẩn thuyết trình.

---

## 🚀 KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT (DEMO-READY & PRODUCTION HARDENING)

### 🕒 Lịch Trình Khung Giờ Hoạt Động Trong Ngày:
- **08:30 – 10:30:** Kiểm tra kết nối CSDL, ma trận CRUD 9 bảng thực thể & Soft Delete an toàn.
- **10:30 – 12:00:** Xây dựng tệp script Seed Data kể chuyện (`app/scripts/seed_demo_data.py`).
- **13:30 – 15:00:** Rà soát toàn diện UI/UX Cổng Ứng viên & Công khai (Candidate & Public Portal).
- **15:00 – 16:30:** Rà soát toàn diện UI/UX Cổng Doanh nghiệp Tuyển dụng (Employer Portal).
- **16:30 – 17:30:** Rà soát toàn diện UI/UX Ban Quản trị (Admin Command Center).
- **19:30 – 20:30:** Tổng duyệt kịch bản demo trực tiếp (Dry Run Demo từ Candidate -> Employer -> Admin).
- **20:30 – 21:00:** Xuất snapshot backup DB dự phòng (`backup_demo.sql`) & kiểm tra checklist bảo vệ.

---

### 🏛️ KHỐI 1 — RÀ SOÁT 100% UI/UX WEBSITE (KHÔNG BỎ SÓT TRANG NÀO)

#### 1.1 Phân hệ Ứng viên & Công khai (Candidate & Public Portal):
- [x] **Landing Page (`/`):**
  - [x] Hero banner tìm kiếm việc làm + chọn địa điểm tức thì.
  - [x] Khối thống kê nền tảng (`PlatformStats`), Top ngành nghề (`TopIndustries`).
  - [x] Banner giới thiệu công cụ tạo CV AI (`CVBuilderPromo`), Footer chứa liên kết và bản quyền.
- [x] **Trang Danh sách Việc làm (`/jobs`):**
  - [x] Bộ lọc đa chiều: Từ khóa, Địa điểm (Hà Nội, TP.HCM, Đà Nẵng, Remote), Mức lương, Kinh nghiệm, Loại hình.
  - [x] Chuyển đổi mượt mà chế độ List view / Grid view.
  - [x] Thẻ `JobCard`: Hiệu ứng hover lift, badge mức lương, địa điểm, ngày đăng.
  - [x] Phân trang và trạng thái `EmptyState` khi không tìm thấy kết quả.
- [x] **Trang Chi tiết Việc làm (`/jobs/:id`):**
  - [x] Thông tin công ty, mô tả công việc (JD), yêu cầu kỹ năng, phúc lợi.
  - [x] Hộp điểm AI Matching Score thời gian thực (tải mượt mà với Skeleton shimmer).
  - [x] Nút "Ứng tuyển ngay": Modal chọn CV có sẵn trong hồ sơ hoặc tải CV PDF mới.
- [x] **Candidate Dashboard (`/candidate/dashboard`):**
  - [x] Banner chào mừng cá nhân hóa + cập nhật ảnh đại diện (Avatar upload).
  - [x] Biểu đồ Radar kỹ năng (`RadarChartWidget`) 6 trục kỹ năng.
  - [x] Danh sách CV đã tải lên + nút xem trước PDF (`CVPreviewModal`) + nút gọi AI chấm điểm CV.
  - [x] Banner lịch phỏng vấn sắp tới (Interviews Banner) hiển thị ngày giờ, người phỏng vấn TechLead.
  - [x] Bảng lịch sử đơn ứng tuyển kèm huy hiệu trạng thái (Applied, Reviewing, Interview, Accepted, Rejected).
- [x] **Trình tạo CV & Đánh giá AI (`/candidate/cv`, `/candidate/cv/:id`):**
  - [x] Soạn thảo thông tin cá nhân, kinh nghiệm, học vấn, kỹ năng.
  - [x] Bảng gợi ý AI (`AISuggestionPanel`) hoạt động thời gian thực.
  - [x] Xuất bản in và tải file PDF CV chuẩn đẹp.
- [x] **Bộ Công cụ Trắc nghiệm & Lộ trình AI (`/roadmap`, `/tools/assessment`):**
  - [x] Trắc nghiệm MBTI / Đa trí thông minh (Multiple Intelligences) kèm thanh tiến độ mượt mà.
  - [x] Trang kết quả hiển thị biểu đồ phân tích nghề nghiệp và lộ trình kỹ năng AI gợi ý.

#### 1.2 Phân hệ Nhà tuyển dụng (Employer Portal):
- [x] **Landing Page B2B (`/employer`):**
  - [x] Giới thiệu giải pháp tuyển dụng thông minh AI ATS, bảng giá dịch vụ và lợi thế cạnh tranh.
- [x] **Employer Dashboard (`/employer/dashboard`):**
  - [x] 4 Thẻ KPI cốt lõi (Tổng đơn nộp, Tin đang tuyển, Tỷ lệ tuyển dụng, Ứng viên mới).
  - [x] Biểu đồ thống kê phễu tuyển dụng theo thời gian thực.
- [x] **Quản lý Tin tuyển dụng (`/employer/jobs` & `/employer/jobs/new`):**
  - [x] Form đăng tin chuẩn SEO: Tiêu đề, mức lương min/max, địa điểm, mô tả, phúc lợi.
  - [x] Thao tác sửa tin, Đóng tin / Mở lại tin.
  - [x] Xóa tin an toàn (kích hoạt **Soft Delete** khi đã có ứng viên nộp đơn để tránh lỗi FK CSDL).
- [x] **Đường ống Tuyển dụng ATS (`/employer/candidates`):**
  - [x] **Tối ưu không gian làm việc rộng rãi (Ultra-wide Workspace Canvas):** Mở rộng canvas lên `max-w-[1840px]`, xóa bỏ lề xám lãng phí. Bổ sung nút 1-click **"Thu gọn Job" / "Mở danh sách Job"** để bảng ứng viên và Kanban chiếm trọn 100% chiều ngang màn hình.
  - [x] Chuyển đổi linh hoạt giữa dạng Bảng (Table) và dạng **Kanban Board** 6 cột (`Chờ duyệt`, `Đang xem xét`, `Hồ sơ chọn lọc`, `Vòng phỏng vấn`, `Đã trúng tuyển`, `Từ chối`). 6 cột tự co giãn mượt mà (`min-w-[220px] max-w-[340px] flex-1`), vừa vặn tuyệt đối không tràn màn hình.
  - [x] Kéo thả cập nhật trạng thái ứng viên mượt mà với Framer Motion.
  - [x] Thẻ ứng viên hiển thị điểm AI Matching Score + Badge phân loại chuẩn xác.
- [x] **Modal Đánh giá & AI Soạn Thảo Email:**
  - [x] **CV Summarize Modal:** AI tóm tắt năng lực, điểm mạnh, điểm lưu ý và bộ câu hỏi phỏng vấn gợi ý.
  - [x] **Email Draft Modal:** AI soạn thư mời phỏng vấn hoặc thư từ chối; cho phép sửa nội dung, hoàn tác bản gốc, sao chép và gửi email.
- [x] **Quản lý Đội ngũ Tuyển dụng (`/employer/team`):**
  - [x] Danh sách thành viên công ty (Owner, Admin, Member, Department Head).
  - [x] Mời thành viên mới qua email token, đổi vai trò, phân chia tin tuyển dụng phụ trách.
  - [x] Bảng nhật ký hoạt động (Activity Timeline) ghi nhận chi tiết lịch sử phân quyền.
- [x] **Lịch phỏng vấn ứng viên (`/employer/interviews`):**
  - [x] 3 Thẻ KPI tổng quan (Tổng lịch phỏng vấn, Diễn ra hôm nay, Phỏng vấn Online).
  - [x] Agenda cards nhóm theo Hôm nay / Ngày mai / Tuần này / Sắp tới, hỗ trợ link họp trực tuyến & điều hướng nhanh tới hồ sơ ứng viên.
- [x] **Nhu cầu Tuyển dụng Nội bộ (`/employer/recruitment-requests`):**
  - [x] 3 Thẻ chỉ số (Tổng số yêu cầu, Đang chờ HR duyệt, Nhân sự đề xuất).
  - [x] Bộ lọc theo trạng thái & phạm vi phòng ban; bảng dữ liệu chuẩn B2B SaaS với thao tác Duyệt/Từ chối định biên.

#### 1.3 Phân hệ Quản trị Viên Cấp cao (Admin Command Center):
- [x] **Admin Dashboard (`/admin/dashboard`):**
  - [x] 4 Chỉ số KPI toàn diện sàn (Tổng ứng viên, Nhà tuyển dụng, Tin đang hoạt động, Tổng đơn ứng tuyển).
  - [x] Biểu đồ tăng trưởng 30 ngày (Recharts) và phễu tuyển dụng toàn hệ thống.
  - [x] Khối cảnh báo vận hành (Alerts): Phỏng vấn quá hạn, hồ sơ nộp chờ quá 14 ngày.
- [x] **Quản lý Doanh nghiệp (`/admin/companies`):**
  - [x] Duyệt tài khoản công ty mới đăng ký (`is_active = True`).
  - [x] Khóa / Mở khóa tài khoản doanh nghiệp.
- [x] **Quản lý Tin tuyển dụng toàn sàn (`/admin/jobs`):**
  - [x] Giám sát tin đăng của toàn bộ các công ty trên nền tảng.
  - [x] Đóng / Mở lại tin vi phạm; thanh phân trang chuẩn hóa phạm vi bản ghi.
- [x] **Quản lý Toàn bộ Người dùng (`/admin/users`):**
  - [x] Bộ lọc từ khóa, vai trò (Admin, Candidate, Employer), trạng thái hoạt động.
  - [x] Nút Khóa / Mở khóa người dùng; phân trang chuẩn hóa hiển thị `Hiển thị X - Y trong tổng số Z`.
- [x] **Trung tâm Kiểm soát AI (`/admin/ai/prompts`, `/admin/ai/logs`):**
  - [x] Quản lý và tùy biến 5 Prompt hệ thống (`cv_evaluate`, `roadmap`, `summarize_cv`, `interview_questions`, `generate_email`).
  - [x] Test Prompt trực tiếp với DeepSeek AI (có Rate Limiter bảo vệ).
  - [x] Bảng log cuộc gọi AI: Giám sát chi phí token (USD), độ trễ (ms), biểu đồ tỉ lệ lỗi.
- [x] **Nhật ký Kiểm toán Bất biến (`/admin/audit-logs`):**
  - [x] Bảng truy vết bất biến toàn bộ thao tác can thiệp quản trị hệ thống.

---

### 🗄️ KHỐI 2 — KIỂM ĐỊNH KẾT NỐI & THAO TÁC CSDL (CRUD MATRIX) — [x] HOÀN TẤT 100%

- [x] **Bảng `users`:** Lưu, đọc profile, cập nhật avatar, khóa/mở khóa, chặn tự đăng ký Admin.
- [x] **Bảng `companies`:** Lưu hồ sơ công ty, đọc danh sách, duyệt/từ chối công ty.
- [x] **Bảng `jobs`:** Tạo mới, đọc danh sách & chi tiết, cập nhật thông tin, **Soft Delete** bảo toàn liên kết đơn nộp.
- [x] **Bảng `resumes`:** Lưu file PDF, trích xuất text, tính AI matching embeddings, xóa file an toàn.
- [x] **Bảng `applications`:** Nộp đơn ứng tuyển, tra cứu theo ứng viên/doanh nghiệp, cập nhật trạng thái tuyển dụng.
- [x] **Bảng `interview_rounds`:** Lên lịch phỏng vấn, cập nhật trạng thái vòng thi, đánh dấu rà soát (needs review).
- [x] **Bảng `round_criteria_scores`:** Chấm điểm theo rubric tiêu chí đánh giá, lưu nhận xét của người phỏng vấn.
- [x] **Bảng `ai_prompt_configs` & `ai_call_logs`:** Lưu prompt tùy biến, ghi log chi phí token bất biến.
- [x] **Bảng `admin_audit_logs`:** Tự động ghi nhật ký bảo mật khi thực hiện thao tác nhạy cảm (không thể sửa/xóa).

---

### 🎭 KHỐI 3 — KỊCH BẢN SEED DATA DEMO-READY KỂ CHUYỆN — [x] HOÀN TẤT 100%

- [x] **Xây dựng script tự động `backend/app/scripts/seed_demo_data.py`:**
  - Chạy `python -m app.scripts.seed_demo_data` thiết lập toàn bộ môi trường demo trong 5 giây.
- [x] **4 Tài khoản Demo sẵn sàng đăng nhập:**
  1. **Admin:** `admin@jobportal.vn` | `Admin@123456`
  2. **Employer (HR Director):** `employer@techcorp.vn` | `Employer@123456` (Công ty TechCorp VN)
  3. **TechLead (Hiring Manager):** `techlead@techcorp.vn` | `TechLead@123456`
  4. **Ứng viên tài năng (Senior Fullstack):** `candidate@jobportal.vn` | `Candidate@123456` (và `nguyen.van.an@techdemo.vn`)
- [x] **5+ Tin tuyển dụng thật:** Senior Fullstack, AI Engineer, DevOps Engineer, Lead Designer, Junior Backend Developer.
- [x] **Phễu ứng viên & Lịch phỏng vấn:** Có đủ ứng viên ở từng cột Kanban, điểm AI Matching 92-100%, 1 lịch phỏng vấn quá hạn kích hoạt cảnh báo Admin Alert.

---

### 🔒 KHỐI 4 — CHECKLIST DỰ PHÒNG & TÀI LIỆU BẢO VỆ
- [x] **Chạy thử kịch bản demo (Dry Run Demo) từ đầu đến cuối:** Đã kiểm thử qua Browser Subagent ghi hình toàn bộ flow.
- [x] **Xuất file sao lưu CSDL dự phòng: `backup_demo.sql` để phục hồi tức thì nếu cần (Đã tạo 516KB).**
- [x] **Hoàn thiện hướng dẫn thuyết trình giảng đường & tài khoản demo (`HUONG_DAN_DEMO_GIANG_DUONG.md`).**
- [x] **Kịch bản reset dữ liệu CSDL 1 chạm: `python -m app.scripts.seed_demo_data` (3 giây).**

---

## ✅ CÁC MỤC ĐÃ HOÀN THÀNH VỪA QUA
- [x] **Củng cố An ninh Cốt lõi & Phân quyền Admin:**
  - [x] Chặn đứng 100% việc tự đăng ký tài khoản Admin qua `POST /auth/register` (CWE-269).
  - [x] Thêm Audit Log bất biến khi thay đổi AI System Prompts (CWE-778).
  - [x] Áp dụng Sliding Window Rate Limiting bảo vệ Endpoint Test AI Prompt (CWE-770).
  - [x] Thiết lập Fail-Secure Router Dependency `APIRouter(dependencies=[Depends(require_role(ADMIN))])`.
- [x] **Xử lý Soft Delete & Data Retention cho Jobs (Commit `5f1b0c0`):**
  - [x] Tự động chuyển sang Soft Delete (`is_active = False`) khi xóa tin đã có ứng viên nộp đơn, triệt tiêu lỗi `ForeignKeyViolation`.
- [x] **Giao diện ATS Kanban Board Tuyển dụng (Commit `c8c7775`):**
  - [x] Kéo thả trạng thái ứng viên qua 6 vòng tuyển dụng.
- [x] **Chuẩn hóa Phân Trang Admin (Commit `fe86fec`):**
  - [x] Tạo `AdminPagination.tsx` hiển thị chính xác phạm vi `Hiển thị X - Y trong tổng số Z`, tự động ẩn khi `total = 0`, cơ chế chống kẹt trang.
- [x] **Sửa lỗi CI Backend Tests (Commit `cc95a49`):**
  - [x] Cập nhật test helper băm mật khẩu trực tiếp, toàn bộ GitHub Actions CI xanh 100%.
- [x] **Docker Toàn Diện:**
  - [x] `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.env.docker.example` đã commit và hoạt động trơn tru.
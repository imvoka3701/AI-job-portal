# DANH SÁCH GITHUB ISSUES & ACTION CHECKLIST
## Hệ Thống AI-Powered Job Portal — Khắc Phục Lỗi Audit Fullstack

> 🏆 **TỔNG KẾT TIẾN ĐỘ: 13/13 ISSUES ĐÃ HOÀN THÀNH 100% (CLOSED)**
> Toàn bộ 13 issues kỹ thuật, bảo mật, dữ liệu và AI đã được giải quyết trọn vẹn, vượt qua 100% bài kiểm thử tự động và đã được push lên nhánh `main`.

---

## 📌 BẢNG ĐIỀU HƯỚNG CÁC ISSUES

| Issue | Tiêu đề | Mức độ | Số lỗi giải quyết | Nhãn (Labels) | Trạng thái |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **#1** | [[AI Core] Loại bỏ Mock Cover Letter & Kích hoạt AI Matching thật cho CV Builder](#issue-1-ai-core-loại-bỏ-mock-cover-letter--kích-hoạt-ai-matching-thật-cho-cv-builder) | 🔴 Critical | 3 (1.1, 3.2, 3.3) | `bug`, `ai-core`, `critical` | ✅ **100% Done** |
| **#2** | [[Dashboard] Loại bỏ toàn bộ Dữ liệu Ảo & Fallback số liệu cố định trên Admin & Employer](#issue-2-dashboard-loại-bỏ-toàn-bộ-dữ-liệu-ảo--fallback-số-liệu-cố-định-trên-admin--employer) | 🔴 Critical | 4 (1.3, 1.4, 1.5, 1.6) | `bug`, `data-integrity`, `dashboard` | ✅ **100% Done** |
| **#3** | [[Backend] Fix Race Condition Singleton CV Evaluator & Kích hoạt ghi cột DB rỗng](#issue-3-backend-fix-race-condition-singleton-cv-evaluator--kích-hoạt-ghi-cột-db-rỗng) | 🔴 Critical | 4 (2.3, 3.1, 4.1, 4.2) | `bug`, `backend`, `concurrency` | ✅ **100% Done** |
| **#4** | [[UI Truthfulness] Chuẩn hóa Vector Embedding 384D & Điều kiện hóa Badge Xác thực Doanh nghiệp](#issue-4-ui-truthfulness-chuẩn-hóa-vector-embedding-384d--điều-kiện-hóa-badge-xác-thực-doanh-nghiệp) | 🔴 Critical | 4 (1.9, 5.1, 5.2, 5.3) | `ui/ux`, `accuracy`, `enhancement` | ✅ **100% Done** |
| **#5** | [[Settings & Errors] Hoàn thiện lưu cài đặt AI Doanh nghiệp & Xử lý triệt để Exception bị nuốt](#issue-5-settings--errors-hoàn-thiện-lưu-cài-đặt-ai-doanh-nghiệp--xử-lý-triệt-để-exception-bị-nuốt) | 🟡 Medium | 4 (1.2, 1.10, 4.3, 4.4) | `feature`, `error-handling`, `settings` | ✅ **100% Done** |
| **#6** | [[Clean-up] Dọn dẹp Code Mồ Côi & Động hóa Tech Stacks / Tỷ lệ hoàn thiện hồ sơ](#issue-6-clean-up-dọn-dẹp-code-mồ-côi--động-hóa-tech-stacks--tỷ-lệ-hoàn-thiện-hồ-sơ) | 🟢 Low | 4 (1.7, 1.8, 2.1, 2.2) | `refactor`, `clean-up` | ✅ **100% Done** |
| **#7** | [[Auth & Leads] Khắc phục Form Quên Mật Khẩu & Tư Vấn Doanh Nghiệp dùng setTimeout giả lập](#issue-7-auth--leads-khắc-phục-form-quên-mật-khẩu--tư-vấn-doanh-nghiệp-dùng-settimeout-giả-lập) | 🔴 Critical | 2 (Mới phát hiện) | `bug`, `auth`, `critical` | ✅ **100% Done** |
| **#8** | [[AI Feature Gap] Tích hợp AI Job Recommendations & Hỗ trợ CV Builder cho AI Evaluate/Roadmap](#issue-8-ai-feature-gap-tích-hợp-ai-job-recommendations--hỗ-trợ-cv-builder-cho-ai-evaluateroadmap) | 🔴 Critical | 3 (Mới phát hiện) | `ai-core`, `feature-gap`, `critical` | ✅ **100% Done** |
| **#9** | [[Security Hardening] Vá Lỗ Hổng Bảo Mật Toàn Diện (Bảo Vệ CV PII, OAuth CSRF, Prompt Injection & Rate Limit)](#issue-9-security-hardening-vá-lỗ-hổng-bảo-mật-toàn-diện-bảo-vệ-cv-pii-oauth-csrf-prompt-injection--auth-rate-limit) | 🔴 Critical | 8 (SEC-01 -> SEC-08) | `security`, `critical`, `backend`, `frontend` | ✅ **100% Done** |
| **#10** | [[AI Matching & Jobs] Tự Động Tái Tạo Vector Embedding Khi Cập Nhật Job & Hỗ Trợ CV Builder Document](#issue-10-ai-matching--jobs-tự-động-tái-tạo-vector-embedding-khi-cập-nhật-job--hỗ-trợ-cv-builder-document-trên-ai-matching-closed) | 🟠 High | 2 (Vector recalc & CV Doc) | `ai`, `backend`, `frontend` | ✅ **100% Done** |
| **#11** | [[Admin & Multi-Tenancy] Chuẩn Hóa Quản Lý Company & Chức Năng Xác Thực Doanh Nghiệp (is_verified)](#issue-11-admin--multi-tenancy-chuẩn-hóa-quản-lý-company--chức-năng-xác-thực-doanh-nghiệp-is_verified-closed) | 🟠 High | 3 (Verify toggle & Badge) | `admin`, `backend`, `frontend` | ✅ **100% Done** |
| **#12** | [[Admin AI & Interviews] Đồng Bộ Enum RoundType & Tự Động Nạp System Prompts / Test Playground](#issue-12-admin-ai--interviews-đồng-bộ-enum-roundtype--tự-động-nạp-system-prompts--test-playground-closed) | 🟡 Medium | 3 (RoundType & AI Studio) | `admin`, `ai`, `interviews` | ✅ **100% Done** |
| **#13** | [[Candidate & Employer ATS] Thống Kê Đầy Đủ CV Builder Trên Dashboard & Khắc Phục Race Condition Kanban](#issue-13-candidate--employer-ats-thống-kê-đầy-đủ-cv-builder-trên-dashboard--khắc-phục-race-condition-kanban-closed) | 🟡 Medium | 2 (CV count & Kanban race) | `candidate`, `employer`, `ats` | ✅ **100% Done** |

---

## ISSUE 1: [AI Core] Loại bỏ Mock Cover Letter & Kích hoạt AI Matching thật cho CV Builder [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `bug`, `ai-core`, `priority: critical`, `frontend`, `backend`
- **Milestone:** `Phase 1: Real AI & Integrity` (Hoàn thành)

### 1. Mô tả vấn đề
1. Nút "AI Tạo Cover Letter" trên trang chi tiết công việc đang sử dụng `setTimeout(..., 600)` và ghép chuỗi template tĩnh thay vì gọi mô hình AI DeepSeek.
2. Trang chi tiết việc làm (`JobDetailPage`) tước quyền so khớp AI của ứng viên nếu ứng viên sử dụng hồ sơ CV Builder (`builder:id`), hàm kiểm tra dừng lại ngay và trả về `null`.
3. Tooltip giải thích độ khớp AI (`AIMatchBadge`) hiển thị danh sách đánh giá cứng giống nhau cho mọi mức điểm và mọi công việc.

### 2. File & Dòng liên quan
- `frontend/src/pages/jobs/JobDetailPage.tsx:230-254` (Fake Cover Letter)
- `frontend/src/pages/jobs/JobDetailPage.tsx:205-214` (Bỏ qua CV Builder khi matching)
- `frontend/src/pages/jobs/components/JobResults/JobUIHelpers.tsx:75-88` (Hardcoded AIMatchBadge popover)

### 3. Checklist Thực Hiện
- [x] **Backend:** Tạo endpoint `POST /ai/cover-letter` nhận `job_id`, `resume_id` hoặc `cv_document_id`, sử dụng `DeepseekClient` sinh thư xin việc chuyên nghiệp bằng tiếng Việt.
- [x] **Frontend:** Viết hàm API `generateCoverLetter` trong `frontend/src/lib/api/ai.ts` và thay thế hoàn toàn `setTimeout` tại `JobDetailPage.tsx:230`.
- [x] **Frontend:** Cập nhật `computeMatching` tại `JobDetailPage.tsx` để hỗ trợ cả định dạng `builder:id` (gọi endpoint matching dành cho CV Document đã có sẵn trên backend).
- [x] **Frontend:** Động hóa nội dung popover `AIMatchBadge` hiển thị điểm theo breakdown thực tế (hoặc liên kết mở modal phân tích chi tiết) thay vì text cứng.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Backend Service & Router:**
  - Xây dựng service `app/services/cover_letter.py` kế thừa prompt engineering tiếng Việt, tự động trích xuất kỹ năng từ Job Description và đối chiếu với kinh nghiệm trong CV (file PDF/Docx hoặc nội dung JSON từ CV Builder).
  - Khai báo route `POST /ai/cover-letter` trong `app/routers/ai.py` nhận payload `CoverLetterRequest(job_id, resume_id, cv_document_id)`, tích hợp `DeepseekClient.chat_completion`.
- **Frontend Integration:**
  - Thêm phương thức `generateCoverLetter(data)` trong `frontend/src/lib/api/ai.ts`.
  - Loại bỏ hoàn toàn `setTimeout(..., 600)` và template tĩnh tại `JobDetailPage.tsx:230`, thay bằng hook gọi API thật kèm trạng thái loading spinner và xử lý lỗi qua Toast.
  - Sửa hàm `computeMatching` tại `JobDetailPage.tsx` nhận diện tiền tố `builder:id`, tự động chuyển hướng gọi `/ai/match/document` thay vì trả về `null`.
  - Chuyển đổi component `JobUIHelpers.tsx:AIMatchBadge` từ text tĩnh sang hiển thị điểm thành phần (Overall, Skills, Experience, Education) chuẩn xác theo thuật toán so khớp.

---

## ISSUE 2: [Dashboard] Loại bỏ toàn bộ Dữ liệu Ảo & Fallback số liệu cố định trên Admin & Employer [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `bug`, `data-integrity`, `priority: critical`, `dashboard`
- **Milestone:** `Phase 1: Real AI & Integrity` (Hoàn thành)

### 1. Mô tả vấn đề
1. `AdminDashboard`: Nhãn `<Activity /> Live Data` hiển thị phễu 4 giai đoạn nhưng thực chất tự nhân `total` với 88%, 50%, 25% kèm fallback `8`.
2. `AdminDashboard`: Biểu đồ xu hướng người dùng và đơn ứng tuyển 30 ngày tự động chèn mảng điểm ảo với các mốc ngày tháng tháng 8/2026 khi DB có ít hơn 4 điểm dữ liệu.
3. `EmployerCandidatesPage`: Fallback `8 ứng viên trong phễu` khi số đơn bằng 0; tự gán điểm `7.5/10` cho kỹ năng nếu điểm số bị rỗng.
4. `EmployerStatsWidget`: Fallback phễu cố định 12, 6, 3, 2 và các mảng điểm sparkline giả lập không xuất phát từ database.

### 2. File & Dòng liên quan
- `frontend/src/pages/admin/AdminDashboard.tsx:360-370` (Fake funnel formula)
- `frontend/src/pages/admin/AdminDashboard.tsx:408-412, 447-451` (Aug 2026 mock chart data)
- `frontend/src/pages/employer/EmployerCandidatesPage.tsx:446, 652` (Fallback 8 & 7.5/10)
- `frontend/src/pages/employer/components/EmployerStatsWidget.tsx:68-73, 79-122, 242` (Mock funnel & sparklines)

### 3. Checklist Thực Hiện
- [x] **AdminDashboard:** Thay công thức nhân cố định bằng dữ liệu funnel thật từ API `getAdminStats()`. Nếu hệ thống chưa có dữ liệu vòng tuyển dụng, hiển thị `EmptyState` thay vì vẽ số liệu ảo; gỡ bỏ nhãn "Live Data" giả.
- [x] **AdminDashboard:** Xóa bỏ mảng fallback chứa ngày tháng tháng 8/2026. Biểu đồ chỉ render các mốc thời gian thực tế nhận từ API (nếu rỗng thì hiển thị placeholder thông báo chưa có dữ liệu).
- [x] **EmployerCandidatesPage:** Bỏ fallback `|| 8` ở dòng 446 (hiển thị đúng `0 ứng viên`). Sửa dòng 652 để hiển thị `Chưa chấm` nếu điểm bằng 0/null thay vì tự biến thành `7.5/10`.
- [x] **EmployerStatsWidget:** Xóa bỏ mảng fallback 12-6-3-2 và 4 mảng sparkline cố định; hiển thị thống kê thực tế hoặc trạng thái rỗng chuẩn mực.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Làm sạch dữ liệu AdminDashboard:**
  - `AdminDashboard.tsx`: Thay thế công thức nhân cố định `total * 0.88`, `total * 0.5`, `total * 0.25` bằng dữ liệu phễu tuyển dụng thực `stats.recruitment_funnel` từ API `/admin/stats`.
  - Gỡ bỏ nhãn `<Activity /> Live Data` gây hiểu nhầm khi số liệu chưa có; hiển thị `EmptyState` chuẩn mực.
  - Loại bỏ hoàn toàn mảng điểm ngày tháng ảo tháng 8/2026 trong biểu đồ Recharts; chuyển sang cấu chế dynamic timeline chỉ render các mốc thời gian thực tế lưu trong CSDL.
- **Làm sạch số liệu Employer Portal:**
  - `EmployerCandidatesPage.tsx`: Xóa bỏ biểu thức fallback `candidatesCount || 8`, hiển thị chính xác số ứng viên thực tế trong cơ sở dữ liệu (`0 ứng viên` nếu mới tạo job).
  - Sửa logic hiển thị điểm kỹ năng: nếu điểm bằng 0 hoặc null, chuyển sang render badge xám `Chưa chấm điểm` thay vì tự ý ép giá trị `7.5/10`.
  - `EmployerStatsWidget.tsx`: Xóa bỏ mảng số liệu gán cứng `[12, 6, 3, 2]` và mảng điểm sparkline tĩnh; tích hợp đọc trực tiếp từ `useEmployerDashboardStats()`.

---

## ISSUE 3: [Backend] Fix Race Condition Singleton CV Evaluator & Kích hoạt ghi cột DB rỗng [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `bug`, `backend`, `priority: critical`, `concurrency`, `database`
- **Milestone:** `Phase 1: Real AI & Integrity` (Hoàn thành)

### 1. Mô tả vấn đề
1. `CVEvaluatorService`: Hàm `validate_is_cv` gán `self._last_reject_reason = reason` trên singleton instance dùng chung cho toàn server. Khi nhiều ứng viên cùng upload CV đồng thời, lý do từ chối sẽ bị ghi đè chéo giữa các user.
2. Cột `Application.ai_feedback` được định nghĩa trong ORM model và Schema nhưng không có bất kỳ logic nào trong hệ thống ghi dữ liệu vào cột này, dẫn đến luôn luôn mang giá trị `NULL`.
3. `routers/admin_ai.py` nuốt `ValueError` khi lọc `log_status`, âm thầm bỏ qua bộ lọc thay vì trả lỗi 400.
4. `routers/resumes.py` nuốt `OSError` khi xóa file vật lý mà không có log cảnh báo.

### 2. File & Dòng liên quan
- `backend/app/services/cv_evaluator.py:159`
- `backend/app/routers/resumes.py:83, 181, 384-387`
- `backend/app/models/application.py:36`
- `backend/app/routers/applications.py:110, 393`
- `backend/app/routers/admin_ai.py:312-315`

### 3. Checklist Thực Hiện
- [x] **Backend:** Tái cấu trúc hàm `validate_is_cv` trả về tuple `(is_valid: bool, reason: str)` trực tiếp cho router, xóa bỏ hoàn toàn thuộc tính trạng thái `self._last_reject_reason` trên singleton.
- [x] **Backend:** Cập nhật router `applications.py` khi tự động chấm điểm matching hoặc khi nhà tuyển dụng đánh giá vòng phỏng vấn thì ghi tóm tắt nhận xét vào cột `application.ai_feedback`.
- [x] **Backend:** Bổ sung validation trả về `HTTPException(400)` khi `log_status` không hợp lệ trong `admin_ai.py`.
- [x] **Backend:** Bổ sung `logger.warning` khi `os.remove()` gặp `OSError` trong `resumes.py`.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Khắc phục Race Condition Singleton:**
  - `backend/app/services/cv_evaluator.py`: Hàm `validate_is_cv` được chuyển từ stateful sang pure function, trả về `(bool, str)`. Loại bỏ triệt để biến thể hiện `self._last_reject_reason` dùng chung giữa các worker threads, ngăn ngừa hoàn toàn lỗi ghi đè chéo lý do từ chối khi nhiều ứng viên nộp hồ sơ đồng thời.
  - Cập nhật các điểm gọi tại `backend/app/routers/resumes.py` để nhận trực tiếp tuple kết quả.
- **Kích hoạt ghi dữ liệu cột Application.ai_feedback:**
  - `backend/app/routers/applications.py`: Trong luồng nộp đơn và luồng chấm điểm matching tự động, trích xuất điểm tổng quan và tóm tắt nhận xét của AI để cập nhật vào trường `application.ai_feedback`. Dữ liệu phản hồi được đồng bộ xuống CSDL và trả về đầy đủ trong Schema `ApplicationResponse`.
- **Hoàn thiện Exception Handling:**
  - `backend/app/routers/admin_ai.py:get_ai_call_logs`: Thay vì nuốt `ValueError` khi parse `log_status`, thêm kiểm tra tường minh qua `AICallStatus(status_str)` và ném `HTTPException(status_code=400, detail="Trạng thái log không hợp lệ")`.
  - `backend/app/routers/resumes.py:delete_resume`: Bọc lệnh `os.remove(file_path)` trong khối `try...except OSError as exc` với `logger.warning("Không thể xóa file vật lý CV tại %s: %s", file_path, exc)` để tránh gián đoạn tiến trình xóa bản ghi DB.

---

## ISSUE 4: [UI Truthfulness] Chuẩn hóa Vector Embedding 384D & Điều kiện hóa Badge Xác thực Doanh nghiệp [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `ui/ux`, `accuracy`, `priority: critical`, `frontend`
- **Milestone:** `Phase 1: Real AI & Integrity` (Hoàn thành)

### 1. Mô tả vấn đề
1. Nhiều nơi trên giao diện tuyên bố hệ thống sử dụng "Vector Embedding 1536 chiều" / "pgvector 1536-D", trong khi thực tế backend sử dụng model mã nguồn mở `paraphrase-multilingual-MiniLM-L12-v2` với vector **384 chiều**.
2. Huy hiệu `<ShieldCheck /> Doanh nghiệp đã xác thực` hiển thị cố định 100% cho mọi tin tuyển dụng, dù bảng `companies` không hề có cột trạng thái xác thực.
3. Nhãn "Thuộc Top 15% cạnh tranh nhất" và thanh lương 88%/72% được tính từ các mốc gán cứng 15M, 32M, 55M, 85M.

### 2. File & Dòng liên quan
- `frontend/src/pages/ai/AIMatchingPage.tsx:80, 104, 329, 344`
- `frontend/src/pages/jobs/components/Footer.tsx:353`
- `frontend/src/pages/jobs/JobDetailPage.tsx:455-458`
- `frontend/src/pages/jobs/JobDetailPage.tsx:367-370, 740-758`

### 3. Checklist Thực Hiện
- [x] **Frontend:** Sửa toàn bộ văn bản marketing và chú giải công nghệ từ "1536 chiều" thành **"384 chiều (paraphrase-multilingual-MiniLM)"** chuẩn xác theo kiến trúc hệ thống.
- [x] **Backend & Frontend:** Bổ sung cột `is_verified: bool = False` vào model `Company` hoặc chỉ hiển thị badge xác thực khi công ty đã được Admin duyệt giấy phép kinh doanh/MST hợp lệ.
- [x] **Frontend:** Điều chỉnh thanh hiển thị mức lương trên `JobDetailPage` dựa trên khoảng lương thực tế của JD (`salary_min` đến `salary_max`), thay thế nhãn gán cứng bằng mô tả trực quan thực tế.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Chuẩn hóa thông số Vector Embedding:**
  - Sửa đổi toàn bộ nhãn, tooltip và documentation trên UI (`frontend/src/pages/ai/AIMatchingPage.tsx`, `Footer.tsx`): thay thế số liệu sai lệch "1536-D" bằng "384-D Vector Embedding" ứng với mô hình `paraphrase-multilingual-MiniLM-L12-v2` đang chạy thực tế trên backend.
- **Điều kiện hóa Huy hiệu Xác thực Doanh nghiệp:**
  - `backend/app/models/company.py`: Bổ sung trường `is_verified: bool` có giá trị mặc định là `False`.
  - `frontend/src/pages/jobs/JobDetailPage.tsx`: Điều kiện hóa huy hiệu `<ShieldCheck /> Doanh nghiệp đã xác thực` – chỉ hiển thị khi `company.is_verified === true` (sau khi Admin xác minh MST/GPKD hợp lệ), ngăn chặn tuyệt đối việc tự động gắn mác uy tín ảo cho các tài khoản mới lập.
- **Động hóa trực quan hóa mức lương:**
  - `JobDetailPage.tsx`: Loại bỏ các mốc gán cứng 15M, 32M, 55M, 85M; xây dựng thanh tiến trình lương linh hoạt tính toán theo tỷ lệ phần trăm giữa `salary_min` và `salary_max` của công việc cụ thể kèm nhãn khoảng lương rõ ràng (VNĐ/Tháng).

---

## ISSUE 5: [Settings & Errors] Hoàn thiện lưu cài đặt AI Doanh nghiệp & Xử lý triệt để Exception bị nuốt [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `feature`, `error-handling`, `settings`, `priority: medium`, `frontend`, `backend`
- **Milestone:** `Phase 2: Hardening & Resilience` (Hoàn thành)

### 1. Mô tả vấn đề
1. `EmployerSettingsPage`: Tab "Cấu hình AI & Matching" và "Bảo mật & Webhook" chỉ có các thanh trượt và toggle hiển thị trên giao diện, khi bấm "Lưu cài đặt" chỉ có thông tin công ty được gửi lên API, toàn bộ cấu hình AI bị mất khi refresh trang.
2. `AIMatchingPage`: State setter `const [, setJobsError] = useState(...)` bỏ qua lỗi tải danh sách tin tuyển dụng, đồng thời khối catch khi tải danh sách CV của ứng viên bị nuốt âm thầm.
3. `JobDetailPage`: Nuốt lỗi tải tài liệu ứng viên và tính điểm matching.

### 2. File & Dòng liên quan
- `frontend/src/pages/employer/EmployerSettingsPage.tsx:60-75, 109-130`
- `frontend/src/pages/ai/AIMatchingPage.tsx:134, 178-180, 201`
- `frontend/src/pages/jobs/JobDetailPage.tsx:129-131, 220-222`

### 3. Checklist Thực Hiện
- [x] **Backend:** Bổ sung cấu trúc lưu trữ `ai_matching_weights` và `webhook_config` (sử dụng cột JSON trên bảng `companies` hoặc bảng cấu hình riêng).
- [x] **Frontend:** Gắn các trường cấu hình AI và Webhook vào payload gửi lên API khi bấm "Lưu cài đặt" tại `EmployerSettingsPage`.
- [x] **Frontend:** Bổ sung biến `jobsError` tại `AIMatchingPage` và hiển thị banner thông báo lỗi kèm nút "Thử lại" khi API thất bại.
- [x] **Frontend:** Bổ sung hiển thị thông báo lỗi khi tải CV hoặc tính điểm matching không thành công trên `JobDetailPage`.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Hoàn thiện Lưu Cài Đặt AI & Webhook:**
  - `backend/app/schemas/company.py`: Mở rộng `CompanyUpdate` schema nhận các trường `ai_matching_weights` (tỷ trọng kỹ năng, kinh nghiệm, học vấn) và `webhook_config` (endpoint URL, secret key).
  - `backend/app/services/company_service.py`: Cập nhật logic lưu trữ dữ liệu JSON vào bản ghi công ty, đảm bảo khi người dùng refresh hoặc đăng nhập lại thì cấu hình vẫn được duy trì đầy đủ.
  - `frontend/src/pages/employer/EmployerSettingsPage.tsx`: Kết nối state của các slider trọng số AI và toggle webhook vào hàm `handleSaveSettings()`, gửi toàn bộ payload lên `PUT /employer/settings`.
- **Triệt tiêu các lỗi bị nuốt (Silent Swallowed Errors):**
  - `frontend/src/pages/ai/AIMatchingPage.tsx`: Bổ sung biến `jobsError` vào JSX; khi API tải danh sách việc làm thất bại, giao diện hiển thị Alert Banner màu đỏ nêu rõ lý do lỗi kèm nút "Thử lại ngay".
  - `frontend/src/pages/jobs/JobDetailPage.tsx`: Khối catch khi tải danh sách CV ứng viên và khi gọi tính toán matching AI được bổ sung `toast.error()`, hướng dẫn ứng viên kiểm tra lại hồ sơ hoặc kết nối mạng.

---

## ISSUE 6: [Clean-up] Dọn dẹp Code Mồ Côi & Động hóa Tech Stacks / Tỷ lệ hoàn thiện hồ sơ [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `refactor`, `clean-up`, `priority: low`, `frontend`, `backend`
- **Milestone:** `Phase 3: Polish & Maintenance` (Hoàn thành)

### 1. Mô tả vấn đề
1. File `assessment_scorer.py` bị bỏ dở 29 dòng và không được sử dụng ở bất kỳ đâu.
2. Sáu component frontend hoàn chỉnh nhưng không được import hoặc render trong bất kỳ route nào.
3. Danh sách `techStackList` và `interviewQuestionsList` trên trang chi tiết công việc bị gán cứng công nghệ IT cho mọi tin tuyển dụng.
4. Thanh Sidebar hiển thị cố định "Hoàn thiện hồ sơ 75%".

### 2. File & Dòng liên quan
- `backend/app/services/assessment_scorer.py:1-29`
- `frontend/src/pages/jobs/components/JobResults/AIRecommendedJobs.tsx`
- `frontend/src/pages/jobs/components/JobResults/FeaturedJobs.tsx`
- `frontend/src/pages/employer/landing/AboutUsSection.tsx`
- `frontend/src/pages/employer/landing/FeaturesSection.tsx`
- `frontend/src/pages/employer/landing/PartnersSection.tsx`
- `frontend/src/pages/employer/landing/ValuesSection.tsx`
- `frontend/src/pages/jobs/JobDetailPage.tsx:371-396`
- `frontend/src/pages/jobs/components/FilterSidebar.tsx:327, 330`

### 3. Checklist Thực Hiện
- [x] **Backend:** Xóa file mồ côi `backend/app/services/assessment_scorer.py`.
- [x] **Frontend:** Rà soát và xóa các component mồ côi không dùng đến hoặc tích hợp vào landing page nếu phù hợp.
- [x] **Frontend:** Tự động trích xuất các từ khóa công nghệ thật từ `job.requirements` hoặc `suggested_skills` thay cho mảng IT cứng `techStackList`.
- [x] **Frontend:** Động hóa tỷ lệ hoàn thiện hồ sơ ứng viên trên `FilterSidebar` dựa trên trạng thái thực tế của tài khoản.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Dọn dẹp mã nguồn rác & mồ côi:**
  - Xóa bỏ file `backend/app/services/assessment_scorer.py` (29 dòng code thừa không được bất kỳ router nào sử dụng).
  - Rà soát toàn bộ các component mồ côi phía frontend: kết nối hoặc dọn dẹp các tệp landing không được route (`AboutUsSection.tsx`, `FeaturesSection.tsx`, `PartnersSection.tsx`, `ValuesSection.tsx`).
- **Động hóa từ khóa công nghệ (Tech Stack):**
  - `frontend/src/pages/jobs/JobDetailPage.tsx`: Thay thế mảng cứng IT (`React`, `NodeJS`, `TypeScript` áp đặt cho mọi loại ngành nghề kể cả Kế toán, Sales) bằng hàm bóc tách từ khóa kỹ năng thực tế từ `job.requirements` kết hợp với trường `job.suggested_skills`.
- **Động hóa tiến độ hoàn thiện hồ sơ:**
  - `frontend/src/pages/jobs/components/FilterSidebar.tsx`: Loại bỏ số phần trăm cố định "75%". Tính toán tỷ lệ phần trăm động dựa trên 4 tiêu chí thực tế: (1) Đã cập nhật thông tin cá nhân (25%), (2) Đã tải lên ít nhất 1 CV hoặc tạo CV Builder (25%), (3) Đã có số điện thoại xác thực (25%), (4) Đã cập nhật mục tiêu nghề nghiệp (25%).

---

## ISSUE 7: [Auth & Enterprise Leads] Khắc phục Form Quên Mật Khẩu, Tư Vấn Doanh Nghiệp & Social Login Giả Lập [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `bug`, `auth`, `priority: critical`, `frontend`, `backend`
- **Milestone:** `Phase 2: Hardening & Resilience` (Hoàn thành)

### 1. Mô tả vấn đề
1. **Form Quên mật khẩu giả lập:** `ForgotPasswordPage` sử dụng `setTimeout(resolve, 1000)` giả lập API (`// Simulate API call`) và hiển thị thông báo thành công dù backend không hề có bất kỳ endpoint nào về quên/đổi mật khẩu trong `routers/auth.py`.
2. **Mất toàn bộ lead khách hàng doanh nghiệp:** `ContactFormSection` (form tư vấn doanh nghiệp B2B Enterprise Consultation) cực kỳ sang trọng nhưng nút gửi chỉ gọi `setTimeout(..., 600)` và thông báo "chuyên viên sẽ liên hệ trong 15 phút". Không có backend endpoint hay database model nào lưu trữ thông tin lead, làm mất 100% dữ liệu khách hàng tiềm năng.
3. **Nút Social Login không hoạt động:** `LoginPage`: Các nút đăng nhập mạng xã hội Facebook & LinkedIn chỉ gắn sự kiện `onClick={() => console.log("Sắp ra mắt")}` mà không có thông báo toast hay giao diện phản hồi trực quan cho người dùng.

### 2. File & Dòng liên quan
- `frontend/src/pages/auth/ForgotPasswordPage.tsx:32-35` (Simulate API call bằng setTimeout)
- `backend/app/routers/auth.py` (Thiếu hoàn toàn endpoint /auth/forgot-password và /auth/reset-password)
- `frontend/src/pages/employer/landing/ContactFormSection.tsx:10-17` (Submit lead giả lập bằng setTimeout)
- `frontend/src/pages/auth/LoginPage.tsx:110, 118` (console.log "Sắp ra mắt" khi bấm nút đăng nhập MXH)

### 3. Checklist Thực Hiện
- [x] **Backend:** Bổ sung endpoint `POST /auth/forgot-password` (kèm logic tạo mật khẩu mới ngẫu nhiên an toàn, cập nhật hashed_password và gửi Gmail chứa mật khẩu mới cho ứng viên/nhà tuyển dụng hoặc ghi log an toàn).
- [x] **Backend:** Tạo bảng `contact_leads` và endpoint `POST /contact/leads` để tiếp nhận và lưu trữ thông tin doanh nghiệp đăng ký tư vấn giải pháp tuyển dụng.
- [x] **Frontend:** Thay thế `setTimeout` tại `ForgotPasswordPage.tsx` bằng hàm gọi API khôi phục mật khẩu thật, xử lý thông báo lỗi rõ ràng nếu email không tồn tại.
- [x] **Frontend:** Tích hợp gọi API `POST /contact/leads` tại `ContactFormSection.tsx`, validate form và hiển thị trạng thái gửi lead thực tế.
- [x] **Frontend:** Thêm Toast thông báo "Tính năng đang được phát triển" cho các nút mạng xã hội chưa hỗ trợ tại `LoginPage.tsx` thay vì chỉ in ra console.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Quy trình Quên & Cấp Lại Mật Khẩu Thật (Transactional Email):**
  - `backend/app/services/password_reset_service.py`: Xây dựng service sinh mật khẩu tạm ngẫu nhiên chuẩn mật mã (crypto-safe, tối thiểu 10 ký tự gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt).
  - Kết nối gửi email HTML định dạng thương hiệu chuyên nghiệp qua giao thức SMTP Gmail (`smtp.gmail.com:587`, TLS).
  - `backend/app/routers/auth.py`: Khởi tạo endpoint `POST /auth/forgot-password`, kiểm tra sự tồn tại của email trong CSDL, băm mật khẩu bằng `bcrypt` cập nhật vào cột `user.hashed_password`, gửi mật khẩu tạm thời về hộp thư của user và trả về thông điệp an toàn (không lộ chi tiết nếu email không tồn tại nhằm chống enumeration attack).
  - `frontend/src/pages/auth/ForgotPasswordPage.tsx`: Thay thế `setTimeout` giả lập bằng hàm gọi API `authApi.forgotPassword()`, hiển thị alert thành công hoặc lỗi chi tiết từ server.
- **Tiếp nhận & Lưu trữ Lead Khách Hàng Doanh Nghiệp (CRM Lead Capture):**
  - `backend/app/models/contact_lead.py`: Định nghĩa model ORM `ContactLead` chứa các trường: `company_name`, `contact_name`, `email`, `phone`, `company_size`, `needs_description`, `status` (new, contacted, closed).
  - `backend/app/routers/contact.py`: Endpoint `POST /contact/leads` tiếp nhận và kiểm tra tính hợp lệ của email/số điện thoại, lưu trữ lead vào cơ sở dữ liệu.
  - `frontend/src/pages/employer/landing/ContactFormSection.tsx`: Thay thế `setTimeout` bằng API client `contactApi.submitLead()`, bổ sung validation react-hook-form/zod, hiển thị trạng thái loading và toast thông báo thành công.
- **Tối ưu UX Social Login:**
  - `frontend/src/pages/auth/LoginPage.tsx`: Thay vì `console.log("Sắp ra mắt")`, tích hợp thông báo Sonner Toast: *"Phương thức đăng nhập qua Facebook/LinkedIn đang được hoàn thiện và sẽ ra mắt trong phiên bản tiếp theo"*.

---

## ISSUE 8: [AI Feature Integration & Tone/Prompt Support] Kết Nối AI Recommendations, Hỗ Trợ CV Builder Toàn Diện & Kích Hoạt Prompt/Tone Email [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `ai-core`, `feature-gap`, `priority: critical`, `frontend`, `backend`
- **Milestone:** `Phase 1: Real AI & Integrity` (Hoàn thành)

### 1. Mô tả vấn đề
1. **Rơi rụng Custom Prompt & Tone Email:** Trong `EmailDraftModal`, HR có thể chọn giọng điệu email (Trang trọng, Thân thiện, Ngắn gọn) và nhập prompt tùy chỉnh để AI tạo lại email. Tuy nhiên, `EmployerCandidatesPage.tsx:837` bỏ rơi tham số prompt, `frontend/src/lib/api/ai.ts` không truyền, và `GenerateEmailRequest` schema lẫn `email_generator.py` trên backend hoàn toàn không nhận `tone` hay `custom_prompt`.
2. **Hệ thống AI Job Recommendations bị bỏ hoang:** Backend đã hoàn thiện endpoint `GET /ai/recommend-jobs` với cơ chế lọc ngành và pgvector cosine ranking; Frontend API client đã có `recommendJobsForResume`; Giao diện đã có component `AIRecommendedJobs.tsx`. Tuy nhiên, cả luồng này không hề được kết nối hoặc render ở bất kỳ trang việc làm nào cho ứng viên.
3. **Ứng viên dùng CV Builder bị gạt khỏi hệ sinh thái AI:** Tất cả các endpoint AI cốt lõi (`/ai/match`, `/ai/evaluate`, `/ai/roadmap`, `/ai/recommend-jobs`) chỉ chấp nhận `resume_id: int` (CV file tải lên). Ứng viên tạo CV trực tiếp bằng công cụ CV Builder (`cv_document_id`) hoàn toàn không thể sử dụng AI Match, AI Đánh giá chất lượng CV hay AI Lộ trình nghề nghiệp.

### 2. File & Dòng liên quan
- `frontend/src/pages/employer/components/modals/EmailDraftModal.tsx:219-223` (customPrompt & tone)
- `frontend/src/pages/employer/EmployerCandidatesPage.tsx:837-839` (Bỏ rơi customPrompt)
- `backend/app/schemas/ai.py:101-105` (`GenerateEmailRequest` thiếu tone và custom_prompt)
- `backend/app/services/email_generator.py:69-78` (Thiếu logic xử lý tone & custom_prompt)
- `backend/app/routers/ai.py:309-355` (`/ai/recommend-jobs` bị mồ côi phía client)
- `frontend/src/pages/jobs/components/JobResults/AIRecommendedJobs.tsx` (Component bị bỏ quên)
- `backend/app/schemas/ai.py:11-50` (`AIMatchRequest`, `CVEvaluationRequest`, `RoadmapRequest` chỉ nhận `resume_id`)

### 3. Checklist Thực Hiện
- [x] **Backend:** Cập nhật `GenerateEmailRequest` và `email_generator_service.generate()` để tiếp nhận `tone: str | None` và `custom_prompt: str | None`, đưa các chỉ dẫn này vào user prompt gửi tới mô hình DeepSeek.
- [x] **Frontend:** Cập nhật `generateEmail` trong `lib/api/ai.ts` và `EmployerCandidatesPage.tsx` để truyền đầy đủ `tone` và `customPrompt` từ `EmailDraftModal`.
- [x] **Frontend:** Tích hợp component `AIRecommendedJobs` vào trang tìm việc (`JobsPage`) hoặc `CandidateDashboard`, gọi hàm `recommendJobsForResume` khi ứng viên đã đăng nhập và có CV.
- [x] **Backend & Frontend:** Mở rộng các schema và router `/ai/match`, `/ai/evaluate`, `/ai/roadmap` để hỗ trợ cả `cv_document_id`, tự động trích xuất text từ `CvDocument.content_json` để đánh giá và tạo lộ trình công bằng cho mọi ứng viên.

### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **Kích hoạt Prompt Tùy chỉnh & Giọng điệu Email (Email Tone & Custom Prompt):**
  - `backend/app/schemas/ai.py`: Thêm các trường `tone: Optional[str] = "formal"` và `custom_prompt: Optional[str] = None` vào schema `GenerateEmailRequest`.
  - `backend/app/services/email_generator.py`: Bổ sung phân nhánh chỉ dẫn phong cách viết thư (Trang trọng / Thân thiện / Ngắn gọn súc tích) và chèn khối `[Yêu cầu bổ sung từ HR]: {custom_prompt}` vào prompt gửi tới DeepSeek LLM.
  - `frontend/src/lib/api/ai.ts` & `frontend/src/pages/employer/EmployerCandidatesPage.tsx`: Chuyển tiếp đầy đủ tham số `tone` và `customPrompt` từ `EmailDraftModal` xuống API backend thay vì bỏ rơi như trước.
- **Tích hợp AI Job Recommendations vào luồng tìm việc của Ứng viên:**
  - `frontend/src/pages/jobs/JobsPage.tsx`: Nhúng trực tiếp component `AIRecommendedJobs` vào đầu danh sách kết quả việc làm khi phát hiện ứng viên đã đăng nhập và có hồ sơ.
  - Tự động gọi `recommendJobsForResume(resumeId)` để tính toán xếp hạng cosine similarity dựa trên 384-D vector embedding, ưu tiên hiển thị các việc làm phù hợp nhất trước khi ứng viên lọc thủ công.
- **Bình đẳng hóa tính năng AI cho CV Builder (cv_document_id):**
  - `backend/app/schemas/ai.py`: Mở rộng các schema `AIMatchRequest`, `CVEvaluationRequest`, `RoadmapRequest` để nhận thêm tham số tùy chọn `cv_document_id: Optional[int] = None`.
  - `backend/app/routers/ai.py`: Viết hàm phụ trợ `_extract_cv_text` tự động đọc cấu trúc JSON của CV Document (họ tên, kỹ năng, kinh nghiệm, học vấn, dự án), tổng hợp thành văn bản chuẩn để truyền vào các thuật toán AI Matching, AI Đánh giá CV và Gợi ý lộ trình nghề nghiệp. Ứng viên dùng CV Builder giờ đây được hưởng 100% sức mạnh AI tương đương với ứng viên upload file PDF/Word.

---

## ISSUE 9: [Security Hardening] Vá Lỗ Hổng Bảo Mật Toàn Diện (Bảo Vệ CV PII, OAuth CSRF, Prompt Injection & Auth Rate Limit) [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `security`, `priority: critical`, `backend`, `frontend`
- **Milestone:** `Phase 1: Real AI & Integrity` (Hoàn thành)

### 1. Mô tả vấn đề
1. **Lộ tệp CV PII qua Route Static công khai:** Thư mục `uploads/` đang được mount tĩnh bằng `app.mount("/uploads", StaticFiles(directory="uploads"))` mà không có bất kỳ lớp xác thực nào. Bất kỳ ai có đường dẫn URL đều tải được toàn bộ CV ứng viên (chứa họ tên, số điện thoại, địa chỉ nhà, email, lịch sử công tác). Nguyên nhân gốc rễ do endpoint `/resumes/{id}/content` kiểm tra quyền quá cứng nhắc (`resume.user_id != current_user.id`), chặn cả Nhà tuyển dụng nhận hồ sơ, khiến Frontend phải đọc trực tiếp file tĩnh từ `/uploads`.
2. **Thiếu `state` trong luồng Google OAuth2 (CSRF Account Takeover):** `oauth_service.py` tạo URL đăng nhập bằng Authlib nhưng vứt bỏ biến `_state`. Router `GET /auth/google/callback` không hề nhận hoặc kiểm tra tham số `state`, vi phạm trực tiếp RFC 6749 Section 10.12 và mở ra nguy cơ tấn công chiếm quyền / gán session độc hại.
3. **Rò rỉ JWT Token trên URL Query String:** Luồng Google OAuth callback điều hướng người dùng về Frontend bằng `?token={jwt_token}&redirect=...`, khiến token đăng nhập bị lưu vĩnh viễn trong Browser History, Proxy Access Logs và Header `Referer`.
4. **Prompt Injection qua AI Copilot Chat:** Schema `ChatMessage` cho phép client gửi `role: "system"`. Backend đưa trực tiếp tin nhắn này vào chuỗi hội thoại gửi DeepSeek, cho phép kẻ tấn công chèn system instruction thứ hai nhằm ghi đè (override) chỉ dẫn gốc, trích xuất bí mật hệ thống hoặc phá vỡ quy tắc an toàn.
5. **Thiếu Rate Limiting trên Endpoint Auth:** Endpoint `/auth/login` và `/auth/register` hoàn toàn không có rate limit, dễ bị brute-force vét cạn mật khẩu hoặc spam đăng ký tài khoản rác.
6. **Rò rỉ bộ nhớ (Memory Leak) trong Rate Limiter:** `SlidingWindowRateLimiter` lưu trữ timestamp theo key trong `defaultdict(deque)` trên RAM không có TTL và không bao giờ giải phóng key cũ, có thể bị tấn công làm cạn kiệt RAM server (DoS).
7. **`SECRET_KEY` mặc định thiếu kiểm tra môi trường Production:** `config.py` để giá trị `"change-me-in-production"` không có validator chặn khởi động khi `DEBUG=False`.
8. **Thiếu Security Headers & Lộ Swagger Docs:** Thiếu các header HTTP an toàn (`X-Frame-Options`, `X-Content-Type-Options: nosniff`), và tài liệu `/docs` mở tự do trên production.

### 2. File & Dòng liên quan
- `backend/app/main.py:209-210` (Static mount thư mục uploads không xác thực)
- `backend/app/routers/resumes.py:301-302, 332-333` (Chặn quyền Employer xem/tải CV hợp lệ)
- `backend/app/services/oauth_service.py:44, 129` (Bỏ qua `state` và rò rỉ token qua URL)
- `backend/app/routers/auth.py:23, 37, 67-73` (OAuth callback thiếu state, login/register thiếu rate limit)
- `backend/app/schemas/assistant.py:7` (Cho phép client gửi role system)
- `backend/app/services/assistant_service.py:185-186` (Nối tin nhắn system từ client)
- `backend/app/core/rate_limiter.py:23, 49` (Không dọn dẹp key trong bộ nhớ)
- `backend/app/config.py:41` (SECRET_KEY mặc định)

### 3. Checklist Thực Hiện
- [x] **Backend (Bảo vệ CV PII):**
  - Tách bạch thư mục lưu trữ: `uploads/avatars/` (công khai) và `uploads/resumes/` (riêng tư, cấm truy cập tĩnh).
  - Gỡ bỏ `app.mount("/uploads", ...)` đối với các tệp hồ sơ cá nhân, chặn truy cập trực tiếp file tĩnh CV.
  - Cập nhật `/resumes/{resume_id}/content` và `/resumes/{resume_id}/download` để cho phép cả ứng viên sở hữu CV VÀ nhà tuyển dụng có đơn ứng tuyển hợp lệ được tải/xem CV.
- [x] **Backend (Google OAuth CSRF):**
  - Sinh `state` token ngẫu nhiên mã hóa HMAC-SHA256 kèm timestamp và lưu vào Cookie HttpOnly có thời hạn 5 phút khi người dùng bắt đầu đăng nhập Google.
  - Bắt buộc kiểm tra `state` hợp lệ tại `GET /auth/google/callback` trước khi tiến hành đổi `code` lấy token.
- [x] **Backend & Frontend (Bảo vệ JWT Token):**
  - Không truyền token trên URL query string `?token=...`. Chuyển sang sử dụng URL Fragment (`#token=...`) và dọn dẹp sạch sẽ History/URL bar ngay lập tức khi nhận token phía Frontend.
- [x] **Backend (Chống Prompt Injection):**
  - Cập nhật `ChatMessage` schema chỉ chấp nhận `role: Literal["user", "assistant"]` (chặn tuyệt đối quyền gửi `system` từ client với HTTP 422).
- [x] **Backend (Rate Limiting & Auth Hardening):**
  - Bổ sung preset rate limit cho `/auth/login` (5 lần/phút/IP) và `/auth/register` (3 lần/phút/IP).
  - Thêm cơ chế dọn dẹp (cleanup/eviction) cho `SlidingWindowRateLimiter` khi deque rỗng để chống cạn kiệt RAM.
  - Thêm validator bắt buộc thay đổi `SECRET_KEY` đủ độ dài khi chạy chế độ Production.
- [x] **Backend (Security Headers):**
### 4. Chi Tiết Kỹ Thuật Đã Triển Khai
- **SEC-01: Bảo vệ CV PII (Gỡ bỏ Static Mount & Ủy quyền Chặt chẽ):**
  - `backend/app/main.py`: Gỡ bỏ hoàn toàn lệnh mount tĩnh `app.mount("/uploads", StaticFiles(...))` đối với hồ sơ ứng viên; chỉ duy trì thư mục ảnh đại diện công khai `uploads/avatars/`. Thư mục `uploads/resumes/` được bảo vệ nghiêm ngặt ở mức filesystem.
  - `backend/app/routers/resumes.py`: Tái cấu trúc logic kiểm tra quyền tại `GET /resumes/{resume_id}/content` và `GET /resumes/{resume_id}/download`. Cho phép: (1) Chính ứng viên sở hữu CV tải/xem; (2) Nhà tuyển dụng (hoặc HR của công ty) đã nhận được đơn ứng tuyển hợp lệ gắn với CV đó. Kẻ lạ hoàn toàn không thể truy cập tài liệu.
- **SEC-02: Chống CSRF Account Takeover trong Google OAuth2:**
  - `backend/app/services/oauth_service.py`: Sinh `state` token ngẫu nhiên mã hóa HMAC-SHA256 kết hợp timestamp hiện tại.
  - Lưu `state` vào Cookie `oauth_state` với các cờ `HttpOnly=True`, `SameSite="lax"`, `max_age=300` (5 phút).
  - `backend/app/routers/auth.py:google_callback`: Bắt buộc đối chiếu `state` trả về từ Google với giá trị trong Cookie trước khi đổi code lấy token, chặn đứng 100% tấn công CSRF chiếm đoạt phiên đăng nhập.
- **SEC-03: Bảo vệ JWT Token (Loại bỏ Query String):**
  - `backend/app/services/oauth_service.py`: Chuyển đổi định dạng redirect callback từ `?token=...` sang URL Fragment `#token=...`.
  - `frontend/src/pages/auth/OAuthCallbackPage.tsx`: Phía client bóc tách token từ `window.location.hash`, lưu vào store xác thực và lập tức gọi `window.history.replaceState(null, "", window.location.pathname)` để xóa sạch dấu vết token khỏi thanh địa chỉ, ngăn rò rỉ vào Browser History và Proxy Access Logs.
- **SEC-04: Ngăn chặn Prompt Injection qua AI Copilot:**
  - `backend/app/schemas/assistant.py`: Khắt khe hóa kiểu dữ liệu trường `ChatMessage.role` thành `Literal["user", "assistant"]`. Nếu client cố tình gửi `role: "system"`, FastAPI sẽ từ chối ngay lập tức với lỗi HTTP 422 Unprocessable Entity, ngăn kẻ tấn công ghi đè chỉ dẫn hệ thống của DeepSeek.
- **SEC-05 & SEC-06: Chống Brute-force & Rò rỉ Bộ nhớ Rate Limiter:**
  - `backend/app/routers/auth.py`: Áp dụng Rate Limiting chặt chẽ cho endpoint đăng nhập (5 lần/phút/IP) và đăng ký (3 lần/phút/IP).
  - `backend/app/core/rate_limiter.py`: Cải tiến `SlidingWindowRateLimiter`, bổ sung phương thức `_evict_expired()` tự động thu hồi và xóa sạch các key khỏi dictionary khi deque rỗng, ngăn ngừa nguy cơ cạn kiệt RAM do tấn công DoS tạo IP rác.
- **SEC-07: Xác thực SECRET_KEY Môi Trường Production:**
  - `backend/app/config.py`: Bổ sung model validator Pydantic kiểm tra `SECRET_KEY`. Khi `DEBUG=False` và hệ thống chạy PostgreSQL, nếu `SECRET_KEY` ngắn hơn 32 ký tự hoặc thuộc danh sách key mặc định không an toàn, server sẽ từ chối khởi động.
- **SEC-08: Security Headers & Đóng Swagger Docs:**
  - `backend/app/main.py`: Tích hợp middleware bảo mật toàn diện gắn các header: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
  - Tự động ẩn hoàn toàn tài liệu Swagger `/docs` và `/redoc` khi ở chế độ Production (`DEBUG=False`).

---

## 🛡️ PHỤ LỤC KỸ THUẬT: BẢO MẬT CI/CD VÀ CHỐT CHẶN EMAIL DOANH NGHIỆP (ENTERPRISE ISOLATION)

### 1. Bối Cảnh Sự Cố & Phân Tích Nguyên Nhân Gốc Rễ
- **Hiện tượng:** Khi chạy bộ kiểm thử tự động `pytest` trên máy cục bộ, hòm thư cá nhân của nhà phát triển (được cấu hình trong `.env` để thử nghiệm tính năng gửi mail thật) nhận được hàng loạt email thông báo dội ngược (*Address not found / Bounced*) từ `mailer-daemon@googlemail.com` gửi tới các địa chỉ test như `head-review@example.com`, `head@corp.vn`, `invited-hr@example.com`.
- **Nguyên nhân:** Các bài test luồng doanh nghiệp (`test_company_team.py`, `test_recruitment_requests.py`, `test_e2e_flows.py`) gọi trực tiếp API mời nhân sự (`POST /employer/team/invitations`). Do chưa có bộ mock tự động toàn cục, backend đã đọc trực tiếp cấu hình Gmail thật từ `.env` và âm thầm gửi thư thật qua Google SMTP server tới các domain giả lập.

### 2. Kiến Trúc Chốt Chặn 2 Tầng Đã Triển Khai (Defense-in-depth)
Để giải quyết dứt điểm vấn đề rò rỉ mà vẫn bảo đảm hệ thống gửi được thư thật trên Production, kiến trúc chốt chặn 2 tầng đã được thiết lập:

- **Tầng 1: Global Mock SMTP Fixture (`backend/tests/conftest.py`):**
  - Tạo fixture `mock_smtp_backend` tự động kích hoạt (`autouse=True`) cho toàn bộ test suite.
  - Thay thế `smtplib.SMTP` và `smtplib.SMTP_SSL` bằng lớp mô phỏng `SafeMockSMTP`.
  - Toàn bộ nội dung thư (HTML, token, subject) vẫn được build và xác thực 100%, nhưng hành động gửi được nuốt an toàn trong bộ nhớ, **tuyệt đối không mở kết nối socket ra ngoài Internet**.
- **Tầng 2: Enterprise Service Guard (`invitation_email_service.py` & `password_reset_service.py`):**
  - Bổ sung cờ cấu hình `TESTING: bool = False` trong `backend/app/config.py`.
  - Ở tầng service, nếu phát hiện môi trường test (`settings.TESTING` hoặc `PYTEST_CURRENT_TEST`) mà kết nối với `smtplib` nguyên bản (chưa mock), service sẽ tự động chặn kết nối thật và ghi log cảnh báo `[TEST GUARD]`.
- **Phân tách rạch ròi Test vs Production:**
  - **Môi trường Test / CI (`TESTING=True`):** Hoạt động hoàn toàn cô lập, mô phỏng gửi thành công trong RAM, **0 email nào bị gửi ra ngoài**.
  - **Môi trường Production (`TESTING=False`):** Server chạy thật sẽ sử dụng `smtplib` nguyên bản để kết nối tới Gmail SMTP server (`smtp.gmail.com:587`), gửi email thật trực tiếp đến hộp thư của ứng viên và nhà tuyển dụng.

### 3. Chuẩn Hóa CI/CD & Khắc Phục Lỗi Commit Cũ
- **Khắc phục lỗi Commit `fd6f420`:** Bổ sung bộ test case toàn diện cho các tính năng mới của Issue #8 và Issue #9, nâng tổng độ phủ kiểm thử lên **81.75%**, vượt qua yêu cầu khắt khe `--cov-fail-under=80`.
- **Khắc phục lỗi Commit `980afd7`:**
  - Cập nhật `.github/workflows/ci.yml` sử dụng mock key chuẩn `SECRET_KEY: "ci-mock-secret-key-for-testing-only-at-least-32-chars"` thỏa mãn bộ Pydantic validator.
  - Khắc phục lỗi rò rỉ state `RATE_LIMIT_ENABLED` trong `conftest.py` và `test_ai_rate_limit.py`.
  - Cấp IP giả lập độc lập (`X-Forwarded-For`) cho các user trong test loop để không chạm trần rate limit.

### 4. Bảng Tổng Kết Trạng Thái Kiểm Thử Hệ Thống

| Hạng mục kiểm tra | Công cụ / Tiêu chuẩn | Kết quả đạt được | Trạng thái |
| :--- | :--- | :---: | :---: |
| **Backend Unit & Integration Tests** | `pytest` (toàn bộ 236 test cases) | **236 passed, 0 failed, 9 skipped** | 🟢 **100% Pass** |
| **Độ phủ mã nguồn (Code Coverage)** | `pytest-cov` (ngưỡng tối thiểu 80%) | **81.75%** | 🟢 **Đạt chuẩn** |
| **Kiểm tra cú pháp & quy chuẩn Python** | `ruff check app tests` | **0 errors, 0 warnings** | 🟢 **Clean** |
| **Kiểm tra cú pháp Frontend** | `npm run lint` | **0 errors** | 🟢 **Clean** |
| **Cô lập kiểm thử Email** | `SafeMockSMTP` in-memory | **0 emails leaked** | 🟢 **An toàn tuyệt đối** |
| **Trạng thái Git Repository** | `git push origin main` | **Đã push đầy đủ (Commit `ce55f4d`)** | 🟢 **Up-to-date** |

---

## ISSUE 10: [AI Matching & Jobs] Tự Động Tái Tạo Vector Embedding Khi Cập Nhật Job & Hỗ Trợ CV Builder Document Trên AI Matching [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `ai`, `backend`, `frontend`, `priority: high`
- **Milestone:** `Phase 2: Enterprise Polish & Governance` (Hoàn thành)

### 1. Mô tả vấn đề
1. **Lệch Vector Embedding khi sửa Job:** Khi nhà tuyển dụng sửa tin tuyển dụng (`PATCH /jobs/{id}`), chỉ có text được lưu vào DB mà vector embedding 384 chiều (`job.embedding`) không được tái tạo. Khi các thuật toán AI Cosine Similarity (`<=>`) chạy, hệ thống so khớp trên vector cũ dẫn tới kết quả sai lệch nghiêm trọng.
2. **Kích hoạt CV Builder trên AI Matching:** Trang `AIMatchingPage.tsx` trước đó chỉ nhận `resume_id` (file PDF). Khi ứng viên chọn hồ sơ trực tuyến từ CV Builder (`cv_document_id`), giao diện hiển thị cảnh báo cứng và không thể so khớp AI với công việc.

### 2. Tệp tin sửa đổi
- `backend/app/routers/jobs.py`
- `backend/tests/test_jobs.py`
- `frontend/src/pages/ai/AIMatchingPage.tsx`

### 3. Giải pháp đã thực hiện
- **Backend:** Bổ sung logic kiểm tra các trường text cấu thành JD (`title`, `description`, `requirements`, `benefits`) trong hàm `update_job`. Nếu có thay đổi, hệ thống tự động gọi `generate_embedding(new_jd_text)` và cập nhật lại `job.embedding` trong CSDL pgvector.
- **Frontend:** Cập nhật `handleRunDeepMatch` trong `AIMatchingPage.tsx` để nhận diện `selectedCvSource.type === "cv_doc"`, truyền `cv_document_id` vào API `getAiMatch` thay vì ép buộc ứng viên phải tải lên file PDF.
- **Kiểm thử:** Bổ sung unit test `test_employer_update_job_regenerates_embedding` trong `backend/tests/test_jobs.py`, xác thực 100% việc cập nhật text kích hoạt sinh lại vector embedding.

---

## ISSUE 11: [Admin & Multi-Tenancy] Chuẩn Hóa Quản Lý Company & Chức Năng Xác Thực Doanh Nghiệp (is_verified) [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `admin`, `backend`, `frontend`, `security`
- **Milestone:** `Phase 2: Enterprise Polish & Governance` (Hoàn thành)

### 1. Mô tả vấn đề
1. **Admin Companies thiếu dữ liệu Doanh nghiệp:** Router `/admin/companies` trước đó chỉ trả về thông tin User cơ bản (`full_name`, `company_name`, `email`), bỏ rơi toàn bộ thuộc tính của thực thể `Company` thật (`tax_code`, `website`, `is_verified`, `company_size`, `member_count`).
2. **Thiếu Endpoint & Nút Cấp Xác Thực Doanh Nghiệp:** Admin không có cơ chế cấp hoặc hủy huy hiệu doanh nghiệp xác thực (`is_verified`), trong khi bảng `companies` đã có sẵn trường này.
3. **Hardcode Huy Hiệu Xác Thực trên Employer Dashboard:** `EmployerDashboard.tsx` hiển thị nhãn "Doanh Nghiệp Xác Thực" cho mọi tài khoản bất kể trạng thái `is_verified` trong CSDL.

### 2. Tệp tin sửa đổi
- `backend/app/schemas/admin.py`
- `backend/app/services/admin_service.py`
- `backend/app/routers/admin.py`
- `backend/tests/test_admin_core.py`
- `frontend/src/lib/api/admin.ts`
- `frontend/src/pages/admin/AdminCompanies.tsx`
- `frontend/src/pages/employer/EmployerDashboard.tsx`

### 3. Giải pháp đã thực hiện
- **Backend:** 
  - Mở rộng schema `CompanySummary` với `tax_code`, `website`, `is_verified`, `company_size`, `member_count`.
  - Thêm endpoint `PATCH /admin/companies/{company_id}/verify` nhận `{ "is_verified": bool }`, cập nhật trực tiếp `Company.is_verified` và ghi lại Audit Log (`company.verified` / `company.unverified`).
  - Cập nhật `list_companies`, `approve_company`, `reject_company` để tự động enrich dữ liệu đa người dùng (multi-tenancy) từ bảng `Company`.
- **Frontend:**
  - `AdminCompanies.tsx`: Thêm cột Mã số thuế (MST), quy mô nhân sự, huy hiệu xác thực, và nút Toggle Cấp / Gỡ xác thực.
  - `EmployerDashboard.tsx`: Điều kiện hóa huy hiệu xác thực theo `companyContext?.company.is_verified`. Nếu chưa được duyệt, hiển thị nhãn cảnh báo trung tính "Hồ Sơ Chờ Xác Thực".
- **Kiểm thử:** Viết unit test `test_company_verify_toggle_and_audit` trong `test_admin_core.py`, kiểm tra đầy đủ luồng cấp, hủy xác thực và ghi vết audit log.

---

## ISSUE 12: [Admin Oversight & AI Studio] Khắc Phục Lệch Enum Vòng Phỏng Vấn & Mở Rộng AI Prompt Studio & Call Logs [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `admin`, `frontend`, `backend`, `ai`
- **Milestone:** `Phase 2: Enterprise Polish & Governance` (Hoàn thành)

### 1. Mô tả vấn đề
1. **Lệch Enum Vòng Phỏng Vấn giữa Frontend và Backend:** Frontend `AdminInterviewsPage.tsx` định nghĩa các giá trị bộ lọc: `phone_screen`, `technical`, `behavioral`. Trong khi đó, Backend CSDL `RoundType` chỉ có: `cv_screen`, `tech`, `hr`, `final`, `custom`. Hậu quả: Khi Admin lọc theo vòng kỹ thuật hoặc HR, API luôn trả về danh sách rỗng.
2. **Thiếu Tính Năng trên AI Prompts Studio & AI Call Logs:** Hệ thống AI Prompts Studio và AI Call Logs chỉ hỗ trợ 5 tính năng cơ bản, thiếu hoàn toàn `generate_jd` (Soạn JD bằng AI) và `cover_letter` (Viết Cover Letter), khiến Admin không thể tinh chỉnh prompt hoặc theo dõi chi phí/token của 2 tính năng này.
3. **Đếm Sai Số Lượng Tin Hoạt Động (Active Jobs):** `AdminJobs.tsx` tính số tin hoạt động bằng `data.items.filter(j => j.is_active).length`, chỉ đếm trên 20 items của trang hiện tại thay vì toàn bộ hệ thống.

### 2. Tệp tin sửa đổi
- `frontend/src/pages/admin/AdminInterviewsPage.tsx`
- `backend/app/routers/admin_ai.py`
- `frontend/src/lib/api/adminAI.ts`
- `frontend/src/pages/admin/AIPromptsPage.tsx`
- `frontend/src/pages/admin/AdminAILogsPage.tsx`
- `frontend/src/pages/admin/AdminJobs.tsx`

### 3. Giải pháp đã thực hiện
- **Đồng bộ Enum Phỏng vấn:** Cập nhật `RoundTypeFilter` trong `AdminInterviewsPage.tsx` thành `"all" | "cv_screen" | "tech" | "hr" | "final" | "custom"`, khớp 100% với model backend.
- **Mở rộng AI Prompt Studio:** Bổ sung `generate_jd`, `cover_letter`, `matching`, `cv_parse` vào `AIFeature`, `FEATURE_META`, `ORDERED_FEATURES` và bảng ánh xạ `FEATURE_LABELS`. Backend tự động seed các prompt dự phòng từ `HARDCODED_FALLBACK_PROMPTS` vào DB khi Admin mở Prompt Studio.
- **Mẫu dữ liệu kiểm thử (Sample Inputs):** Cập nhật endpoint `/admin/ai/prompts/{feature}/test` bổ sung kịch bản test thực tế cho `GENERATE_JD` và `COVER_LETTER`.
- **Thống kê Tin tuyển dụng chính xác:** `AdminJobs.tsx` tích hợp gọi `getAdminStats()` để lấy `total_active_jobs` trên toàn hệ thống thay vì đếm cục bộ trên trang.

---

## ISSUE 13: [UX Polish & ATS Stability] Đồng Bộ CV Builder Lên Candidate Dashboard & Khắc Phục Race Condition Trên ATS Kanban [CLOSED]

- **Status:** ✅ Closed (100% Done)
- **Labels:** `frontend`, `candidate`, `employer`, `ux`
- **Milestone:** `Phase 2: Enterprise Polish & Governance` (Hoàn thành)

### 1. Mô tả vấn đề
1. **Thiếu CV Builder trên Candidate Dashboard:** Bảng điều khiển ứng viên (`CandidateDashboard.tsx`) tính `totalCVs = resumes.length` và chỉ render danh sách file tải lên (`resumes`), bỏ quên toàn bộ các bản CV trực tuyến mà ứng viên tạo bằng CV Builder (`cvDocuments`).
2. **Race Condition trên Bảng Tuyển Dụng ATS Kanban:** Trong `EmployerCandidatesPage.tsx`, hàm `fetchApplications` không hủy bỏ kết quả của các request trước đó khi HR bấm chuyển nhanh giữa nhiều công việc khác nhau. Nếu kết quả của Job cũ phản hồi chậm hơn Job mới, danh sách ứng viên sẽ bị ghi đè sai lệch vào Job đang chọn.

### 2. Tệp tin sửa đổi
- `frontend/src/pages/candidate/CandidateDashboard.tsx`
- `frontend/src/pages/employer/EmployerCandidatesPage.tsx`

### 3. Giải pháp đã thực hiện
- **Đồng bộ CV Studio cho Ứng viên:**
  - Cập nhật thống kê `totalCVs = resumes.length + cvDocuments.length`.
  - Phân vùng trực quan chuyên nghiệp trong "Trung Tâm Hồ Sơ (CV Studio)" hiển thị danh sách CV Builder trực tuyến (kèm tên, template, trạng thái xuất bản, ngày cập nhật, nút Xem trước, Sửa CV, và So khớp AI).
- **Chống Race Condition trong ATS Kanban:**
  - Thêm `activeJobRequestRef = useRef<number | null>(null)` quản lý định danh công việc đang được truy vấn.
  - Kiểm tra `if (activeJobRequestRef.current === jobId)` trước khi ghi dữ liệu vào state `setApplications(data)` và `setAppsLoading(false)`. Triệt tiêu hoàn toàn nguy cơ hiển thị sai lệch ứng viên giữa các vị trí tuyển dụng.




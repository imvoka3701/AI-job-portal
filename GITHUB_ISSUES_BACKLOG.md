# DANH SÁCH GITHUB ISSUES & ACTION CHECKLIST
## Hệ Thống AI-Powered Job Portal — Khắc Phục Lỗi Audit Fullstack

Tài liệu này được định dạng chuẩn **GitHub Markdown**. Bạn có thể sao chép trực tiếp từng mục dưới đây để nhấn **"New issue"** trên GitHub repository `imvoka3701/AI-job-portal` hoặc theo dõi tiến độ thực hiện trực tiếp tại file này.

---

## 📌 BẢNG ĐIỀU HƯỚNG CÁC ISSUES

| Issue | Tiêu đề | Mức độ | Số lỗi giải quyết | Nhãn (Labels) |
| :---: | :--- | :---: | :---: | :--- |
| **#1** | [[AI Core] Loại bỏ Mock Cover Letter & Kích hoạt AI Matching thật cho CV Builder](#issue-1-ai-core-loại-bỏ-mock-cover-letter--kích-hoạt-ai-matching-thật-cho-cv-builder) | 🔴 Critical | 3 (1.1, 3.2, 3.3) | `bug`, `ai-core`, `critical` |
| **#2** | [[Dashboard] Loại bỏ toàn bộ Dữ liệu Ảo & Fallback số liệu cố định trên Admin & Employer](#issue-2-dashboard-loại-bỏ-toàn-bộ-dữ-liệu-ảo--fallback-số-liệu-cố-định-trên-admin--employer) | 🔴 Critical | 4 (1.3, 1.4, 1.5, 1.6) | `bug`, `data-integrity`, `dashboard` |
| **#3** | [[Backend] Fix Race Condition Singleton CV Evaluator & Kích hoạt ghi cột DB rỗng](#issue-3-backend-fix-race-condition-singleton-cv-evaluator--kích-hoạt-ghi-cột-db-rỗng) | 🔴 Critical | 4 (2.3, 3.1, 4.1, 4.2) | `bug`, `backend`, `concurrency` |
| **#4** | [[UI Truthfulness] Chuẩn hóa Vector Embedding 384D & Điều kiện hóa Badge Xác thực Doanh nghiệp](#issue-4-ui-truthfulness-chuẩn-hóa-vector-embedding-384d--điều-kiện-hóa-badge-xác-thực-doanh-nghiệp) | 🔴 Critical | 4 (1.9, 5.1, 5.2, 5.3) | `ui/ux`, `accuracy`, `enhancement` |
| **#5** | [[Settings & Errors] Hoàn thiện lưu cài đặt AI Doanh nghiệp & Xử lý triệt để Exception bị nuốt](#issue-5-settings--errors-hoàn-thiện-lưu-cài-đặt-ai-doanh-nghiệp--xử-lý-triệt-để-exception-bị-nuốt) | 🟡 Medium | 4 (1.2, 1.10, 4.3, 4.4) | `feature`, `error-handling`, `settings` |
| **#6** | [[Clean-up] Dọn dẹp Code Mồ Côi & Động hóa Tech Stacks / Tỷ lệ hoàn thiện hồ sơ](#issue-6-clean-up-dọn-dẹp-code-mồ-côi--động-hóa-tech-stacks--tỷ-lệ-hoàn-thiện-hồ-sơ) | 🟢 Low | 4 (1.7, 1.8, 2.1, 2.2) | `refactor`, `clean-up` |
| **#7** | [[Auth & Leads] Khắc phục Form Quên Mật Khẩu & Tư Vấn Doanh Nghiệp dùng setTimeout giả lập](#issue-7-auth--leads-khắc-phục-form-quên-mật-khẩu--tư-vấn-doanh-nghiệp-dùng-settimeout-giả-lập) | 🔴 Critical | 2 (Mới phát hiện) | `bug`, `auth`, `critical` |
| **#8** | [[AI Feature Gap] Tích hợp AI Job Recommendations & Hỗ trợ CV Builder cho AI Evaluate/Roadmap](#issue-8-ai-feature-gap-tích-hợp-ai-job-recommendations--hỗ-trợ-cv-builder-cho-ai-evaluateroadmap) | 🔴 Critical | 3 (Mới phát hiện) | `ai-core`, `feature-gap`, `critical` |
| **#9** | [[Security Hardening] Vá Lỗ Hổng Bảo Mật Toàn Diện (Bảo Vệ CV PII, OAuth CSRF, Prompt Injection & Rate Limit)](#issue-9-security-hardening-vá-lỗ-hổng-bảo-mật-toàn-diện-bảo-vệ-cv-pii-oauth-csrf-prompt-injection--auth-rate-limit) | 🔴 Critical | 8 (SEC-01 -> SEC-08) | `security`, `critical`, `backend`, `frontend` |

---

## ISSUE 1: [AI Core] Loại bỏ Mock Cover Letter & Kích hoạt AI Matching thật cho CV Builder

- **Labels:** `bug`, `ai-core`, `priority: critical`, `frontend`, `backend`
- **Milestone:** `Phase 1: Real AI & Integrity`

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

---

## ISSUE 2: [Dashboard] Loại bỏ toàn bộ Dữ liệu Ảo & Fallback số liệu cố định trên Admin & Employer

- **Labels:** `bug`, `data-integrity`, `priority: critical`, `dashboard`
- **Milestone:** `Phase 1: Real AI & Integrity`

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

---

## ISSUE 3: [Backend] Fix Race Condition Singleton CV Evaluator & Kích hoạt ghi cột DB rỗng

- **Labels:** `bug`, `backend`, `priority: critical`, `concurrency`, `database`
- **Milestone:** `Phase 1: Real AI & Integrity`

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

---

## ISSUE 4: [UI Truthfulness] Chuẩn hóa Vector Embedding 384D & Điều kiện hóa Badge Xác thực Doanh nghiệp

- **Labels:** `ui/ux`, `accuracy`, `priority: critical`, `frontend`
- **Milestone:** `Phase 1: Real AI & Integrity`

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
- [ ] **Frontend:** Sửa toàn bộ văn bản marketing và chú giải công nghệ từ "1536 chiều" thành **"384 chiều (paraphrase-multilingual-MiniLM)"** chuẩn xác theo kiến trúc hệ thống.
- [ ] **Backend & Frontend:** Bổ sung cột `is_verified: bool = False` vào model `Company` hoặc chỉ hiển thị badge xác thực khi công ty đã được Admin duyệt giấy phép kinh doanh/MST hợp lệ.
- [ ] **Frontend:** Điều chỉnh thanh hiển thị mức lương trên `JobDetailPage` dựa trên khoảng lương thực tế của JD (`salary_min` đến `salary_max`), thay thế nhãn gán cứng bằng mô tả trực quan thực tế.

---

## ISSUE 5: [Settings & Errors] Hoàn thiện lưu cài đặt AI Doanh nghiệp & Xử lý triệt để Exception bị nuốt

- **Labels:** `feature`, `error-handling`, `settings`, `priority: medium`, `frontend`, `backend`
- **Milestone:** `Phase 2: Hardening & Resilience`

### 1. Mô tả vấn đề
1. `EmployerSettingsPage`: Tab "Cấu hình AI & Matching" và "Bảo mật & Webhook" chỉ có các thanh trượt và toggle hiển thị trên giao diện, khi bấm "Lưu cài đặt" chỉ có thông tin công ty được gửi lên API, toàn bộ cấu hình AI bị mất khi refresh trang.
2. `AIMatchingPage`: State setter `const [, setJobsError] = useState(...)` bỏ qua lỗi tải danh sách tin tuyển dụng, đồng thời khối catch khi tải danh sách CV của ứng viên bị nuốt âm thầm.
3. `JobDetailPage`: Nuốt lỗi tải tài liệu ứng viên và tính điểm matching.

### 2. File & Dòng liên quan
- `frontend/src/pages/employer/EmployerSettingsPage.tsx:60-75, 109-130`
- `frontend/src/pages/ai/AIMatchingPage.tsx:134, 178-180, 201`
- `frontend/src/pages/jobs/JobDetailPage.tsx:129-131, 220-222`

### 3. Checklist Thực Hiện
- [ ] **Backend:** Bổ sung cấu trúc lưu trữ `ai_matching_weights` và `webhook_config` (sử dụng cột JSON trên bảng `companies` hoặc bảng cấu hình riêng).
- [ ] **Frontend:** Gắn các trường cấu hình AI và Webhook vào payload gửi lên API khi bấm "Lưu cài đặt" tại `EmployerSettingsPage`.
- [ ] **Frontend:** Bổ sung biến `jobsError` tại `AIMatchingPage` và hiển thị banner thông báo lỗi kèm nút "Thử lại" khi API thất bại.
- [ ] **Frontend:** Bổ sung hiển thị thông báo lỗi khi tải CV hoặc tính điểm matching không thành công trên `JobDetailPage`.

---

## ISSUE 6: [Clean-up] Dọn dẹp Code Mồ Côi & Động hóa Tech Stacks / Tỷ lệ hoàn thiện hồ sơ

- **Labels:** `refactor`, `clean-up`, `priority: low`, `frontend`, `backend`
- **Milestone:** `Phase 3: Polish & Maintenance`

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
- [ ] **Backend:** Xóa file mồ côi `backend/app/services/assessment_scorer.py`.
- [ ] **Frontend:** Rà soát và xóa các component mồ côi không dùng đến hoặc tích hợp vào landing page nếu phù hợp.
- [ ] **Frontend:** Tự động trích xuất các từ khóa công nghệ thật từ `job.requirements` hoặc `suggested_skills` thay cho mảng IT cứng `techStackList`.
- [ ] **Frontend:** Động hóa tỷ lệ hoàn thiện hồ sơ ứng viên trên `FilterSidebar` dựa trên trạng thái thực tế của tài khoản.

---

## ISSUE 7: [Auth & Enterprise Leads] Khắc phục Form Quên Mật Khẩu, Tư Vấn Doanh Nghiệp & Social Login Giả Lập

- **Labels:** `bug`, `auth`, `priority: critical`, `frontend`, `backend`
- **Milestone:** `Phase 2: Hardening & Resilience`

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
- [ ] **Backend:** Bổ sung endpoint `POST /auth/forgot-password` và `POST /auth/reset-password` (kèm logic tạo token reset có hạn sử dụng và gửi mail hoặc ghi log an toàn).
- [ ] **Backend:** Tạo bảng `contact_leads` và endpoint `POST /contact/leads` để tiếp nhận và lưu trữ thông tin doanh nghiệp đăng ký tư vấn giải pháp tuyển dụng.
- [ ] **Frontend:** Thay thế `setTimeout` tại `ForgotPasswordPage.tsx` bằng hàm gọi API khôi phục mật khẩu thật, xử lý thông báo lỗi rõ ràng nếu email không tồn tại.
- [ ] **Frontend:** Tích hợp gọi API `POST /contact/leads` tại `ContactFormSection.tsx`, validate form bằng Zod và hiển thị trạng thái gửi lead thực tế.
- [ ] **Frontend:** Thêm Toast thông báo "Tính năng đang được phát triển" hoặc ẩn/disable các nút mạng xã hội chưa hỗ trợ tại `LoginPage.tsx` thay vì chỉ in ra console.

---

## ISSUE 8: [AI Feature Integration & Tone/Prompt Support] Kết Nối AI Recommendations, Hỗ Trợ CV Builder Toàn Diện & Kích Hoạt Prompt/Tone Email

- **Labels:** `ai-core`, `feature-gap`, `priority: critical`, `frontend`, `backend`
- **Milestone:** `Phase 1: Real AI & Integrity`

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
- [ ] **Backend:** Cập nhật `GenerateEmailRequest` và `email_generator_service.generate()` để tiếp nhận `tone: str | None` và `custom_prompt: str | None`, đưa các chỉ dẫn này vào user prompt gửi tới mô hình DeepSeek.
- [ ] **Frontend:** Cập nhật `generateEmail` trong `lib/api/ai.ts` và `EmployerCandidatesPage.tsx` để truyền đầy đủ `tone` và `customPrompt` từ `EmailDraftModal`.
- [ ] **Frontend:** Tích hợp component `AIRecommendedJobs` vào trang tìm việc (`JobsPage`) hoặc `CandidateDashboard`, gọi hàm `recommendJobsForResume` khi ứng viên đã đăng nhập và có CV.
- [ ] **Backend & Frontend:** Mở rộng các schema và router `/ai/match`, `/ai/evaluate`, `/ai/roadmap` để hỗ trợ cả `cv_document_id`, tự động trích xuất text từ `CvDocument.content_json` để đánh giá và tạo lộ trình công bằng cho mọi ứng viên.

---

## ISSUE 9: [Security Hardening] Vá Lỗ Hổng Bảo Mật Toàn Diện (Bảo Vệ CV PII, OAuth CSRF, Prompt Injection & Auth Rate Limit)

- **Labels:** `security`, `priority: critical`, `backend`, `frontend`
- **Milestone:** `Phase 1: Real AI & Integrity`

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
- [ ] **Backend (Rate Limiting & Auth Hardening):**
  - Bổ sung preset rate limit cho `/auth/login` (5 lần/phút/IP) và `/auth/register` (3 lần/phút/IP).
  - Thêm cơ chế dọn dẹp (cleanup/eviction) cho `SlidingWindowRateLimiter` khi deque rỗng để chống cạn kiệt RAM.
  - Thêm validator bắt buộc thay đổi `SECRET_KEY` đủ độ dài khi chạy chế độ Production.
- [ ] **Backend (Security Headers):**
  - Thêm middleware thiết lập `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
  - Tắt `/docs` và `/redoc` khi môi trường là Production (`DEBUG=False`).


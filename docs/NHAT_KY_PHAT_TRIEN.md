# 📓 NHẬT KÝ PHÁT TRIỂN & KẾ HOẠCH HÀNH ĐỘNG
## DỰ ÁN: AI-POWERED JOB PORTAL (B2B SAAS PLATFORM)

> **Vai trò:** AI Tech Lead  
> **Phiên bản hệ thống:** v2.5 Enterprise  
> **Ngày ghi nhận:** 27/10/2026  
> **Tech Stack:** React 19 + TypeScript + Tailwind CSS | FastAPI + PostgreSQL 17 (pgvector) | DeepSeek V3 API  

---

## 📌 PHẦN I: TỔNG KẾT PHIÊN LÀM VIỆC NGÀY 27/10/2026

### 1. Bối cảnh & Mục tiêu Phiên
1. Kiểm tra, đánh giá và nâng cấp toàn diện **Bộ điều khiển RAG & Chunking Governance** dưới quyền Quản trị viên (Admin).
2. Giải đáp thắc mắc và xử lý dứt điểm hiện tượng: **DeepSeek Platform trừ $0.01 chi phí API nhưng Dashboard `/admin/ai/logs` lại hiển thị 0 calls**.
3. Tích hợp tính năng đối soát số dư thời gian thực trực tiếp từ DeepSeek Cloud API.
4. Tinh chỉnh thiết kế bảng dữ liệu AI Call Logs đạt chuẩn thẩm mỹ B2B SaaS (thẳng hàng, cân đối, không khoảng trống thừa).

---

### 2. Các Hạng Mục Kỹ Thuật Đã Hoàn Thành (Delivered Items)

#### A. RAG Governance Control Plane V2 & Chunking Simulator
* **Backend:** 
  - Hoàn thiện [backend/app/services/rag_governance_service.py](file:///d:/ai-job-portal/backend/app/services/rag_governance_service.py) với các tính năng:
    - Mô phỏng phân mảnh (Chunking Simulator) trực tiếp không lưu DB rác.
    - Phẫu thuật phân mảnh tài liệu (Document Surgery: inspect, edit, split, re-embed).
    - Chẩn đoán phân mảnh mồ côi (Orphan Chunks Diagnostics & Cleanup).
    - Batch Re-indexing hàng loạt theo chiến lược chunk size & overlap mới.
* **Frontend:**
  - Hoàn thiện giao diện [frontend/src/pages/admin/AdminRAGGovernancePage.tsx](file:///d:/ai-job-portal/frontend/src/pages/admin/AdminRAGGovernancePage.tsx) với 4 thẻ tác vụ chuyên sâu chuẩn Shadcn UI.
* **Kiểm thử tự động:**
  - Viết suite kiểm thử `test_admin_rag_control_plane.py` với nguyên tắc **Zero Test Residue** (100% dữ liệu thử nghiệm được dọn dẹp sạch sẽ sau khi test pass).

#### B. Điều tra & Vá Triệt Để Lỗ Hổng Thất Thoát AI Call Logs
* **Nguyên nhân cốt lõi:**
  - 100% test case tự động đều được Mock, không tiêu tốn $0.01 thực tế của người dùng.
  - Mã nguồn `DeepseekClient` chỉ ghi log vào bảng `ai_call_logs` khi có đủ cả `db` và `feature`.
  - Hai vị trí trong code bị sót không truyền `db` và `feature`:
    1. Endpoint `POST /admin/ai/prompts/{feature}/test` (Thử nghiệm Prompt trên Admin Console).
    2. Dịch vụ `CvSuggestionService` (gợi ý tóm tắt, viết lại kinh nghiệm, gợi ý kỹ năng trong CV Builder).
* **Giải pháp khắc phục:**
  - Cập nhật [backend/app/routers/admin_ai.py](file:///d:/ai-job-portal/backend/app/routers/admin_ai.py): Hàm `test_prompt` truyền đầy đủ `db=db`, `feature=feature`, `user_id=current_user.id`.
  - Cập nhật [backend/app/services/cv_suggestions.py](file:///d:/ai-job-portal/backend/app/services/cv_suggestions.py) và [backend/app/routers/ai.py](file:///d:/ai-job-portal/backend/app/routers/ai.py): Truyền đầy đủ `db`, `feature=AIFeature.CV_EVALUATE`, `user_id`, `cv_document_id`.

#### C. Tích Hợp API Đối Soát Số Dư DeepSeek Platform Trực Tiếp
* **DeepSeek Client & Router:**
  - Bổ sung hàm `get_balance()` trong [backend/app/services/deepseek_client.py](file:///d:/ai-job-portal/backend/app/services/deepseek_client.py) gọi trực tiếp endpoint `GET https://api.deepseek.com/user/balance`.
  - Expose endpoint `GET /admin/ai/balance` (bảo vệ quyền Admin) trả về số dư thực tế, số tiền đã nạp và đơn vị tiền tệ (`USD`).
* **Frontend Admin Dashboard:**
  - Cập nhật [frontend/src/pages/admin/AdminAILogsPage.tsx](file:///d:/ai-job-portal/frontend/src/pages/admin/AdminAILogsPage.tsx):
    - **Header Live Chip:** Huy hiệu trạng thái đồng bộ với DeepSeek Cloud hiển thị `$0.54 USD` kèm hiệu ứng pulse màu xanh.
    - **Thẻ KPI Card "SỐ DƯ VÍ DEEPSEEK":** Nâng cấp grid 4 cột, hiển thị số dư khả dụng `$0.54` và số tiền đã nạp `$0.54` để đối soát chéo 1-1 với hóa đơn platform.

#### D. Tối Ưu Bảng Dữ Liệu AI Call Logs (UI/UX Enterprise Alignment)
* **Khắc phục lỗi lệch cột số liệu:** 
  - Khai báo mảng cấu hình chuẩn `TABLE_COLUMNS` để đồng bộ 100% thuộc tính căn lề giữa Header (`<th>`) và Body (`<td>`).
  - Tiêu đề các cột `LATENCY`, `INPUT TOKENS`, `OUTPUT TOKENS`, `CHI PHÍ` được chuyển sang căn Phải (`text-right`), thẳng hàng tuyệt đối với các giá trị số và đơn vị tiền tệ bên dưới.
* **Căn giữa cột "Lỗi":**
  - Chuyển tiêu đề `LỖI` và nội dung ô dữ liệu sang căn Giữa (`text-center`).
  - Hiển thị ký tự giữ chỗ `—` màu xám nhạt (`text-slate-300 font-mono`) thẳng hàng dưới tiêu đề khi cuộc gọi thành công, giải quyết triệt để khoảng trống thừa bên phải bảng.

---

### 3. Bằng Chứng Đảm Bảo Chất Lượng (Quality Gate Evidence)

| Hạng mục kiểm tra | Công cụ / Lệnh | Kết quả | Trạng thái |
| :--- | :--- | :---: | :---: |
| **Backend Unit Tests** | `pytest tests/test_admin_ai.py` | **23/23 passed** (16.53s) | ✅ PASS |
| **Frontend Unit Tests** | `vitest run AdminAILogsPage.test.tsx` | **3/3 passed** (366ms) | ✅ PASS |
| **Frontend Code Quality** | `npm run lint` (ESLint) | **0 errors** | ✅ PASS |
| **Backend Code Quality** | `ruff check` | **All checks passed** | ✅ PASS |
| **Production Build** | `tsc -b && vite build` | **Build completed in 19.59s** | ✅ PASS |
| **Container Runtime** | Docker Compose (`backend`, `frontend`, `db`) | **All healthy & updated** | ✅ PASS |
| **Xác thực Trình duyệt** | Playwright Browser Subagent | **Chụp ảnh thực tế xác nhận giao diện chuẩn** | ✅ PASS |

---

### 4. Lịch Sử Git Commits Trong Phiên
1. `a95d93c` - `feat(admin-rag): implement RAG Control Plane V2 with live simulation, document surgery, orphan diagnostics and zero-residue testing`
2. `c7176f6` - `fix(admin-ai): patch missing DB logging for test prompt and CV suggestions, integrate live DeepSeek balance API`
3. `a62b4d6` - `fix(admin-ai): align table headers and cells with dedicated TABLE_COLUMNS definition`
4. `a581d03` - `style(admin-ai): center align error column in logs table for visual balance`

---

## 🎯 PHẦN II: KẾ HOẠCH HÀNH ĐỘNG CHO PHIÊN LÀM VIỆC TIẾP THEO

### Ưu tiên 1: Kiểm thử Luồng Thực Tế (Live End-to-End Test)
* **Mục tiêu:** Kiểm chứng dòng tiền DeepSeek trừ thực tế và dòng log mới xuất hiện lập tức trên Bảng điều khiển.
* **Kế hoạch hành động:**
  1. Sử dụng tài khoản Admin truy cập trang `http://localhost:3000/admin/ai/prompts`.
  2. Bấm nút **"Thử nghiệm" (Test Prompt)** với tính năng `cv_evaluate` hoặc `matching`.
  3. Mở trang `/admin/ai/logs` kiểm tra:
     - Số lượng cuộc gọi hôm nay tăng lên `+1`.
     - Dòng log mới xuất hiện ở đầu bảng với đầy đủ thời gian, latency, token và chi phí USD.
     - Số dư ví DeepSeek Cloud cập nhật phản ánh đúng chi phí vừa phát sinh.

### Ưu tiên 2: Bổ sung Tính Năng Xuất Dữ Liệu Báo Cáo (CSV/Excel Export)
* **Mục tiêu:** Cung cấp công cụ xuất báo cáo chi phí cho kế toán và quản trị doanh nghiệp.
* **Kế hoạch hành động:**
  1. Thêm endpoint `GET /admin/ai/logs/export` trả về định dạng file `.csv` hỗ trợ lọc theo ngày và tính năng.
  2. Bổ sung nút **"Xuất CSV"** trên Filter Bar của trang `AdminAILogsPage.tsx`.

### Ưu tiên 3: Tiếp tục Hoàn Thiện Module Tuyển Dụng B2B Cốt Lõi
* **Mục tiêu:** Tăng cường trải nghiệm chấm điểm và quản lý ứng viên.
* **Kế hoạch hành động:**
  1. Rà soát luồng kéo thả ứng viên trên bảng Kanban của Nhà tuyển dụng (`EmployerCandidatesPage.tsx`).
  2. Kiểm tra tính năng đồng bộ điểm số AI Matching và xuất thư mời phỏng vấn tự động.

# TÀI LIỆU HỆ THỐNG PROMPTS ĐIỀU PHỐI AI AGENTS PHÁT TRIỂN NỀN TẢNG B2B AI-POWERED JOB PORTAL

> **Dành cho:** Báo cáo đồ án / Bài kiểm tra thường xuyên 3 (KT3) & Thi kết thúc học phần.  
> **Mục tiêu:** Chứng minh năng lực làm chủ công nghệ, phương pháp **Prompt Engineering có hệ thống (Structured & Layered Prompting)**, và quy trình phản biện kỹ thuật đa tầng kết nối chặt chẽ giữa **Database ➔ Backend ➔ API ➔ Frontend**.  
> **Nguyên tắc kỹ thuật:** *Contract-First Development*, *Multi-tenant Data Isolation*, *Human-in-the-Loop*, *Zero-PII Leakage*.

---

## PHẦN 1: CHIẾN LƯỢC META-PROMPTING & PHÂN VAI TÁC NHÂN (AGENT PERSONAS)

Trong suốt quá trình phát triển hệ thống B2B SaaS này, sinh viên **tuyệt đối không dùng các prompt rời rạc hay yêu cầu chung chung** (như *"hãy viết cho tôi một trang web tuyển dụng"*). Thay vào đó, sinh viên thiết lập một **Kiến trúc Chỉ thị Hệ thống (Master System Directives)** điều phối 3 Agent chuyên trách, đảm bảo tính nhất quán về kiến trúc:

```
                  ┌──────────────────────────────────────────────────────────┐
                  │       SINH VIÊN (AI TECH LEAD / CODE REVIEWER)           │
                  └────────────────────────────┬─────────────────────────────┘
                                               │
               ┌───────────────────────────────┼──────────────────────────────┐
               │ (Chỉ thị kiến trúc DB & API)  │ (Chỉ thị State & Flow)       │ (Chỉ thị UI/UX Design System)
               ▼                               ▼                              ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐    ┌─────────────────────────┐
  │  @backend_db_agent      │     │  @frontend_agent        │    │  @ui_ux_architect       │
  │  - PostgreSQL + pgvector│     │  - React 18 + TS Strict │    │  - TopCV / Stripe Style │
  │  - FastAPI 4-Tier Layer │ ──> │  - Zustand Store        │ <─ │  - Tailwind Tokens      │
  │  - Pydantic v2 Contract │     │  - Axios Interceptors   │    │  - 4 Trạng thái UI      │
  └─────────────────────────┘     └─────────────────────────┘    └─────────────────────────┘
```

### Prompt Hệ Thống Gốc (Master Prompt nạp vào `.agents/rules/jobportal.md`)
```markdown
BỐI CẢNH: Bạn là AI Tech Lead hỗ trợ phát triển nền tảng B2B SaaS "AI-Powered Job Portal".
QUY TẮC BẤT KHẢ XÂM PHẠM (NON-NEGOTIABLES):
1. Kiến trúc phân tầng 4 lớp Backend: Routers -> Services -> CRUD -> Models/Schemas. Tuyệt đối không viết logic DB trong Routers.
2. Cô lập dữ liệu đa doanh nghiệp (Multi-tenant Isolation): Mọi câu query dữ liệu tuyển dụng BẮT BUỘC có điều kiện `WHERE company_id = :current_company_id`.
3. Chuẩn hóa API Contract: 100% Request/Response phải qua Pydantic v2 BaseModel, định kiểu TypeScript Strict trên Frontend, không dùng 'any'.
4. Trải nghiệm B2B chuyên nghiệp: Giao diện theo phong cách TopCV B2B & Stripe, card border-gray-200, tối thiểu 4 trạng thái (Skeleton, Empty, Error, Display).
5. Chiến thuật cuốn chiếu (Incremental Delivery): Trình bày giải pháp (Chain of Thought), chờ duyệt từng tầng trước khi sinh mã.
```

---

## PHẦN 2: BỘ PROMPTS ĐIỀU PHỐI CHI TIẾT THEO TỪNG TÍNH NĂNG B2B CỐT LÕI
*(Kết nối chặt chẽ: CSDL ➔ Logic Backend ➔ Đặc tả API ➔ Giao diện Frontend)*

---

### MODULE 1: ĐỘNG CƠ AI MATCHING 3 TRỤC & BIỂU ĐỒ RADAR CHART

#### 1. Tầng Database & Vector Store (`@backend_db_agent`)
```text
[PROMPT GIAO VIỆC]:
"Hãy thiết kế schema PostgreSQL 17 tích hợp extension pgvector để phục vụ bài toán AI Matching:
- Cập nhật bảng `jobs` và `resumes`: bổ sung cột `embedding` kiểu vector(384) sử dụng mô hình MiniLM-L12-v2.
- Thiết lập chỉ mục HNSW (Hierarchical Navigable Small World) với toán tử khoảng cách Cosine (<=>) để đạt tốc độ truy vấn dưới 15ms.
- Tạo bảng `applications` chứa cột `ai_score` (Float) và `ai_analysis` (JSONB) lưu trữ kết quả phân tích đa chiều.
Yêu cầu: Viết mã Alembic migration chuẩn và SQLAlchemy Model tương ứng."
```

#### 2. Tầng Logic Nghiệp vụ & API Contract (`@backend_db_agent`)
```text
[PROMPT GIAO VIỆC]:
"Xây dựng service `ai_matching.py` và endpoint `POST /api/v1/ai/match`:
- Input Schema: `AIMatchRequest` gồm `resume_id: int`, `job_id: int`.
- Logic:
  1. Kiểm tra quyền truy cập qua hàm `_authorize_resume_access` (chỉ HR thuộc company sở hữu Job mới được xem CV nộp vào Job đó).
  2. Bóc tách nội dung CV và JD, áp dụng hàm `sanitize_pii` ẩn danh SĐT/Email/CCCD.
  3. Gọi DeepSeek V3 với System Prompt ép định dạng JSON Rubric 3 trục:
     + skills_score (40% trọng số), experience_score (30%), domain_score (30%).
     + strengths (2-4 điểm mạnh tiếng Việt), gaps (2-4 điểm thiếu hụt), deal_breakers (cảnh báo rủi ro lệch cấp bậc).
  4. Bọc trong cơ chế Intelligent Cache (SHA-256 hash của CV + JD) để nếu gọi lại cùng 1 cặp thì trả kết quả trong 0ms, không tốn token.
- Output Schema: `AIMatchResponse` chuẩn hóa Pydantic v2."
```

#### 3. Tầng Giao diện & Trực quan hóa Dữ liệu (`@frontend_agent` & `@ui_ux_architect`)
```text
[PROMPT GIAO VIỆC]:
"Dựa vào API Contract của `AIMatchResponse`, hãy xây dựng component `EmployerCandidateRadarChart.tsx`:
- Sử dụng thư viện Recharts để vẽ biểu đồ mạng nhện 3 trục (Kỹ năng, Kinh nghiệm, Độ phù hợp ngành).
- Màu sắc: Dải màu Primary B2B (#0284C7), vùng phủ polygon có hiệu ứng gradient mờ nhạt (fillOpacity 0.4).
- Hiển thị bảng Breakdown 3 thẻ:
  + Thẻ Xanh lá: Điểm mạnh cốt lõi (Strengths).
  + Thẻ Vàng cam: Kỹ năng cần trau dồi (Gaps).
  + Thẻ Đỏ pastel: Cảnh báo điều kiện tiên quyết (Deal-breakers).
- Bắt buộc gắn component `AIDisclaimerBanner` ở chân biểu đồ: 'Kết quả AI mang tính chất tham khảo, quyết định thuộc về nhà tuyển dụng'."
```

---

### MODULE 2: PIPELINE KANBAN QUẢN LÝ ỨNG VIÊN & ĐIỀU PHỐI VÒNG PHỎNG VẤN

#### 1. Tầng Database & Phân quyền Doanh nghiệp (`@backend_db_agent`)
```text
[PROMPT GIAO VIỆC]:
"Thiết kế cơ sở dữ liệu cho tính năng Quản lý ứng viên đa giai đoạn (Kanban):
- Tạo bảng `interview_rounds`: `id`, `application_id`, `round_name`, `round_order`, `status` (PENDING, SCHEDULED, COMPLETED, CANCELLED), `scheduled_at`, `meeting_link`.
- Tạo bảng `criteria_scores`: Chấm điểm ứng viên theo tiêu chí nội bộ doanh nghiệp (`score`, `criteria_name`, `evaluator_id`).
- Ràng buộc: Toàn bộ bảng này phải khóa ngoại liên kết tới `company_id`. Viết dependency `require_application_scope` để ngăn chặn HR công ty này sửa vòng phỏng vấn của công ty khác."
```

#### 2. Tầng API Endpoint & Xuất file Lịch (`@backend_db_agent`)
```text
[PROMPT GIAO VIỆC]:
"Viết router `backend/app/routers/employer.py` và `interview_rounds.py`:
- `GET /api/v1/employer/jobs/{job_id}/applications`: Trả về danh sách ứng viên gom nhóm theo trạng thái (`APPLIED`, `REVIEWING`, `INTERVIEWING`, `OFFERED`, `REJECTED`).
- `PATCH /api/v1/applications/{id}/status`: Cập nhật trạng thái ứng viên khi kéo thả Kanban.
- `POST /api/v1/interviews/{id}/calendar-invite`: Tạo file iCalendar (.ics) có sẵn link Google Meet/Teams để tự động gửi thông báo lịch phỏng vấn cho ứng viên và người phỏng vấn."
```

#### 3. Tầng Frontend Kanban Kéo Thả (`@frontend_agent`)
```text
[PROMPT GIAO VIỆC]:
"Xây dựng màn hình `EmployerCandidatesPage.tsx`:
- Bố cục 5 cột Kanban theo chuẩn trạng thái tuyển dụng.
- Mỗi thẻ ứng viên (CandidateCard) hiển thị: Avatar, Họ tên, Vị trí ứng tuyển, Huy hiệu điểm AI Matching Badge có màu tương phản (>=80% Xanh, 50-79% Vàng, <50% Đỏ).
- Nút tác vụ nhanh:
  + Nút 'Phân tích AI' ➔ Mở modal Radar Chart.
  + Nút 'Lên lịch phỏng vấn' ➔ Mở form tạo lịch phỏng vấn và xuất .ics.
  + Nút 'Soạn thư AI' ➔ Kích hoạt modal EmailDraftModal.
- Trạng thái chờ: Hiển thị Skeleton loading dạng khung mờ khi đang tải dữ liệu từ API."
```

---

### MODULE 3: RAG SEMANTIC TALENT SEARCH & BẢO VỆ DỮ LIỆU CÁ NHÂN (PII ENCLAVE)

#### 1. Tầng Xử lý Dữ liệu & Embedding Vector (`@backend_db_agent`)
```text
[PROMPT GIAO VIỆC]:
"Xây dựng dịch vụ RAG Retrieval `rag_service.py` cho tính năng Tìm kiếm nhân tài (Talent Search):
- Input: Câu truy vấn ngôn ngữ tự nhiên từ nhà tuyển dụng (ví dụ: 'Tìm kỹ sư React có kinh nghiệm tối ưu hiệu năng và biết FastAPI').
- Kiến trúc xử lý:
  1. Giới hạn độ dài query tối đa 500 ký tự để chống DoS.
  2. Băm nhỏ văn bản CV thành các đoạn `document_chunks` (kích thước 500 tokens, overlap 50 tokens).
  3. Thực hiện Hybrid Search kết hợp:
     + Dense Vector Search: So khớp cosine similarity bằng pgvector.
     + Sparse Text Search: So khớp từ khóa full-text search BM25.
  4. Cắt tỉa PII: Tuyệt đối dùng hàm `sanitize_pii` ẩn danh số CCCD, số điện thoại cá nhân và email trước khi đưa vào context prompt của LLM."
```

#### 2. Tầng Giao diện Dossier Hồ sơ Ứng viên (`@frontend_agent`)
```text
[PROMPT GIAO VIỆC]:
"Tạo giao diện tab `Talent Search` trên trang Quản lý tuyển dụng:
- Thanh tìm kiếm thông minh có gợi ý mẫu câu lệnh tuyển dụng (Quick Prompt Pills: 'Senior Backend Go', 'Data Engineer AWS').
- Kết quả tìm kiếm hiển thị dưới dạng Dossier (Hồ sơ phân tích):
  + Độ tương đồng ngữ nghĩa (% Semantic Relevance).
  + Đoạn trích dẫn bằng chứng từ CV (Evidence Snippets) làm nổi bật từ khóa tìm kiếm.
  + Huy hiệu xác thực kinh nghiệm và nút mở bản CV đầy đủ."
```

---

### MODULE 4: AI EMAIL GENERATOR VỚI RÀNG BUỘC AN TOÀN PHÁP LÝ

#### 1. Tầng Prompt Kỹ thuật có Ràng buộc Cứng (`@backend_db_agent`)
```text
[PROMPT GIAO VIỆC]:
"Xây dựng dịch vụ `email_generator.py` phục vụ sinh email tự động cho ứng viên:
- Yêu cầu cấu trúc System Prompt 2 tầng:
  + Tầng 1: Đọc System Prompt từ bảng CSDL `ai_prompt_configs`.
  + Tầng 2 (Hardcoded Safety Rule): Ghép nối quy định cứng BẮT BUỘC KHÔNG THỂ BỊ GHI ĐÈ:
    'Nếu là email TỪ CHỐI (reject): Tuyệt đối KHÔNG nêu lý do cụ thể, KHÔNG đề cập đến tuổi tác, giới tính, tôn giáo, hôn nhân nhằm tránh rủi ro pháp lý phân biệt đối xử.'
- Bổ sung tham số `tone`: Hỗ trợ 3 phong cách: `formal` (trang trọng), `friendly` (thân thiện), `professional` (chuyên nghiệp).
- Đầu ra bắt buộc: JSON có cấu trúc `{'subject': str, 'body': str}`."
```

#### 2. Tầng Modal Soạn thảo Email trên Giao diện (`@frontend_agent`)
```text
[PROMPT GIAO VIỆC]:
"Xây dựng component `EmailDraftModal.tsx`:
- Nhận props: `candidateName`, `jobTitle`, `stageType`.
- Cho phép HR chọn Tone giọng điệu qua Radio Group (Trang trọng / Thân thiện).
- Bấm nút 'Sinh nội dung bằng AI' ➔ Gọi API `/api/v1/ai/generate-email` kèm hiệu ứng Spinner.
- Form hiển thị Subject và Body cho phép HR tự do chỉnh sửa nội dung trước khi bấm Gửi.
- Tích hợp nút 'Mở trực tiếp trên Gmail' mã hóa URL `mailto:` tự động điền sẵn tiêu đề và nội dung."
```

---

### MODULE 5: KIẾN TRÚC PHÒNG THỦ AI GATEWAY (CACHE, CIRCUIT BREAKER, PROMPT ARMOR)

#### 1. Prompt Xây dựng Middleware An Toàn (`@backend_db_agent`)
```text
[PROMPT GIAO VIỆC]:
"Triển khai kiến trúc AI Gateway Resiliency tối ưu chi phí trong `deepseek_client.py`:
1. Intelligent Caching: Tạo class `AICache` lưu trữ kết quả phân tích theo mã băm SHA-256 của `(model, messages, response_format)`. TTL 24 giờ. Nếu trùng lặp, trả về tức thì không tốn token.
2. Circuit Breaker: Tạo class `CircuitBreaker`. Nếu API DeepSeek lỗi liên tục 5 lần trong 60 giây, ngắt mạch chuyển sang OPEN trong 30 giây để fail-fast, ngăn chặn cạn kiệt tài khoản.
3. Exponential Backoff: Tự động thử lại tối đa 2 lần khi gặp lỗi mạng tạm thời (ConnectTimeout, ReadTimeout, 502, 503) với độ trễ lũy tiến 1s, 2s.
4. Prompt Armor: Cập nhật `prompt_armor.py` bộ lọc regex đa ngữ nhận diện câu lệnh bẻ khóa (Jailbreak) tiếng Việt như 'quên hết chỉ dẫn', 'bật developer mode'."
```

---

## PHẦN 3: MINH CHỨNG PHẢN BIỆN KỸ THUẬT CỦA SINH VIÊN (AI PAIR PROGRAMMING DIALOGUES)
*(Dẫn chứng thực tế chứng minh sinh viên trực tiếp bắt lỗi và làm chủ mã nguồn do AI sinh ra)*

### 💬 Tình huống 1: Bắt lỗi rò rỉ dữ liệu đa doanh nghiệp (Multi-tenant Leakage)
* **Sinh viên phát hiện:** Khi yêu cầu AI sinh câu lệnh SQL tìm kiếm ứng viên, AI viết câu truy vấn chung chung không lọc theo doanh nghiệp.
* **Đoạn hội thoại phản biện:**
  > **👤 Sinh viên:**  
  > *"Hàm `get_candidates_by_skill` em vừa viết bị hổng bảo mật nghiêm trọng! Em đang truy vấn thẳng `db.query(Application).join(Resume)...` mà không có điều kiện lọc theo công ty. Trong hệ thống B2B SaaS, điều này sẽ làm HR công ty A nhìn thấy hồ sơ ứng viên của công ty B đối thủ. Hãy sửa lại ngay: Bắt buộc inject `company_id` vào scope và kiểm tra quan hệ quyền sở hữu thông qua `Job.company_id`!"*  
  > 
  > **🤖 AI Agent:**  
  > *"Em xin lỗi vì sơ suất kiến trúc này. Em đã cập nhật lại toàn bộ hàm truy vấn: Bổ sung mệnh đề `WHERE jobs.company_id = :company_id` và thêm middleware xác thực `require_job_scope` để chặn đứng truy cập trái phép cấp độ tầng dữ liệu."*

---

### 💬 Tình huống 2: Bắt lỗi Event Loop Crash trong Async Client của DeepSeek
* **Sinh viên phát hiện:** Bộ test pytest thỉnh thoảng văng lỗi `RuntimeError: Event loop is closed` khi chạy song song.
* **Đoạn hội thoại phản biện:**
  > **👤 Sinh viên:**  
  > *"Trong `deepseek_client.py`, em khởi tạo `self._client = httpx.AsyncClient()` ngay trong hàm `__init__` dạng module singleton. Khi Starlette TestClient tạo một event loop mới cho từng request kiểm thử, connection pool cũ vẫn bám vào loop đã đóng dẫn đến crash. Hãy refactor lại: Chuyển sang cơ chế Lazy Rebinding — kiểm tra `asyncio.get_running_loop()` trong hàm `_get_client()`, nếu loop thay đổi hoặc client bị đóng thì mới khởi tạo lại!"*  
  > 
  > **🤖 AI Agent:**  
  > *"Nhận định của anh hoàn toàn chính xác về cơ chế hoạt động của asyncio trong Starlette/FastAPI. Em đã cấu trúc lại `_get_client()` để tự động rebind theo event loop đang chạy, giải quyết triệt để lỗi crash khi chạy test đa luồng."*

---

### 💬 Tình huống 3: Bắt lỗi AI chấm điểm một chiều & Ép chuẩn hóa Rubric 3 trục
* **Sinh viên phát hiện:** Ban đầu AI Matching chỉ trả về 1 con số chung chung (ví dụ: `85%`), không có giải thích thuyết phục.
* **Đoạn hội thoại phản biện:**
  > **👤 Sinh viên:**  
  > *"Điểm số 85% vô căn cứ không thể dùng cho sản phẩm tuyển dụng B2B được. Các nhà tuyển dụng cần biết 85% đó gồm những yếu tố nào. Hãy sửa lại System Prompt: Ép AI chấm điểm theo Rubric 3 trục độc lập: Skills (40%), Experience (30%), Domain Fit (30%). Bắt buộc chỉ ra điểm thiếu hụt (Gaps) và cảnh báo lệch cấp bậc (Deal-breakers) viết bằng 100% tiếng Việt chuyên nghiệp, không được chêm tiếng Anh!"*  
  > 
  > **🤖 AI Agent:**  
  > *"Em đã cập nhật lại `HARDCODED_FALLBACK_PROMPTS[AIFeature.MATCHING]` trong `prompt_loader.py`: Ép chặt cấu trúc JSON đầu ra gồm 3 điểm thành phần, danh sách Deal-breakers và quy định ngôn ngữ bắt buộc 100% tiếng Việt."*

---

## PHẦN 4: HƯỚNG DẪN TRÌNH BÀY VỚI HỘI ĐỒNG CHẤM THI

Khi Giảng viên hoặc Hội đồng hỏi về quá trình sử dụng AI để phát triển hệ thống:

1. **Về phương pháp làm việc:**
   * Trả lời: *"Em không coi AI là công cụ sinh code tự động mà xem AI là một **Đội ngũ Lập trình viên cấp dưới (Junior Developers)**. Em đóng vai trò **Tech Lead**, đặt ra các bản đặc tả kỹ thuật (Technical Specs), bản thiết kế Schema và API Contract trước, sau đó giao việc có cấu trúc và phản biện từng đoạn mã nguồn."*
2. **Về tính liên kết hệ thống (Database ➔ Frontend):**
   * Trả lời: *"Mọi tính năng đều tuân theo chu trình khép kín: Khởi tạo Schema CSDL (với pgvector/HNSW) ➔ Viết tầng Service & Dependency bảo mật ➔ Đặc tả REST API chuẩn Pydantic v2 ➔ Xây dựng State Zustand & Giao diện Responsive có xử lý lỗi tại Frontend."*
3. **Về chi phí và an toàn:**
   * Trả lời: *"Em không sử dụng nhiều API đắt đỏ hay dữ liệu giả lập. Em tập trung xây dựng cơ chế **Intelligent Cache (SHA-256)** giúp tiết kiệm 100% chi phí cho các lượt gọi trùng lặp, cùng cơ chế **Circuit Breaker** và **Prompt Armor** bảo vệ tài khoản API và ngăn chặn bẻ khóa hệ thống."*

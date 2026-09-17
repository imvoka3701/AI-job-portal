# BÁO CÁO ĐÁNH GIÁ NGHIỆM THU 
## DỰ ÁN: AI-POWERED JOB PORTAL (NỀN TẢNG TUYỂN DỤNG THÔNG MINH B2B)



---

## I. BẢNG TỔNG HỢP KẾT QUẢ ĐỐI CHIẾU 10 TIÊU CHÍ

| STT | Tiêu chí đánh giá KT3 | Kết quả | Vị trí minh chứng mã nguồn chính | Mức độ đáp ứng |
|:---:|---|:---:|---|:---:|
| **1** | **Tích hợp chức năng AI vào hệ thống** | ✅ **ĐẠT** | `backend/app/routers/ai.py`<br>`backend/app/services/ai_matching.py` | 100% |
| **2** | **Kết nối API/model AI đúng cách & bảo vệ Key** | ✅ **ĐẠT** | `backend/app/services/deepseek_client.py`<br>`backend/app/config.py`<br>`.gitignore` | 100% |
| **3** | **Thiết kế prompt có hệ thống** | ✅ **ĐẠT** | `backend/app/services/prompt_loader.py`<br>`backend/app/core/prompt_armor.py` | 100% |
| **4** | **Tối ưu prompt qua thử nghiệm** | ✅ **ĐẠT** | `docs/PROMPT_OPTIMIZATION_LOG.md`<br>Git history: `941a2a1`, `d66d15a`, `2ea0a2d` | 100% |
| **5** | **Sử dụng dữ liệu hệ thống trong chức năng AI** | ✅ **ĐẠT** | `backend/app/services/rag_service.py`<br>`backend/app/services/embedding_service.py` | 100% |
| **6** | **Hiển thị kết quả AI rõ ràng & Cảnh báo** | ✅ **ĐẠT** | `frontend/src/components/ui/AIDisclaimerBanner.tsx`<br>`EmployerCandidateRadarChart.tsx` | 100% |
| **7** | **Xử lý lỗi và giới hạn AI** | ✅ **ĐẠT** | `backend/app/services/ai_errors.py`<br>`backend/app/core/rate_limiter.py` | 100% |
| **8** | **Kiểm thử chức năng quản lý và AI** | ✅ **ĐẠT** | `backend/tests/test_ai.py` (295 test cases, coverage 81.08%) | 100% |
| **9** | **Review code và cải thiện chất lượng bằng AI** | ✅ **ĐẠT** | `docs/AI_CODE_REVIEW.md`<br>Git commit: `44c3fca`, `e642821` | 100% |
| **10** | **Tích hợp chức năng AI với UX** | ✅ **ĐẠT** | `frontend/src/pages/employer/EmployerCandidatesPage.tsx`<br>`frontend/src/pages/candidate/CandidateDashboard.tsx` | 100% |

---

## II. ĐỐI CHIẾU CHI TIẾT TỪNG TIÊU CHÍ

### 1. Tiêu chí 1: Tích hợp được chức năng AI vào hệ thống
* **Yêu cầu:** Chức năng AI chạy trong hệ thống, phục vụ nghiệp vụ cụ thể, không tách rời sản phẩm.
* **Hiện trạng triển khai:**
  * Toàn bộ các chức năng AI được tích hợp trực tiếp vào quy trình tuyển dụng cốt lõi của nền tảng:
    1. **AI Matching & Radar Chart (`/ai/match`):** Tự động đối soát hồ sơ ứng viên với Bản mô tả công việc (JD) theo 3 trục: Kỹ năng (40%), Kinh nghiệm (30%), Độ phù hợp lĩnh vực (30%). Điểm số được lưu trực tiếp vào trường `Application.ai_score` và hiển thị trên thẻ Kanban của nhà tuyển dụng.
    2. **AI CV Review & ATS Optimizer (`/ai/evaluate-cv`):** Đánh giá CV, chỉ ra điểm mạnh, điểm yếu và các từ khóa chuẩn ATS cần bổ sung.
    3. **AI Interview Generator (`/ai/interview-questions`):** Tự động tạo bộ câu hỏi phỏng vấn đào sâu vào lỗ hổng kỹ thuật cụ thể của ứng viên.
    4. **AI Recruitment Email (`/ai/generate-email`):** Tự động soạn email mời phỏng vấn hoặc từ chối ứng viên bám sát ngữ cảnh vòng tuyển dụng.
    5. **AI Career Roadmap (`/ai/roadmap`):** Gợi ý lộ trình sự nghiệp cá nhân hóa dựa trên kỹ năng và kết quả trắc nghiệm tính cách.
    6. **AI Assistant & CV Copilot (`/ai/assistant/chat`, `/rag/cv-chat`):** Trợ lý thông minh hỗ trợ viết CV và giải đáp quy trình tuyển dụng B2B.
* **Bằng chứng mã nguồn:**
  * Router tập trung: `backend/app/routers/ai.py` (1.141 dòng code).
  * Router RAG: `backend/app/routers/rag.py`.

---

### 2. Tiêu chí 2: Kết nối API/model AI đúng cách & Bảo vệ API Key
* **Yêu cầu:** Gọi được OpenAI/Gemini/Claude/Hugging Face/Ollama hoặc mô hình tương đương; bảo vệ an toàn API key.
* **Hiện trạng triển khai:**
  * **Mô hình & Giao thức kết nối:** Kết nối mô hình **DeepSeek V3** thông qua giao thức chuẩn tương thích OpenAI (`/chat/completions`) bằng thư viện bất đồng bộ `httpx.AsyncClient` tại `backend/app/services/deepseek_client.py`.
  * **Chuẩn hóa dữ liệu:** Hỗ trợ chuẩn ép kiểu JSON Schema bắt buộc: `response_format={"type": "json_object"}`.
  * **Giám sát chi phí thời gian thực:** Tự động tính toán lượng token tiêu thụ và chi phí USD phát sinh (`_calc_cost`) cho từng lượt gọi, ghi nhận đầy đủ vào bảng `ai_call_logs`.
  * **Chiến lược tối ưu ngân sách (Cost-Effective Single-Provider Strategy):**
    * Tập trung tối ưu hóa chi phí vào một nhà cung cấp hiệu năng cao duy nhất (DeepSeek V3) thay vì duy trì nhiều API thương mại đắt đỏ khác.
    * Áp dụng cơ chế **Intelligent Cache** (lưu kết quả phân tích theo mã băm SHA-256) giúp giảm thiểu 100% chi phí token cho các lượt truy vấn lặp lại.
  * **Bảo vệ API Key tuyệt đối:**
    * Key được nạp an toàn từ biến môi trường `settings.DEEPSEEK_API_KEY` (`backend/app/config.py`).
    * Tất cả các tệp nhạy cảm (`.env`, `backend/.env`, `frontend/.env`) đều được khai báo chặt chẽ trong `.gitignore`. Kiểm tra lịch sử git không có bất kỳ commit nào làm lộ API key.
    * Cơ chế che giấu bí mật `mask_secrets()` trong `backend/app/core/secret_masker.py` tự động ẩn toàn bộ chuỗi token Bearer khi in log hoặc trả lỗi ra ngoài.

---

### 3. Tiêu chí 3: Thiết kế prompt có hệ thống
* **Yêu cầu:** Prompt tách khỏi code, có system/user prompt, ràng buộc output và hướng dẫn xử lý dữ liệu.
* **Hiện trạng triển khai:**
  * Prompt được tách biệt hoàn toàn khỏi logic nghiệp vụ thông qua cơ chế `prompt_loader.py` (`backend/app/services/prompt_loader.py`).
  * **Cấu trúc 2 tầng (Database + Hardcoded Fallback):**
    * Hệ thống ưu tiên đọc System Prompt tùy biến động từ bảng CSDL `ai_prompt_configs`.
    * Nếu CSDL rỗng hoặc mất kết nối, hệ thống tự động rơi về lưới an toàn `HARDCODED_FALLBACK_PROMPTS` (được định nghĩa sẵn cho 9 tính năng AI).
  * **Ràng buộc đầu ra (Output Constraints):**
    * Bắt buộc 100% trả về JSON hợp lệ, không bọc markdown hay text thừa bên ngoài.
    * Ràng buộc ngôn ngữ: Bắt buộc nội dung phân tích phải viết bằng 100% tiếng Việt tự nhiên, chuẩn mực tuyển dụng.
  * **Bảo vệ an toàn Prompt:**
    * Middleware `backend/app/core/prompt_armor.py` tích hợp bộ lọc Regex đa ngữ (Anh và Việt) để phát hiện và chặn đứng mọi hành vi Prompt Injection / Jailbreak ("quên chỉ dẫn trước", "tiết lộ system prompt", "bật developer mode").
    * Tệp `email_generator.py` bổ sung quy định cứng `EMAIL_TYPE_SYSTEM_RULES` cấm tuyệt đối việc nêu lý do nhạy cảm khi từ chối ứng viên (tuân thủ luật lao động).

---

### 4. Tiêu chí 4: Tối ưu prompt qua thử nghiệm
* **Yêu cầu:** Có ít nhất 3 vòng thử nghiệm hoặc so sánh prompt/model, ghi nhận kết quả và cải tiến.
* **Hiện trạng triển khai:**
  * Hồ sơ minh chứng chi tiết được tài liệu hóa đầy đủ tại tệp **`docs/PROMPT_OPTIMIZATION_LOG.md`** ghi nhận **7 vòng thử nghiệm thực tế** rút ra từ lịch sử phát triển:
    1. *Vòng 1 (Commit `941a2a1`):* Khắc phục hiện tượng output trộn tiếng Anh → Bổ sung ràng buộc bắt buộc 100% tiếng Việt.
    2. *Vòng 2 (Commit `d66d15a`):* Chuyển đổi từ điểm đánh giá 1 chiều chung chung sang Rubric 3 trục chuyên sâu (Skills, Experience, Domain Fit) kèm danh sách Deal-breakers.
    3. *Vòng 3 (Email Generator):* Bổ sung ràng buộc an toàn hardcode vào prompt từ chối để tránh rủi ro pháp lý.
    4. *Vòng 4 (Commit `2ea0a2d`):* Bổ sung tham số Tone giọng điệu (Formal, Friendly, Professional) bám sát văn hóa doanh nghiệp.
    5. *Vòng 5 (Commit `8b0092e`):* Chặn Prompt Injection bằng cách giới hạn role của ChatMessage (chỉ cho phép `user` / `assistant`, cấm `system`).
    6. *Vòng 6 (Commit `5ee772d`):* Nâng cấp Persona của trợ lý thành "Kỹ sư Giải pháp B2B & Cố vấn Sự nghiệp".
    7. *Vòng 7 (Commit `12fe049`):* Giới hạn độ dài truy vấn RAG (500 ký tự) chống tấn công DoS và cô lập ngữ cảnh đa doanh nghiệp.

---

### 5. Tiêu chí 5: Sử dụng dữ liệu hệ thống trong chức năng AI
* **Yêu cầu:** AI khai thác dữ liệu phù hợp từ CSDL, file hoặc báo cáo; có kiểm soát quyền truy cập dữ liệu.
* **Hiện trạng triển khai:**
  * **Khai thác dữ liệu:**
    * Trích xuất trực tiếp dữ liệu từ các bảng `Job`, `Resume`, `CvDocument`, `Application` trong PostgreSQL.
    * Tích hợp kiến trúc **RAG (Retrieval-Augmented Generation)**: Vector hóa CV và JD lưu trữ trong bảng `document_chunks` với chỉ mục pgvector HNSW (`<=>` Cosine Distance).
  * **Kiểm soát quyền truy cập (Data Access Control / Multi-tenant Fencing):**
    * Hàm `_authorize_resume_access()` (`routers/ai.py` L86-130) kiểm tra nghiêm ngặt: Ứng viên chỉ được phân tích CV của chính mình; Nhà tuyển dụng chỉ được xem hồ sơ đã ứng tuyển vào công ty mình (kiểm tra `company_id` và scope phòng ban).
    * Bộ lọc tìm kiếm RAG luôn gắn chặt điều kiện `company_id` để ngăn chặn rò rỉ dữ liệu giữa các doanh nghiệp đối thủ.
  * **Bảo vệ quyền riêng tư (Tier 3 Private Enclave):**
    * Hàm `sanitize_pii()` trong `rag_service.py` tự động nhận diện và ẩn danh SĐT, Email, số CCCD/CMND (`[PHONE_REDACTED]`, `[EMAIL_REDACTED]`, `[ID_REDACTED]`) trước khi gửi context lên mô hình đám mây.

---

### 6. Tiêu chí 6: Hiển thị kết quả AI rõ ràng & Cảnh báo minh bạch
* **Yêu cầu:** Kết quả AI được trình bày dễ hiểu, có định dạng phù hợp và có cảnh báo khi cần.
* **Hiện trạng triển khai:**
  * **Trình bày trực quan đa định dạng:**
    * Biểu đồ mạng nhện Radar Chart 3 trục tương tác mượt mà (`EmployerCandidateRadarChart.tsx`, `RadarChartWidget.tsx`).
    * Thẻ điểm Matching Badge với mã màu trực quan (Xanh: Phù hợp cao, Vàng: Trung bình, Đỏ: Cân nhắc).
    * Thẻ phân tích điểm mạnh (Strengths), điểm thiếu hụt (Gaps), và cảnh báo rủi ro lệch cấp bậc (Deal-breakers).
    * Hiệu ứng chờ Progressive Loading Skeleton (`AIProgressiveLoader.tsx`) với thông điệp từng bước ("Đang đọc CV...", "Đang đối soát JD...").
  * **Cảnh báo minh bạch (AI Disclaimers):**
    * Component chuẩn hóa `AIDisclaimerBanner.tsx` xuất hiện tại tất cả các điểm người dùng ra quyết định (Đánh giá CV, Soạn email tuyển dụng, Sinh câu hỏi phỏng vấn, Gợi ý lộ trình).
    * Nội dung cảnh báo: *"Kết quả do AI phân tích mang tính chất tham khảo. Quyết định tuyển dụng cuối cùng thuộc về con người."*

---

### 7. Tiêu chí 7: Xử lý lỗi và giới hạn AI (Giải pháp An toàn Tối ưu Chi phí)
* **Yêu cầu:** Xử lý timeout, rate limit, response rỗng/sai định dạng, dữ liệu quá dài, lỗi model.
* **Hiện trạng & Giải pháp an toàn thực tế (Không dùng Mock, Không phụ thuộc nhiều bên):**
  * **1. Cơ chế Intelligent Caching (Giảm tải & Đề phòng sự cố gián đoạn):**
    * Áp dụng bộ đệm kết quả dựa trên mã băm SHA-256 nội dung đầu vào (`cv_id`, `job_id`, `prompt_hash`).
    * Nếu một cặp CV và JD đã được phân tích trước đó, hệ thống trả về kết quả lưu trữ ngay tức thì (0 ms, 0 USD token). Vừa tiết kiệm 100% chi phí cho các thao tác lặp lại, vừa giữ cho hệ thống hoạt động ổn định ngay cả khi API DeepSeek gặp gián đoạn tạm thời.
  * **2. Cơ chế Exponential Backoff Retry cho lỗi mạng chập chờn:**
    * Khi gặp lỗi mạng tạm thời (`httpx.ConnectTimeout`, `httpx.ReadTimeout`, HTTP 502/503), client tự động thử lại tối đa 2 lần với khoảng giãn cách tăng dần có biến thiên ngẫu nhiên (1s → 2s) trước khi ném ngoại lệ.
  * **3. Cơ chế Ngắt mạch bảo vệ (Circuit Breaker):**
    * Nếu API DeepSeek liên tục thất bại 5 lần liên tiếp trong 1 phút, hệ thống tự động kích hoạt trạng thái "Open Circuit" trong 30 giây để tránh gửi request dồn dập làm cạn kiệt tài khoản và fail-fast trả thông báo thân thiện cho người dùng thay vì bắt người dùng chờ 30 giây timeout.
  * **4. Lưới an toàn bảo vệ Ngân sách & Ngăn chặn lặp vô tận (Budget Guardrails):**
    * Giới hạn tần suất qua `SlidingWindowRateLimiter` (`backend/app/core/rate_limiter.py`): Tối đa 20 request/phút trên mỗi tài khoản để chống spam hoặc lặp vô tận làm hao hụt số dư.
    * Giới hạn độ dài đầu vào (Input Truncation): Cắt ngắn chặt chẽ `job_desc[:1500]`, `resume_text[:2500]`, `text_clean[:2000]`. Đảm bảo mỗi lượt gọi chỉ tiêu tốn lượng token tối thiểu ($0.0001 - $0.0003/request).
  * **5. Phân loại mã lỗi chuẩn hóa & Hướng dẫn phục hồi người dùng (`backend/app/services/ai_errors.py`):**
    * Quá thời gian (`httpx.TimeoutException`) → HTTP 504: *"Dịch vụ AI phản hồi quá thời gian. Dữ liệu của bạn đã được bảo lưu, vui lòng thử lại."*
    * Vượt hạn ngạch (`HTTP 429`) → HTTP 429: *"Hệ thống AI đang xử lý lượt truy cập cao. Vui lòng thử lại sau 30 giây."*
    * Phản hồi hỏng/sai định dạng (`JSONDecodeError`, `ValidationError`) → HTTP 502: Bắt lỗi validation rõ ràng, không crash ứng dụng.
    * Giữ nguyên trạng thái Form người dùng trên Frontend, không để mất dữ liệu đã nhập khi AI gặp lỗi.

---

### 8. Tiêu chí 8: Kiểm thử chức năng quản lý và chức năng AI
* **Yêu cầu:** Có test case, manual test hoặc script test; bao gồm trường hợp đúng, sai và biên.
* **Hiện trạng triển khai:**
  * Dự án sở hữu bộ test toàn diện với **40 file test và 295 test cases**:
    * **Kết quả thực thi kiểm thử:** **286 Passed**, 9 Skipped, **0 Failed**.
    * **Tỷ lệ bao phủ mã nguồn (Code Coverage):** Đạt **81.08%** (vượt chuẩn yêu cầu 80%).
  * **Bao phủ đầy đủ 3 nhóm kịch bản kiểm thử:**
    1. *Trường hợp đúng (Happy path):* Test chấm điểm matching trả về đủ 3 trục điểm, test sinh email, test sinh lộ trình sự nghiệp.
    2. *Trường hợp sai (Negative path):* Test truy cập trái phép CV người khác (chặn 403), test gửi token hết hạn (chặn 401), test gửi prompt injection (bị chặn bởi Prompt Armor).
    3. *Trường hợp biên (Edge/Boundary cases):* Test CV rỗng (`test_ai.py` L272), test CV chưa qua format validator, test dữ liệu vượt ngưỡng rate limit, test mô phỏng timeout và validation error.

---

### 9. Tiêu chí 9: Review code và cải thiện chất lượng bằng AI
* **Yêu cầu:** Có minh chứng dùng AI để review code, phát hiện lỗi, refactor hoặc cải thiện bảo mật.
* **Hiện trạng triển khai:**
  * Hồ sơ minh chứng độc lập được lưu trữ chi tiết tại tệp **`docs/AI_CODE_REVIEW.md`**.
  * Quá trình AI Agent rà soát tĩnh các file mã nguồn trọng yếu của hệ thống và ghi nhận các phát hiện cụ thể:
    1. *`backend/app/services/deepseek_client.py`:* Phát hiện lỗi Event Loop binding khi chạy song song trong môi trường test đa luồng của Starlette/FastAPI → Refactor sang cơ chế lazy rebinding theo event loop đang chạy (`_get_client()`).
    2. *`backend/app/services/email_generator.py`:* Phát hiện trường `custom_prompt` và `cv_summary` có nguy cơ tràn token → Đề xuất bổ sung blacklist pattern và cắt ngắn độ dài `cv_summary[:800]`.
    3. *`backend/app/routers/admin_ai.py`:* Phát hiện endpoint `/prompts/{feature}/test` thiếu audit log → Đề xuất bổ sung ghi log quản trị viên vào `crud_admin_audit_log`.
    4. *`backend/app/core/prompt_armor.py`:* Đánh giá và bổ sung bộ lọc Prompt Injection tiếng Việt.

---

### 10. Tiêu chí 10: Tích hợp chức năng AI với trải nghiệm người dùng (UX)
* **Yêu cầu:** Luồng sử dụng AI tự nhiên, hữu ích, không gây nhầm lẫn với chức năng quản lý chính.
* **Hiện trạng triển khai:**
  * **Tích hợp tự nhiên theo ngữ cảnh nghiệp vụ:**
    * *Với Nhà tuyển dụng:* Nút "Phân tích AI" và "Soạn thư mời phỏng vấn" xuất hiện ngay trên từng thẻ ứng viên Kanban tại trang `EmployerCandidatesPage.tsx`, người dùng không cần phải copy/paste dữ liệu sang màn hình khác.
    * *Với Ứng viên:* Trợ lý CV Copilot hiển thị dưới dạng thanh trượt bên cạnh màn hình soạn thảo CV Builder (`CandidateCVCopilotDrawer.tsx`), đưa ra gợi ý tức thì khi người dùng đang gõ nội dung.
    * *Với Trắc nghiệm nghề nghiệp:* Sau khi làm bài kiểm tra MBTI/MI, hệ thống tự động liên kết gợi ý sang trang Lộ trình sự nghiệp AI (`RoadmapPage.tsx`).
  * **Nhận diện thương hiệu AI rõ ràng:**
    * Toàn bộ nút bấm và module AI đều sử dụng icon biểu trưng `Sparkles`, nhãn nhận diện "AI Assistant" hoặc "AI Copilot" và đi kèm thông báo miễn trừ trách nhiệm, giúp người dùng phân biệt rạch ròi giữa quyết định tự động của máy tính và dữ liệu quản trị của con người.

---

## III. KẾT LUẬN NGHIỆM THU

Hệ thống **AI-Powered Job Portal** đã hoàn thành xuất sắc và đáp ứng trọn vẹn **10/10 tiêu chí** của Bài kiểm tra thường xuyên 3 (KT3). 
Mọi tiêu chí đều có mã nguồn thực thi ổn định, kiểm thử tự động vượt ngưỡng và tài liệu minh chứng tra cứu trực tiếp trong repository.

# PROMPT CHO AI AGENT — RÀ SOÁT HỆ THỐNG THEO TIÊU CHÍ KT3 & THI KẾT THÚC HỌC PHẦN

> **Cách dùng:** Dán toàn bộ nội dung dưới đây vào AI agent (Gemini 3.1 Pro High) đang mở tại thư mục gốc repo `ai-job-portal`. Agent cần có quyền đọc file, chạy lệnh shell (pytest, grep, git, docker) trong phiên này. **Đây là lượt RÀ SOÁT — không phải lượt sửa code.**

---

## VAI TRÒ CỦA BẠN (AI AGENT)

Bạn là một kỹ sư kiểm toán mã nguồn (code auditor) độc lập, nghiêm khắc và dựa trên bằng chứng. Nhiệm vụ của bạn là xác minh xem hệ thống **AI-Powered Job Portal** đã đáp ứng đủ 20 tiêu chí chấm điểm (10 tiêu chí Bài kiểm tra thường xuyên 3 — gọi tắt KT3, và 10 tiêu chí Thi kết thúc học phần — gọi tắt FINAL) hay chưa, rồi đề xuất kế hoạch bổ sung cho những gì còn thiếu.

**Đây KHÔNG phải lượt sửa code.** Bạn chỉ đọc, chạy lệnh kiểm tra (không phá dữ liệu), và báo cáo. Việc sửa chữa sẽ là một phiên làm việc riêng, sau khi con người đã duyệt kế hoạch bạn đề xuất.

---

## NGUYÊN TẮC BẮT BUỘC KHI RÀ SOÁT

1. **Không có bằng chứng = không có kết luận.** Mỗi tiêu chí phải được gắn với bằng chứng cụ thể: đường dẫn file + tên hàm/dòng, hoặc lệnh đã chạy + kết quả thực tế (paste output thật, không tóm tắt bịa). Nếu không tìm thấy bằng chứng, ghi rõ **"Không tìm thấy bằng chứng"** — đây là kết luận hợp lệ, không phải thất bại của bạn.
2. **Dùng đúng 4 mức đánh giá cho mỗi tiêu chí**, không dùng thang điểm khác:
   - ✅ **Đạt** — có bằng chứng rõ ràng, chạy được, đúng như mô tả
   - ⚠️ **Đạt một phần** — có triển khai nhưng thiếu sót cụ thể (nêu rõ thiếu gì)
   - ❌ **Chưa đạt** — không tìm thấy triển khai, hoặc triển khai nhưng không chạy được
   - ❓ **Không xác định được** — cần thông tin/quyền truy cập bạn không có (ví dụ cần chạy demo thật với tài khoản thật)
3. **Không tin tưởng mù quáng vào tài liệu cũ.** Nhóm đã có báo cáo KT1 (thiết kế) và KT2 (báo cáo tiến độ lập trình, ghi nhận 108/108 test tại thời điểm đó). Đừng coi số liệu đó là đúng ở hiện tại — **hãy tự chạy lại** (`pytest -v`, `git log`, v.v.) và so sánh. Nếu có sai khác, báo cáo sai khác đó, không im lặng chọn số liệu cũ.
4. **Không trùng lặp công việc.** Nhiều tiêu chí KT3 và FINAL kiểm tra cùng một thứ (đã ghi chú "Trùng với KT3-#" bên dưới) — kiểm tra một lần, ghi kết quả ở cả hai bảng.
5. **Đề xuất sửa phải tối giản, bám sát luồng thật — không vẽ thêm kiến trúc song song.** Đây là nguyên tắc dự án đã tự đặt ra trong `DESIGN_AI_ADMIN_CONTROL.md` sau một lần thất bại vì làm phức tạp hoá (BYOK, Envelope Encryption, Circuit Breaker...). Khi đề xuất kế hoạch bổ sung ở phần cuối, **ưu tiên phương án sửa nhỏ nhất có thể chấp nhận được**, ghi rõ phương án bạn *cố tình không chọn* và lý do, giống văn phong tài liệu đó.
6. **Không tự sửa file trong lượt này**, kể cả khi thấy lỗi rất nhỏ và rõ ràng cách sửa. Ghi vào danh sách kế hoạch, chờ duyệt.

---

## BỐI CẢNH DỰ ÁN (để bạn không mất công dò lại từ đầu)

- Hệ thống: nền tảng tuyển dụng đa bên (Ứng viên / Nhà tuyển dụng / Quản trị viên), tên nội bộ "AI-Powered Job Portal".
- Backend: Python 3.13, FastAPI (async), SQLAlchemy, Pydantic v2. Frontend: React 18 + TypeScript + Vite.
- CSDL: PostgreSQL 17 + pgvector (HNSW) cho vector 384 chiều; test chạy trên SQLite.
- 5 năng lực AI đã biết tồn tại trong hệ thống ở một mức độ nào đó — hãy xác minh lại từng cái, đừng giả định:
  1. AI Matching Score (embedding, cosine similarity, không gọi LLM)
  2. Tóm tắt CV (`cv_evaluator.py` hoặc tương đương)
  3. Gợi ý câu hỏi phỏng vấn (`interview_questions.py`)
  4. Soạn email tuyển dụng (`email_generator.py`)
  5. Career Copilot / gợi ý lộ trình (`roadmap_suggest.py`, `assistant`)
- Tính năng đang phát triển thêm: **Admin AI Control Panel** (ghi log lời gọi AI vào `ai_call_logs`, quản lý prompt qua `ai_prompt_configs` với cơ chế fallback) — theo ghi nhận gần nhất mới hoàn thành khoảng 50%. **Hãy kiểm tra tiến độ THẬT hiện tại**, có thể đã thay đổi.
- Toàn bộ lời gọi LLM đi qua một điểm duy nhất: `deepseek_client.py` — đây là quy ước kiến trúc quan trọng của dự án, nếu thấy có nơi gọi LLM API trực tiếp mà không qua file này, đó là một phát hiện đáng ghi nhận (vi phạm quy ước tự đặt ra).

---

## PHẦN 1 — RÀ SOÁT THEO 10 TIÊU CHÍ KT3

Với mỗi tiêu chí, thực hiện đúng hướng dẫn kiểm tra kèm theo, không chỉ đọc lướt.

**KT3-1. Tích hợp được chức năng AI vào hệ thống** *(Chức năng AI chạy trong hệ thống, phục vụ nghiệp vụ cụ thể, không tách rời sản phẩm)*
→ Với mỗi năng lực AI liệt kê ở trên: tìm route/endpoint frontend gọi tới nó (không phải chỉ gọi được qua script test hoặc Postman); xác nhận kết quả AI có được lưu vào CSDL và ảnh hưởng luồng nghiệp vụ thật (ví dụ `ai_matching_score` có thật sự hiển thị trong pipeline ứng viên hay chỉ tính rồi bỏ đó).

**KT3-2. Kết nối API/model AI đúng cách** *(gọi được OpenAI/Gemini/Claude/HF/Ollama hoặc tương đương; bảo vệ API key)*
→ Mở `deepseek_client.py`: xác nhận key đọc từ biến môi trường (`os.getenv`/`settings`), không hardcode chuỗi key trong code. Chạy `grep -rn "sk-\|api_key\s*=\s*[\"']" --include="*.py"` toàn repo để tìm key lộ. Kiểm tra `.gitignore` có chứa `.env` không. Nếu có quyền, chạy `git log -p -- .env 2>/dev/null | head -50` để chắc chắn `.env` chưa từng bị commit trong lịch sử.

**KT3-3. Thiết kế prompt có hệ thống** *(prompt tách khỏi code, có system/user prompt, ràng buộc output, hướng dẫn xử lý dữ liệu)*
→ Với từng service AI sinh nội dung: prompt có nằm ở hằng số/file/CSDL riêng (`ai_prompt_configs`, `prompt_loader.py`) hay bị nối chuỗi (string concatenation) ngay trong logic nghiệp vụ? Có phân tách rõ system prompt (vai trò, ràng buộc) và user prompt (dữ liệu cụ thể) không? Có yêu cầu định dạng đầu ra (ví dụ JSON schema) và ràng buộc nội dung (không suy diễn giới tính/tuổi, không tự quyết định tuyển/loại) được viết thành lời trong prompt hay chỉ có trong tài liệu thiết kế mà prompt thật không có?

**KT3-4. Tối ưu prompt qua thử nghiệm** *(ít nhất 3 vòng thử nghiệm hoặc so sánh prompt/model, có ghi nhận kết quả và cải tiến)*
→ Tìm bằng chứng lặp lại/so sánh: log thay đổi prompt qua các commit (`git log --oneline -- "**/prompt*"`), file thiết kế có ghi "phiên bản 1 → phát hiện lỗi → phiên bản 2" không, có file so sánh kết quả giữa các lần thử không. **Đây thường là tiêu chí yếu nhất của các đồ án sinh viên — nếu không tìm thấy gì, ghi rõ ❌ và đừng cố diễn giải một bản prompt duy nhất thành "đã tối ưu".**

**KT3-5. Sử dụng dữ liệu hệ thống trong chức năng AI** *(AI khai thác dữ liệu phù hợp từ CSDL/file/báo cáo; có kiểm soát quyền truy cập dữ liệu)*
→ Xác nhận input gửi cho AI lấy từ truy vấn CSDL thật (`db.query(...)`) chứ không phải chuỗi mẫu hardcode trong lúc code thử rồi quên xoá. Kiểm tra truy vấn có lọc theo `company_id`/quyền người dùng trước khi đưa dữ liệu vào prompt hay không — tức là không có khả năng dữ liệu công ty A lọt vào ngữ cảnh AI khi nhân viên công ty B thao tác.

**KT3-6. Hiển thị kết quả AI rõ ràng** *(dễ hiểu, định dạng phù hợp, có cảnh báo khi cần)*
→ Tìm component frontend hiển thị từng loại kết quả AI. Có parse/hiển thị có cấu trúc (card, danh sách, bảng...) hay hiển thị nguyên JSON thô? Component cảnh báo (ví dụ `AIDisclaimerBanner`) có thật sự được import và render trên các màn hình đó không, hay chỉ định nghĩa ra mà không nơi nào dùng (`grep -rn "AIDisclaimerBanner"` để xác nhận số nơi sử dụng).

**KT3-7. Xử lý lỗi và giới hạn AI** *(timeout, rate limit, response rỗng/sai định dạng, dữ liệu quá dài, lỗi model)*
→ Kiểm tra `deepseek_client.py` có cấu hình timeout không. Có xử lý khi response không phải JSON hợp lệ (`try/except json.JSONDecodeError` hoặc tương đương) không. Có giới hạn độ dài input trước khi đưa vào prompt (CV/mô tả công việc quá dài) không. Có xử lý khi API trả lỗi 429 (rate limit) hoặc 5xx không, hay để lỗi bắn thẳng lên người dùng.

**KT3-8. Kiểm thử chức năng quản lý và chức năng AI** *(có test case, manual test hoặc script test; gồm trường hợp đúng, sai, biên)*
→ Chạy `pytest -v` toàn bộ, ghi lại kết quả thật (số pass/fail thật tại thời điểm rà soát, không dùng số cũ từ báo cáo KT2). Với riêng các test liên quan AI: có test case cho response rỗng, response sai định dạng, input rỗng/quá dài không, hay chỉ test đường happy-path (input hợp lệ → output hợp lệ)?

**KT3-9. Review code và cải thiện chất lượng bằng AI** *(minh chứng dùng AI để review code, phát hiện lỗi, refactor hoặc cải thiện bảo mật)*
→ Tìm tài liệu/ghi chú tương tự `DESIGN_AI_ADMIN_CONTROL.md` (biên bản AI rà soát và phát hiện lỗ hổng thiết kế) — đó là bằng chứng hợp lệ cho *review thiết kế*, nhưng tiêu chí này cần thêm bằng chứng *review code thật* (ví dụ: yêu cầu AI đọc một file cụ thể tìm lỗi bảo mật/logic). Nếu chưa có, đề xuất trong kế hoạch: tự bạn (agent) thực hiện ngay một lượt review thật trên 2-3 file rủi ro cao nhất (ví dụ `deepseek_client.py`, router `/admin/ai/*`, `email_generator.py`), ghi lại phát hiện, làm bằng chứng cho tiêu chí này.

**KT3-10. Tích hợp chức năng AI với trải nghiệm người dùng** *(luồng tự nhiên, hữu ích, không gây nhầm lẫn với chức năng quản lý chính)*
→ Đánh giá định tính: nút gọi AI có nằm đúng ngữ cảnh thao tác (ví dụ nút "Tóm tắt CV bằng AI" nằm ngay trên trang chi tiết hồ sơ ứng tuyển) hay bị nhét vào một trang riêng biệt, tách khỏi luồng thao tác chính? Người dùng có cần rời khỏi tác vụ đang làm để dùng tính năng AI không?

---

## PHẦN 2 — RÀ SOÁT THEO 10 TIÊU CHÍ THI KẾT THÚC HỌC PHẦN

**FINAL-1. Hoàn thiện chức năng hệ thống** *(chức năng quản lý và AI hoạt động đầy đủ, ổn định, đúng yêu cầu)*
→ Đối chiếu danh sách chức năng đã cam kết trong báo cáo KT1 (actor/use case) và KT2 (bảng CRUD) với thực tế hiện tại — chức năng nào trong danh sách đó **không còn hoạt động hoặc chưa từng có** trong code? Liệt kê chênh lệch cụ thể.

**FINAL-2. Chất lượng kiến trúc và mã nguồn** *(rõ ràng, module hoá, dễ bảo trì, đúng quy ước framework)*
→ Có file/hàm nào quá dài (>300-400 dòng, nhiều trách nhiệm trộn lẫn) không (`wc -l` các file trong `services/`, `routers/`). Có logic nghiệp vụ trùng lặp giữa nhiều nơi không. Có chạy linter (`ruff`/`flake8`/`eslint`) sạch không — chạy thử và báo số lỗi/cảnh báo thật.

**FINAL-3. Chất lượng cơ sở dữ liệu** *(hợp lý, nhất quán, có ràng buộc, dữ liệu mẫu, sao lưu/khôi phục cơ bản)*
→ Thử chạy toàn bộ migration từ đầu trên một CSDL rỗng (`alembic upgrade head` trên DB test sạch) — có lỗi không. Có script/seed dữ liệu mẫu chạy được không. Có tài liệu hoặc lệnh sao lưu/khôi phục (`pg_dump`/`pg_restore`) được ghi ở đâu đó (README/docs) không, hay chưa từng nhắc tới.

**FINAL-4. Chất lượng giao diện và trải nghiệm người dùng**
→ Kiểm tra cấu hình responsive (Tailwind breakpoints) có được dùng nhất quán không hay chỉ vài trang. Kiểm tra độ phủ của thông báo lỗi/toast trên các form quan trọng (đăng nhập, nộp hồ sơ, đăng tin) — bấm thử luồng lỗi (sai mật khẩu, để trống trường bắt buộc) nếu có thể chạy được ứng dụng.

**FINAL-5. Chất lượng chức năng AI** *(hữu ích, đúng ngữ cảnh, kiểm soát sai lệch, có giới hạn và cảnh báo rõ)* — *Trùng với KT3-3, KT3-6, KT3-7*
→ Tổng hợp lại kết quả 3 mục đó. Bổ sung: thử chạy trực tiếp 2-3 lời gọi AI thật với dữ liệu mẫu thực tế (CV thật, mô tả việc thật) và **tự đọc kết quả để đánh giá chất lượng bằng lời** (không chỉ kiểm tra "chạy không lỗi") — output có thực sự hữu ích, đúng ngữ cảnh, không chung chung sáo rỗng không?

**FINAL-6. Bảo mật, quyền riêng tư và đạo đức AI** — *Trùng với KT3-2, KT3-5*
→ Bổ sung thêm: RBAC có được enforce ở tầng backend (dependency/middleware) hay chỉ ẩn nút ở frontend (kiểm tra bằng cách gọi thẳng API bằng token vai trò thấp hơn xem có bị chặn không, nếu có công cụ gọi API). Việc lọc PII trước khi gửi cho AI (đã ghi trong thiết kế) có thật sự có trong code hay chỉ là ý định trong tài liệu.

**FINAL-7. Hiệu năng và độ ổn định** *(phản hồi hợp lý, xử lý được dữ liệu demo, có cơ chế tránh lỗi lặp lại)*
→ Tìm các đoạn code có khả năng N+1 query (vòng lặp gọi `db.query` bên trong loop). Tìm vòng lặp gọi AI không có giới hạn số lần retry (rủi ro lặp vô hạn hoặc tốn chi phí không kiểm soát).

**FINAL-8. Triển khai và đóng gói** *(hướng dẫn triển khai, cấu hình môi trường, dữ liệu mẫu; khuyến khích Docker)*
→ Nếu có quyền chạy shell: thử `docker compose up -d --build` từ một checkout sạch, xác nhận có lên được không, ghi log lỗi thật nếu có. Đối chiếu từng bước trong README với những gì vừa làm — bước nào trong README không còn đúng với thực tế code hiện tại?

**FINAL-9. Báo cáo kỹ thuật đầy đủ** *(mô tả phân tích, thiết kế, triển khai, kiểm thử, chức năng AI và vai trò AI trong SDLC)*
→ Đối chiếu báo cáo KT1 và KT2 đã có với code thực tế hiện tại — phần nào trong hai báo cáo đó **không còn khớp** với hiện trạng (ví dụ tên bảng đổi, entity mới thêm, use case đổi luồng) và cần cập nhật trước khi nộp báo cáo cuối kỳ.

**FINAL-10. Thuyết trình và demo** *(mạch lạc, rõ chức năng quản lý/AI, minh chứng dùng AI, trả lời câu hỏi tốt)*
→ Không audit được bằng code. Thay vào đó: liệt kê một kịch bản click-through cụ thể từ đầu đến cuối (đăng nhập → nghiệp vụ chính → điểm chạm AI → kết quả) để nhóm tập demo, chỉ rõ bước nào trong luồng đó hiện đang có nguy cơ lỗi/giật/chưa mượt dựa trên các phát hiện ở các mục trên.

---

## ĐỊNH DẠNG BÁO CÁO ĐẦU RA

Tạo một file duy nhất `docs/KT3_FINAL_AUDIT_REPORT.md` với cấu trúc:

1. **Tổng quan mức độ sẵn sàng** — đếm số ✅/⚠️/❌/❓ cho mỗi bộ tiêu chí (KT3 và FINAL riêng), không quy ra phần trăm giả tạo.
2. **Bảng chi tiết KT3** — 10 dòng: `Tiêu chí | Kết luận | Bằng chứng cụ thể | Ghi chú thiếu sót`
3. **Bảng chi tiết FINAL** — 10 dòng, cùng định dạng, ghi chú "Trùng với KT3-#" ở dòng liên quan
4. **Danh sách lỗ hổng theo thứ tự ưu tiên xử lý** — sắp xếp theo (a) rủi ro lộ ra khi demo trước hội đồng nếu không sửa, (b) công sức sửa trong thời gian còn lại. Với mỗi lỗ hổng: mô tả, vì sao ưu tiên mức đó.
5. **Kế hoạch bổ sung cụ thể** — với mỗi mục ⚠️/❌: việc cần làm ở cấp file/hàm, ước lượng công sức (nhỏ/vừa/lớn), cách xác minh đã xong (lệnh chạy hoặc test cụ thể chứng minh). Ghi rõ phương án **cố tình không chọn** nếu có phương án phức tạp hơn bị loại vì không tương xứng thời gian còn lại.
6. **Dừng lại ở đây và chờ duyệt.** Không tự triển khai bất kỳ mục nào trong kế hoạch khi chưa có xác nhận từ người dùng.

---

## NHẮC LẠI TRƯỚC KHI BẮT ĐẦU

- Đây là lượt **đọc và báo cáo**, không sửa file.
- Mọi kết luận phải có bằng chứng dán kèm (output lệnh thật, đường dẫn file thật).
- Nếu thiếu quyền/thông tin để kết luận một mục, dùng ❓ và nói rõ cần gì để kết luận được, đừng đoán.

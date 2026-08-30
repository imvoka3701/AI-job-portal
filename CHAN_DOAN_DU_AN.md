# CHẨN ĐOÁN TIẾN ĐỘ DỰ ÁN — AI Job Portal

> Tài liệu ghi nhận tiến độ từng sprint lớn, số liệu xác nhận và rút kinh nghiệm.  
> Cập nhật sau mỗi sprint hoàn thành và được commit.

---

## Sprint 1 — Admin AI Control Panel

**Ngày hoàn thành:** 2026-08-30  
**Tài liệu thiết kế:** [DESIGN_AI_ADMIN_CONTROL.md](./DESIGN_AI_ADMIN_CONTROL.md)  
**Trạng thái:** ✅ Hoàn thành — 6 commit đã lưu, working tree clean

---

### 1. 5/5 AI Services đã tích hợp đầy đủ

| # | Service file | Feature key | `get_system_prompt` | AI Call Logging (`AICallLog` DB) | `ai_audit` log |
|---|---|---|---|---|---|
| 1 | `cv_evaluator.py` | `cv_evaluate` | ✅ | ✅ | ✅ |
| 2 | `roadmap_suggest.py` | `roadmap` | ✅ | ✅ | ✅ |
| 3 | `cv_summarizer.py` | `summarize_cv` | ✅ | ✅ | ✅ |
| 4 | `interview_questions.py` | `interview_questions` | ✅ | ✅ | ✅ |
| 5 | `email_generator.py` | `generate_email` | ✅ (Persona pattern) | ✅ | ✅ |

**Ghi chú Persona pattern (email_generator):**  
Admin chỉnh tone/style qua DB. `EMAIL_TYPE_SYSTEM_RULES` (invite/reject/offer) hardcode trong mã nguồn — không thể xoá qua UI — đảm bảo ràng buộc pháp lý cho email từ chối (reject) không bị mất.

---

### 2. Số liệu xác nhận cuối sprint

| Chỉ số | Kết quả |
|---|---|
| pytest backend (toàn bộ suite) | **160 passed / 9 skipped / 0 failed** |
| pytest coverage | **82.54%** (yêu cầu ≥ 80% ✅) |
| Vitest frontend | **43 passed / 13 files / 0 failed** |
| `npx tsc --noEmit` | **0 errors** |

---

### 3. Danh sách 6 commit theo thứ tự

| Hash | Nội dung |
|---|---|
| `5b13fa7` | `feat: Admin AI Control Panel - DB models, migration, prompt_loader, app startup` |
| `f02af79` | `feat: integrate db+prompt_loader+logging into all 5 AI services (Persona pattern for email)` |
| `193e2d4` | `feat: admin_ai router (prompt CRUD + test endpoint + logs/stats); fix: ai.py + resumes.py pass db to services` |
| `6e3854d` | `test: add test_admin_ai suite (160 tests); fix flaky test_email_generator with RUN_REAL_LLM guard; add regression test for reject-email type composition` |
| `8ee05cc` | `feat: Admin AI UI - AIPromptsPage (Persona pattern), AdminAILogsPage (stacked bar, trend KPI), routing` |
| `26de7ae` | `fix: add ai_audit logging to generate_email endpoint (was missing unlike other 4 AI endpoints)` |

---

### 4. Bug nghiêm trọng đã phát hiện và xử lý trong sprint

**Bug:** `POST /admin/ai/prompts/generate_email/test` với `email_type=reject` trả về kết quả test với:
- System prompt = Persona thuần (không có `EMAIL_TYPE_SYSTEM_RULES["reject"]`)
- Sample input luôn là `"Loai: invite"` bất kể Admin chọn loại gì

**Hậu quả:** Admin không thể thực sự kiểm tra ràng buộc pháp lý của email từ chối qua UI — đây là rủi ro cao nhất trong hệ thống.

**Fix:** `effective_system = persona + EMAIL_TYPE_SYSTEM_RULES[email_type]`, sample input đúng loại.

**Regression test vĩnh viễn:** `tests/test_admin_ai.py::TestTestPrompt::test_email_test_composes_different_system_prompt_per_type` — assert 4 điều kiện, không thể bị revert âm thầm.

---

### 5. Quy trình bổ sung Bước E — Rút kinh nghiệm từ sprint này

**Sự cố:** Toàn bộ sprint (14 file thay đổi) làm việc trực tiếp trên working tree mà không commit. Một lệnh `git checkout -- .` vô tình có thể xoá hết mọi thay đổi mà không có cảnh báo.

**Quy trình A-B-C-D cũ:**
- A: Refactor → B: pytest → C: Test tay marker → D: Restore file test tạm

**Quy trình A-B-C-D-**E **bắt buộc từ nay:**
- A: Refactor → B: pytest → C: Test tay marker → D: Restore file test tạm → **E: `git add` + `git commit` ngay lập tức**

Bước E không chờ đến cuối sprint — commit sau mỗi service hoàn thành (Bước D xong là commit ngay).

---

### 6. Điểm mở còn lại (không trong scope sprint này)

| # | Việc | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Vitest unit test riêng cho `AdminAILogsPage.tsx` | ⏳ Chưa làm | Trang mới, chỉ có `tsc --noEmit` + suite chung. Cần tạo file test riêng mock `getAICallLogs`, `getAIStats` |
| 2 | E2E test (Playwright) cho `/admin/ai/logs` và `/admin/ai/prompts` | ⏳ Chưa làm | Playwright chưa được setup trong project. Cần quyết định có thêm Playwright vào stack không trước khi làm |

---

*Cập nhật bởi: AI Tech Lead Agent — Sprint Admin AI Control Panel*

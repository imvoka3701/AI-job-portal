# 📌 Checklist Tổng Hợp — Việc Còn Lại

> File này gom TOÀN BỘ việc còn dang dở từ nhiều nguồn rải rác (CHAN_DOAN_DU_AN.md, 
> DESIGN_AI_ADMIN_CONTROL.md, các báo cáo audit, checklist_Tong_quat.md...) thành 
> 1 danh sách duy nhất. **Từ giờ dùng file này làm nguồn chân lý chính**, không cần 
> lục lại các cuộc trò chuyện cũ.
>
> ⏰ Còn khoảng 3 tuần đến hạn bảo vệ. Danh sách chia theo mức ưu tiên — xem phần 
> "Gợi ý cách dùng file này" ở cuối trước khi bắt đầu.

---

## 🔴 NHÓM 1 — Rủi ro demo-day (làm trước tiên, mỗi việc chỉ mất vài phút)

- [ ] **Tự tay bấm thử Google OAuth** trên trình duyệt thật — đã nhắc 3+ lần trong suốt dự án, **chưa từng được xác nhận đã làm**. Đây là việc duy nhất không có AI nào test thay được.
- [ ] **Đổi mật khẩu admin mặc định** (hiện có thể vẫn là `Admin@123` hoặc tương tự) — bắt buộc trước khi demo/deploy thật.
- [x] **Thống nhất 1 tài khoản admin duy nhất** — trước đó phát hiện có tới 4 tài khoản khác nhau nằm rải rác trong các script/tài liệu (`seed_admin.py`, `add_admin.py`, `project_summary.md`...). Xác nhận đã dọn xong chưa, xóa script thừa.
- [ ] **Spot-check 1-2 tên sách/tác giả trong kết quả AI Roadmap** — xem có thật không (rủi ro AI "bịa" tài liệu tham khảo).
- [x] **Chạy `git status`** ngay bây giờ — xác nhận không còn gì uncommitted (thói quen mới thêm sau sự cố "cả sprint Admin AI Control Panel suýt mất trắng vì chưa commit").

## 🟠 NHÓM 2 — Cần xác nhận lại trạng thái thật (đã "báo cáo xong" nhưng chưa chắc chắn)

- [x] **CV Preview** — có kế hoạch sửa (fix path Windows, CVCard mới, Preview Modal dùng iframe) đã được duyệt từ lâu, nhưng **chưa từng nhận được báo cáo xác nhận đã code xong**. Cần hỏi lại tình trạng hiện tại.
- [x] **RBAC nội bộ** — đã xác nhận nối vào một số router mẫu (`jobs.py`, `employer.py`) qua `require_company_permission()`. Cần xác nhận **toàn bộ** endpoint liên quan company đều có check này, không chỉ vài chỗ được kiểm tra mẫu.
- [x] **MBTI/MI frontend** — backend đã xác nhận thật (gọi `GET /tools/mbti/questions` ra kết quả JSON thật). Nhưng **chưa xác nhận giao diện** (`/tools`, `/tools/mbti`, `/tools/mi`, trang lịch sử) có thực sự tồn tại và hoạt động qua UI thật hay chỉ có API.
- [x] **CV Builder** — backend xác nhận lưu thật vào DB. Cần xác nhận UI hoàn chỉnh (5 template, autosave như checklist cũ từng nhắc) có thật hay chỉ 1 phần.
- [x] **Dọn "vỏ rỗng" AI Enterprise cũ có sạch triệt để chưa** — `CVEmbedding`, `tenant_ai_config.py`, `kms_service.py`, trang AI Settings cũ (BYOK/Circuit Breaker/Prompt Studio kiểu cũ). Đã xóa 2 lần rồi ("thanh trừng" + sau vụ "khôi phục từ transcript"), nhưng nên `grep` lại 1 lần cuối cho chắc.
- [x] **Tài liệu lỗi thời** — `CLAUDE.md`, `AGENTS.md` (từng ghi "Phase 2 in progress", trỏ file không tồn tại), `.bak` file thừa, `implementation_plan.md` chưa đánh dấu hoàn thành. Đã yêu cầu dọn 1 lần, chưa xác nhận đã xong.

## 🟡 NHÓM 3 — Giai đoạn 5: UI/UX Polish (biết rõ là chưa xong)

- [x] **5.1 Design System** — vẫn còn câu hỏi treo: màu `purple-600` trong `RoundTimeline.tsx` đã sửa chưa? Bảng audit "sửa hàng loạt 24 file" trước đó chưa từng được xem lại bằng mắt để xác nhận đúng hướng. (Đã sửa toàn bộ thành emerald)
- [x] **5.3 Responsive** — chưa làm audit nào (mobile/tablet/desktop).
- [x] **5.5 Accessibility** — chưa làm audit nào (contrast màu, alt text, keyboard nav).
- [x] **5.2 / 5.4 Animation, Empty/Error states** — đã có một phần (component `PageTransition`, `EmptyState`, `ErrorState` tồn tại), nhưng chưa audit xem *mọi* màn hình đều dùng đúng chuẩn chưa.

## 🔵 NHÓM 4 — Admin AI Control Panel (vừa xong, còn sót vài việc nhỏ)

- [x] Thêm Vitest riêng cho `AdminAILogsPage.tsx` (hiện chưa có).
- [x] Thêm E2E smoke test cho `/admin/ai/logs` và `/admin/ai/prompts` (hiện chưa có).

## ⚪ NHÓM 5 — Giai đoạn 6: Docker (phần lớn đã xong)

- [ ] **6.4** — Docker đang chạy "healthy" nhưng chưa từng test trên máy sạch chỉ bằng `docker compose up` (chưa cài Python/Node sẵn) để chắc chắn không phụ thuộc môi trường máy cá nhân.
- [ ] **6.5** (tùy chọn, không bắt buộc) — Deploy thật lên Render/Railway để có link demo online.

## 📄 NHÓM 6 — Tài liệu bảo vệ đồ án (chưa bắt đầu)

- [ ] Viết hồ sơ SDLC (actor, ERD, prompt mẫu, test case, cách dùng AI từng giai đoạn) — đề bài giảng viên yêu cầu.
- [ ] Bảng kiểm soát thiên lệch AI — **tin vui: `ai_audit.py` vừa hoàn thành chính là bằng chứng cụ thể cho phần này**, chỉ cần viết mô tả lại thành tài liệu.
- [ ] README hoàn chỉnh: hướng dẫn chạy Docker, tài khoản demo, kịch bản bảo vệ.

---



**NHÓM 5.5 (cloud deploy) là tùy chọn — nếu thời gian eo hẹp, bỏ qua hoàn toàn cũng không sao**, chạy Docker local lúc demo là đủ.

Mỗi khi hoàn thành 1 mục, quay lại đây đánh dấu `[x]` — giữ thói quen này để không bao giờ rơi vào tình trạng "không biết còn gì chưa xong" như đã từng gặp phải.
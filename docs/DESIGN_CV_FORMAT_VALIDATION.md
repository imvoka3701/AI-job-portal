# 🔍 Thiết Kế: Validate CV Đúng Chuẩn Format

> **Trạng thái:** CHƯA CODE — Đang chờ duyệt thiết kế
> **Vấn đề:** Hệ thống cần phân biệt được "1 file PDF là CV thật, đúng chuẩn" với "1 file PDF bất kỳ" (hóa đơn, bài báo, ảnh scan sách...) — cả lúc upload lẫn lúc chạy AI Matching.

---

## 1. Vấn đề với cách làm hiện tại (nếu đúng như điều tra sơ bộ)

`validate_is_cv()` hiện tại (nếu có) chỉ hỏi LLM 1 câu YES/NO — có 2 nhược điểm:
1. **Không có tầng lọc rẻ tiền trước** — mọi file đều tốn 1 lần gọi Deepseek để biết có phải rác hay không
2. **Kết quả nhị phân, không giải thích được** — Candidate nhận lỗi "CV không hợp lệ" nhưng không biết vì sao (thiếu phần nào, sai định dạng gì)

## 2. Kiến trúc đề xuất — 2 tầng lọc (Layered Defense)

```
Upload PDF → [TẦNG 1: Heuristic — rẻ, nhanh, offline]
                    ↓ (qua được tầng 1)
             [TẦNG 2: LLM structured check — chính xác, có giải thích]
                    ↓ (qua được tầng 2)
             Resume.is_valid_cv = true → cho phép Matching/Evaluate/...
```

### TẦNG 1 — Heuristic Pre-check (không tốn API, chạy tức thì)

Sau khi extract text từ PDF (đã có sẵn `pypdf`), kiểm tra bằng keyword/pattern matching, KHÔNG cần gọi AI:

```python
CV_SECTION_KEYWORDS = {
    "contact": [r"\b\S+@\S+\.\S+\b", r"(0|\+84)\d{9,10}"],  # email/SĐT regex
    "experience": ["kinh nghiệm", "kinh nghiệm làm việc", "experience", 
                   "employment history", "work history"],
    "education": ["học vấn", "trình độ học vấn", "education", "bằng cấp"],
    "skills": ["kỹ năng", "skills", "chuyên môn", "competencies"],
}

# Cần khớp ÍT NHẤT 2/4 nhóm để qua Tầng 1 (contact luôn bắt buộc + 1 nhóm bất kỳ)
```

- Nếu KHÔNG qua Tầng 1: từ chối NGAY, HTTP 422, message cụ thể ("File không có định dạng CV — thiếu thông tin liên hệ và các mục kinh nghiệm/học vấn/kỹ năng"), **không tốn 1 lệnh gọi AI nào**
- Nếu qua Tầng 1: chuyển sang Tầng 2

### TẦNG 2 — LLM Structured Validation (thay cho YES/NO cũ)

Đổi `validate_is_cv()` từ trả `bool` sang trả **JSON có cấu trúc**:

```python
class CVValidationResult(BaseModel):
    is_valid_cv: bool
    confidence: int  # 0-100
    detected_sections: list[str]   # ["contact", "experience", "skills"]
    missing_sections: list[str]    # ["education"]
    reason: str | None  # giải thích ngắn nếu invalid, ví dụ "Đây là hóa đơn, không phải CV"
```

Lợi ích: Candidate nhận được lỗi **cụ thể**, không chỉ "không hợp lệ" — ví dụ: *"File thiếu phần Kinh nghiệm làm việc và Học vấn — vui lòng dùng CV đầy đủ hơn"*.

## 3. Lưu trạng thái validate vào DB — không validate lại mỗi lần dùng

```python
# Thêm vào model Resume:
is_valid_cv: bool | None       # None = chưa validate, True/False = đã validate
validation_reason: str | None  # lý do nếu invalid
validated_at: datetime | None
```

**Lý do bắt buộc phải lưu:** nếu không lưu, mỗi lần gọi `/ai/match` với 1 resume lại phải validate lại → tốn thêm 1 lệnh gọi AI vô ích cho mỗi lần matching. Validate 1 lần lúc upload, tái sử dụng kết quả mãi mãi (trừ khi Candidate upload lại CV mới).

## 4. Gate AI Matching — chặn tại nguồn, không tính toán với input rác

Sửa `services/ai_matching.py`:
```python
def match(resume: Resume, job: Job):
    if resume.is_valid_cv is False:
        raise AIServiceError(
            code="INVALID_CV_FORMAT",
            message="CV này chưa đúng chuẩn định dạng, không thể phân tích độ phù hợp.",
            detail=resume.validation_reason,
        )
    # ... tính cosine similarity như cũ
```

Áp dụng tương tự cho `/ai/evaluate`, `/ai/summarize-cv` — **mọi tính năng AI dùng CV đều phải check `is_valid_cv` trước khi chạy**, không chỉ riêng Matching.

## 5. Frontend — hiển thị lỗi rõ ràng, hướng dẫn cụ thể

- Lúc upload: nếu bị từ chối ở Tầng 1 hoặc Tầng 2, hiển thị đúng `reason`/`missing_sections` — không chỉ "Lỗi", mà "CV thiếu: Học vấn, Kỹ năng — vui lòng bổ sung"
- Lúc bấm AI Matching với 1 CV đã bị đánh dấu `is_valid_cv=false`: disable nút, hiện tooltip "CV này chưa đúng chuẩn, cần tải lại CV hợp lệ trước"

## 6. Việc CỐ TÌNH KHÔNG làm (giữ đơn giản, đúng tinh thần dự án)

- ❌ Không xây dựng parser cấu trúc CV phức tạp (OCR, NLP tách trường tự động) — chỉ cần validate CÓ/KHÔNG đúng định dạng, không cần trích xuất chi tiết từng trường
- ❌ Không cho phép Admin tùy chỉnh ngưỡng Tầng 1 qua UI — hardcode danh sách keyword, đơn giản và đủ dùng cho phạm vi đồ án
- ❌ Không hỗ trợ nhiều ngôn ngữ ngoài Việt/Anh cho keyword Tầng 1

## 7. Câu hỏi cần bạn quyết định trước khi duyệt

1. Nếu CV **không qua được Tầng 1** — vẫn cho phép Candidate **lưu file** (chỉ đánh dấu `is_valid_cv=false`, không dùng được cho Matching), hay **từ chối lưu hoàn toàn** (bắt upload lại ngay)? 
   - *Đề xuất: vẫn cho lưu (Candidate có thể có nhiều CV, 1 cái không chuẩn không nên chặn cả tài khoản), chỉ chặn riêng tính năng AI dùng CV đó.*
2. Ngưỡng "khớp 2/4 nhóm" ở Tầng 1 có hợp lý không, hay cần chặt/lỏng hơn?

## 8. Kế hoạch triển khai (chia nhỏ, verify từng bước — theo đúng quy trình A-B-C-D-E)

1. Migration thêm 3 cột vào `Resume` — verify SQLite + PostgreSQL
2. Viết `cv_format_validator.py` (Tầng 1 heuristic) — test độc lập với vài file mẫu (CV thật, hóa đơn, bài báo)
3. Sửa `validate_is_cv()` → trả JSON có cấu trúc (Tầng 2) — test với Deepseek thật
4. Tích hợp cả 2 tầng vào luồng upload (`resumes.py`) — lưu kết quả vào DB
5. Gate `/ai/match`, `/ai/evaluate`, `/ai/summarize-cv` theo `is_valid_cv`
6. Frontend hiển thị lỗi cụ thể + disable nút Matching khi CV invalid
7. Commit sau mỗi bước, chạy pytest -v đầy đủ mỗi lần

## 9. Tiêu chí hoàn tất

- [ ] Upload 1 file PDF ngẫu nhiên (không phải CV) → bị từ chối ở Tầng 1, có message cụ thể, KHÔNG tốn lệnh gọi AI nào (verify bằng cách xem `ai_call_logs` không tăng)
- [ ] Upload 1 CV thật, thiếu 1 mục (ví dụ không có phần Kỹ năng) → qua Tầng 1 nhưng bị Tầng 2 từ chối với lý do cụ thể
- [ ] Upload 1 CV thật, đầy đủ → qua cả 2 tầng, `is_valid_cv=true`
- [ ] Gọi `/ai/match` với CV có `is_valid_cv=false` → nhận lỗi rõ ràng, KHÔNG trả về % matching vô nghĩa
- [ ] `pytest -v` toàn bộ vẫn pass sau khi hoàn tất

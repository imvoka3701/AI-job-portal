# Báo Cáo Điều Tra Hiện Trạng — 4 Điểm

> **Ngày:** 2026-09-05 | **Phạm vi:** Backend routers + Frontend components | **Tính chất:** Chỉ đọc, không sửa code

---

## 1. VALIDATE CV KHI UPLOAD

### 1.1 Vị trí gọi `validate_is_cv()` trong luồng upload

Trong [resumes.py](file:///d:/ai-job-portal/backend/app/routers/resumes.py), hàm `upload_resume()` thực hiện **6 bước tuần tự**:

| Bước | Hành động | Dòng |
|------|-----------|------|
| 1 | Validate content type (PDF) | [L49-53](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L49-L53) |
| 2 | **Lưu file vào disk** (`save_file_upload`) | [L56-62](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L56-L62) |
| 3 | Extract text từ PDF | [L65-72](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L65-L72) |
| 4 | Validate text dài đủ (>100 ký tự) | [L74-81](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L74-L81) |
| **4.5** | **`validate_is_cv(raw_text)`** — gọi AI check | [L84-94](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L84-L94) |
| 5 | Generate embedding | [L97-104](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L97-L104) |
| 6 | Tạo DB record | [L107-123](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L107-L123) |

> [!WARNING]
> **File đã được lưu vào disk TRƯỚC khi validate nội dung CV (bước 2 < bước 4.5).** Nếu validation thất bại, file vật lý **vẫn tồn tại trên disk** — không có logic cleanup/xóa file khi raise HTTPException. Tuy nhiên, record **không** được tạo trong DB (bước 6 chưa chạy), nên file trở thành "orphan" trên filesystem.

### 1.2 Response khi CV không hợp lệ

```python
# resumes.py L90-94
if not is_valid_cv:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=reject_reason or "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường..."
    )
```

- **HTTP Status:** `422 Unprocessable Entity`
- **Message:** `reject_reason` từ LLM (bằng tiếng Việt, mô tả cụ thể lý do), hoặc fallback mặc định: *"Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường (thiếu thông tin cá nhân, kinh nghiệm hoặc học vấn). Vui lòng tải lên file CV hợp lệ."*

### 1.3 Tiêu chí "CV hợp lệ" — 2 tầng kiểm tra

`validate_is_cv()` delegate sang `validate_cv_structure()` trong [cv_evaluator.py](file:///d:/ai-job-portal/backend/app/services/cv_evaluator.py#L72-L154), triển khai **2 tầng**:

**Tầng 1 — Heuristic keyword check (L88-103):**
```python
cv_section_keywords = [
    "kinh nghiệm", "experience", ..., "kỹ năng", "skill", "skills", ...,
    "học vấn", "education", ..., "mục tiêu", "objective", "summary", ...
]
matched_keywords = [kw for kw in cv_section_keywords if kw in text_lower]
if len(matched_keywords) < 2:
    return (False, "Hồ sơ tải lên không đúng định dạng CV...")
```
- Kiểm tra text có chứa **ít nhất 2 trong 20+ từ khóa** section CV phổ biến (song ngữ Việt-Anh).
- Nếu < 2 keywords → **reject ngay**, không gọi LLM (tiết kiệm API call).

**Tầng 2 — LLM analysis (L105-154):**
- Gửi 2000 ký tự đầu của text cho LLM với system prompt chi tiết:
  - Phải có **thông tin ứng viên** (họ tên/chức danh/liên hệ) **KẾT HỢP** với quá trình học vấn/lịch sử làm việc/kỹ năng.
  - Reject rõ ràng: code lập trình, đề thi, bài viết kỹ thuật, hợp đồng, hóa đơn, bài báo, tài liệu hành chính.
- LLM trả JSON `{ is_valid: bool, reason: string }`.
- **Fallback khi LLM lỗi:** Nếu heuristic đã match ≥ 3 keywords → coi là valid. Nếu < 3 → reject.

> [!NOTE]
> Tiêu chí KHÔNG chỉ là YES/NO chung chung — có check cấu trúc cụ thể cả ở tầng heuristic (keyword match) lẫn tầng LLM (yêu cầu có thông tin cá nhân + kinh nghiệm/học vấn/kỹ năng).

---

## 2. AI MATCHING VỚI CV KHÔNG HỢP LỆ

### Phân tích endpoint `/ai/match`

Xem [ai.py L267-295](file:///d:/ai-job-portal/backend/app/routers/ai.py#L267-L295) và [ai_matching.py L226-270](file:///d:/ai-job-portal/backend/app/services/ai_matching.py#L226-L270):

```python
# ai.py — match_resume_to_job()
resume = crud_resume.get_by_id(db, resume_id=data.resume_id)
# ... authorization checks ...
job = crud_job.get_by_id(db, job_id=data.job_id)
# ... check job.embedding ...
return await ai_matching_service.compute_match(db, resume=resume, job_embedding=..., job=job, deep_analysis=True)
```

```python
# ai_matching.py — compute_match()
if resume.embedding is None and resume.raw_text:
    # Lazy generate embedding
    resume.embedding = generate_embedding(resume.raw_text)
if resume.embedding is None:
    return AIMatchResponse(score=0.0, explanation="Resume has no embedding...")
# ... compute cosine similarity ...
```

> [!CAUTION]
> **KHÔNG có bất kỳ check nào xác minh lại nội dung CV là hợp lệ** tại thời điểm matching. Cụ thể:
> - Không gọi lại `validate_is_cv()` hay `validate_cv_structure()`.
> - Không kiểm tra trường nào đánh dấu "đã qua validation" trên record Resume.
> - Không có minimum text quality/length check trước khi tính embedding.
>
> **Hệ quả:** Nếu một CV rác (ví dụ: hóa đơn, bài báo) bằng cách nào đó lọt qua bước upload (do LLM fail silently, do tạo qua endpoint `POST /resumes` không có validation, hoặc dữ liệu cũ trước khi validation được thêm vào), hệ thống **vẫn tính embedding, tính cosine similarity, gọi deep LLM rubric analysis, và trả về % match bình thường** — con số hoàn toàn vô nghĩa.

### Bypass path: `POST /resumes` (không qua upload)

Đặc biệt lưu ý endpoint [POST /resumes](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L126-L144) (dòng 126-144):

```python
def create_resume(data: ResumeCreate, ...):
    if data.embedding is None and data.raw_text:
        data.embedding = generate_embedding(data.raw_text)
    resume = crud_resume.create(db, obj_in=data, user_id=current_user.id)
```

**Endpoint này KHÔNG gọi `validate_is_cv()` ở bất cứ đâu** — nó tạo resume record trực tiếp từ payload, bỏ qua hoàn toàn validation pipeline. Bất kỳ text nào cũng được chấp nhận.

---

## 3. CV PREVIEW — HIỆN TRẠNG THẬT

### 3.1 Lỗi "Mở tab mới" gọi URL trực tiếp (401) — ĐÃ ĐƯỢC SỬA

Xem [CVPreviewModal.tsx](file:///d:/ai-job-portal/frontend/src/pages/candidate/components/CVPreviewModal.tsx):

**Trước đây (audit cũ):** Nút "Mở tab mới" mở URL trực tiếp `/api/resumes/{id}/content` → không gắn JWT → 401.

**Hiện tại (đã sửa — L50-59, L90-95):**
```tsx
// Fetch PDF qua apiClient (có JWT) → tạo blob URL
apiClient.get(requestUrl, { responseType: "arraybuffer", headers: { Accept: "application/pdf" } })
  .then((res) => {
    const pdfBlob = new Blob([res.data], { type: "application/pdf" });
    objectUrl = URL.createObjectURL(pdfBlob);
    setBlobUrl(objectUrl);
  });

// Nút "Mở tab mới" dùng blob URL (không cần JWT)
onClick={() => blobUrl && window.open(blobUrl, "_blank", "noopener,noreferrer")}
```

✅ **Đã sửa:** Fetch qua `apiClient` (auto-attach JWT), tạo blob URL, nút "Mở tab mới" mở blob URL thay vì URL trực tiếp.

### 3.2 Blob URL leak do closure sai — ĐÃ ĐƯỢC SỬA

**Hiện tại (L69-74):**
```tsx
return () => {
  isMounted = false;
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
};
```

✅ **Đã sửa:** Cleanup function dùng local variable `objectUrl` (captured trong closure đúng cách), được revoke khi effect cleanup. Flag `isMounted` ngăn state update sau unmount.

### 3.3 Backend endpoint `/content` — Vẫn còn vấn đề khác

Xem [resumes.py L208-256](file:///d:/ai-job-portal/backend/app/routers/resumes.py#L208-L256):

> [!WARNING]
> **Endpoint trả về `application/pdf` (L254)** — KHÔNG dùng `application/octet-stream`. Grep toàn bộ codebase xác nhận **KHÔNG có nơi nào sử dụng `application/octet-stream`**.
>
> Header hiện tại: `Content-Disposition: inline; filename=CV_{resume_id}.pdf`

**Vấn đề tồn đọng khác của endpoint `/content` (không liên quan IDM):**

1. **Fallback logic nguy hiểm (L241-245):** Nếu file thật không tìm thấy, endpoint tìm BẤT KỲ file PDF nào trong thư mục `uploads/` và trả về — có nghĩa là có thể trả về **CV của người khác**.
   ```python
   existing_pdfs = glob.glob("uploads/**/*.pdf", recursive=True)
   if existing_pdfs:
       resolved_path = existing_pdfs[0]
   ```
2. **Demo fallback (L231-232):** Candidate paths bao gồm `"uploads/demo_cv.pdf"` và `"uploads/resumes/demo_cv.pdf"` — nếu file thật mất, sẽ trả về demo thay vì báo lỗi.

### 3.4 Cơ chế xử lý IDM (Internet Download Manager)

> [!IMPORTANT]
> **Không tồn tại cơ chế xử lý IDM nào trong codebase hiện tại.** Grep toàn bộ project cho `octet-stream` trả về **0 kết quả**. Backend luôn trả `application/pdf`.
>
> Frontend chỉ có một message text nhắc đến IDM ở fallback error state (L122):
> ```tsx
> <p>Không thể tải PDF. Trình duyệt có thể đang bị phần mềm IDM chặn.</p>
> ```
> Đây chỉ là **text hướng dẫn user**, không phải cơ chế kỹ thuật nào. Không có test tự động nào liên quan IDM.

---

## 4. CHỨC NĂNG TẢI CV VỀ MÁY (DOWNLOAD)

### Kết luận: CHƯA TỒN TẠI

Sau khi kiểm tra toàn diện:

| Kiểm tra | Kết quả |
|----------|---------|
| Grep `download` trong tất cả backend routers | **0 kết quả** |
| Grep `attachment` trong toàn bộ backend | **0 kết quả** (không có `Content-Disposition: attachment`) |
| Grep `octet-stream` toàn bộ project | **0 kết quả** |
| Endpoint `/resumes/{id}/content` | Chỉ có `inline` (preview), không có `attachment` (download) |
| Frontend CVCard actions | Chỉ có 3 nút: **Xem CV** (preview), **AI Review**, **Xóa CV**. Không có nút Download. |
| CVPreviewModal | Có link "Tải xuống trực tiếp" nhưng **chỉ xuất hiện khi error** (L123-126), và nó mở blob URL — không phải download endpoint thật. |

> [!CAUTION]
> **Đây là tính năng hoàn toàn mới, cần xây từ đầu.** Hiện tại:
> - **Backend:** Không có endpoint nào trả file với `Content-Disposition: attachment`.
> - **Frontend:** Không có nút/UI download CV ở bất kỳ đâu (CandidateDashboard, CVCard, CVPreviewModal).
> - Endpoint `/content` hiện có chỉ serve `inline` (cho iframe preview), không trigger browser download.

---

## Tóm Tắt Nhanh

| # | Điểm | Hiện trạng |
|---|------|-----------|
| 1 | Validate CV upload | ✅ Có validation 2 tầng (heuristic + LLM), nhưng ⚠️ file lưu disk **trước** validation → orphan files khi reject |
| 2 | AI Match với CV rác | ❌ Không có check nào — vẫn tính % bình thường. Endpoint `POST /resumes` bypass hoàn toàn validation |
| 3a | Preview — lỗi JWT 401 | ✅ Đã sửa (dùng blob URL) |
| 3b | Preview — blob URL leak | ✅ Đã sửa (cleanup đúng) |
| 3c | Preview — IDM handling | ⚠️ Không có cơ chế kỹ thuật nào, chỉ có text hướng dẫn |
| 3d | Preview — fallback nguy hiểm | ❌ Có thể trả CV người khác khi file gốc mất |
| 4 | Download CV | ❌ Chưa tồn tại — cần xây mới hoàn toàn |

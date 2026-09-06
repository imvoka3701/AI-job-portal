# Implementation Plan — AI Matching Thông Minh Theo Ngành Nghề

> **Mục tiêu:** Xây dựng hệ thống AI matching chủ động — parse CV ra ngành nghề/kỹ năng → tự động gợi ý jobs phù hợp nhất cho ứng viên.
>
> **Nguyên tắc:** Chia 4 phases, mỗi phase độc lập deploy được, phase sau xây trên phase trước.

---

## User Review Required

> [!IMPORTANT]
> **Phase 1 sẽ thay đổi luồng upload hiện tại** — di chuyển `save_file_upload()` xuống sau validation để tránh orphan files. Cần xác nhận không có service nào khác phụ thuộc vào thứ tự cũ.

> [!WARNING]
> **Phase 2 sử dụng LLM API call bổ sung** mỗi lần upload CV (parse industry/skills). Tăng latency ~1-2s và API cost. Có thể chuyển sang async queue sau nếu cần.

## Open Questions

1. **JobCategory mapping:** Bảng `job_categories` hiện có bao nhiêu category? CV parser cần map vào đúng category_id hiện có hay tạo taxonomy mới?
2. **Số lượng gợi ý:** Endpoint recommend-jobs nên trả **Top bao nhiêu** jobs? (Đề xuất: 10-20)
3. **Minimum match score:** Có nên set ngưỡng tối thiểu (ví dụ: chỉ hiển thị job ≥ 40% match) hay hiển thị tất cả?

---

## Phase 1 — Foundation: Validation Gate & Upload Hardening

**Mục tiêu:** Sửa các lỗ hổng từ audit — validate trước khi lưu file, thêm `is_validated` flag, sửa fallback nguy hiểm, thêm download endpoint.

### Backend

---

#### [MODIFY] [resume.py (model)](file:///d:/ai-job-portal/backend/app/models/resume.py)
- Thêm field `is_validated: Mapped[bool]` (default `False`) — đánh dấu CV đã qua validation pipeline
- Thêm field `validated_at: Mapped[datetime | None]` — timestamp khi validated

#### [MODIFY] [resumes.py (router)](file:///d:/ai-job-portal/backend/app/routers/resumes.py)
- **Upload flow:** Di chuyển `save_file_upload()` (bước 2) xuống **sau** bước 4.5 (validate_is_cv) — chỉ lưu file khi CV hợp lệ
- **Upload flow:** Set `is_validated=True, validated_at=now()` khi tạo resume record
- **POST /resumes (create_resume):** Thêm validation check — nếu có `raw_text` thì BẮT BUỘC chạy `validate_is_cv()` trước khi accept
- **GET /{resume_id}/content:** Xóa fallback logic nguy hiểm (glob tìm random PDF, demo_cv fallback) — trả 404 rõ ràng nếu file không tồn tại
- **[NEW] GET /{resume_id}/download:** Endpoint tải CV về máy với `Content-Disposition: attachment`

#### [MODIFY] [ai.py (router)](file:///d:/ai-job-portal/backend/app/routers/ai.py)
- Endpoint `/ai/match`: Thêm check `if not resume.is_validated: raise 422` trước khi cho phép matching
- Endpoint `/ai/evaluate`: Tương tự check `is_validated`

#### [MODIFY] [resume.py (schema)](file:///d:/ai-job-portal/backend/app/schemas/resume.py)
- Thêm `is_validated: bool` và `validated_at: datetime | None` vào `ResumeRead`

### Frontend

---

#### [MODIFY] [CVCard.tsx](file:///d:/ai-job-portal/frontend/src/pages/candidate/components/CVCard.tsx)
- Thêm nút **"Tải CV"** (Download icon) bên cạnh "Xem CV" và "AI Review"

#### [MODIFY] [CVPreviewModal.tsx](file:///d:/ai-job-portal/frontend/src/pages/candidate/components/CVPreviewModal.tsx)
- Thêm nút **"Tải về máy"** trong header toolbar (dùng blob URL đã fetch + `<a download>`)

---

## Phase 2 — CV Intelligence: Industry Parser Service

**Mục tiêu:** Khi upload CV, AI tự động parse ra: ngành nghề, vị trí mong muốn, kỹ năng chính, mức kinh nghiệm → lưu structured data vào Resume model.

### Backend

---

#### [MODIFY] [resume.py (model)](file:///d:/ai-job-portal/backend/app/models/resume.py)
- Thêm các field structured metadata:
  ```python
  parsed_industry: Mapped[str | None]       # "IT", "Kế toán", "Marketing"...
  desired_role: Mapped[str | None]           # "Senior Frontend Engineer"
  desired_location: Mapped[str | None]       # "Hà Nội", "Remote"
  parsed_experience_level: Mapped[str | None]  # "senior", "middle", "fresher"
  parsed_key_skills: Mapped[str | None]      # JSON array: ["React", "TypeScript", "Node.js"]
  industry_category_id: Mapped[int | None]   # FK → job_categories.id (mapped)
  ```

#### [NEW] [cv_parser.py](file:///d:/ai-job-portal/backend/app/services/cv_parser.py)
- Service mới: `CVParserService`
- Method `parse_cv_metadata(raw_text: str) -> CVMetadata`
  - Gửi raw_text (2500 ký tự đầu) cho LLM với prompt yêu cầu extract:
    - `industry`: ngành nghề chính (IT, Tài chính, Marketing, Y tế, Xây dựng, Giáo dục...)
    - `desired_role`: vị trí ứng viên đang nhắm tới (parse từ "Mục tiêu nghề nghiệp" hoặc infer từ kinh nghiệm gần nhất)
    - `key_skills`: list kỹ năng chính (top 10)
    - `experience_level`: fresher/junior/middle/senior/lead (infer từ số năm + complexity)
    - `desired_location`: địa điểm mong muốn (nếu có trong CV)
  - Return structured Pydantic model `CVMetadata`
  - **Fallback:** Nếu LLM fail, dùng heuristic keyword matching (tương tự cv_evaluator tier 1) để infer industry cơ bản

#### [NEW] [cv_parser.py (schema)](file:///d:/ai-job-portal/backend/app/schemas/cv_parser.py)
- Pydantic model `CVMetadata`:
  ```python
  class CVMetadata(BaseModel):
      industry: str
      desired_role: str | None
      key_skills: list[str]
      experience_level: str  # "fresher" | "junior" | "middle" | "senior" | "lead"
      desired_location: str | None
  ```

#### [MODIFY] [resumes.py (router)](file:///d:/ai-job-portal/backend/app/routers/resumes.py)
- Trong `upload_resume()`, sau bước 4.5 (validate), thêm **bước 4.6: Parse CV metadata**:
  ```python
  # ── 4.6. Parse CV metadata (industry, skills, level) ───────
  metadata = await cv_parser_service.parse_cv_metadata(raw_text)
  ```
- Lưu metadata fields vào `ResumeCreate` trước khi tạo DB record

#### [MODIFY] [resume.py (schema)](file:///d:/ai-job-portal/backend/app/schemas/resume.py)
- Thêm các field metadata vào `ResumeCreate` và `ResumeRead`

### Alembic Migration

---

#### [NEW] Migration file
- `ALTER TABLE resumes ADD COLUMN parsed_industry VARCHAR(100)...`
- Add index trên `parsed_industry` và `parsed_experience_level` cho filtering nhanh

---

## Phase 3 — Smart Matching: Industry-Aware Job Recommendation

**Mục tiêu:** Endpoint mới `GET /ai/recommend-jobs` — dùng CV metadata + embedding để tìm top N jobs phù hợp nhất, ưu tiên đúng ngành nghề.

### Backend

---

#### [MODIFY] [ai_matching.py](file:///d:/ai-job-portal/backend/app/services/ai_matching.py)
- **Tái sử dụng + mở rộng `find_top_matches()`** (hiện đang là dead code):
  - Thêm tham số filtering: `industry`, `experience_level`, `location`, `category_id`
  - SQL query mới: filter jobs theo industry/category **trước**, rồi rank bằng pgvector cosine similarity
  - Query pattern:
    ```sql
    SELECT j.id, j.title, j.company_id, j.location, j.experience_level,
           1 - (j.embedding <=> :cv_embedding::vector) AS similarity
    FROM jobs j
    WHERE j.is_active = true
      AND j.embedding IS NOT NULL
      AND (:category_id IS NULL OR j.category_id = :category_id)
      AND (:exp_level IS NULL OR j.experience_level = :exp_level)
    ORDER BY j.embedding <=> :cv_embedding::vector
    LIMIT :limit
    ```
- **New method: `recommend_jobs_for_resume()`** — orchestrate:
  1. Load resume + metadata
  2. Pre-filter jobs bằng industry/category
  3. pgvector HNSW similarity search trong filtered set
  4. Return ranked list với score + job details

#### [NEW] Endpoint trong [ai.py (router)](file:///d:/ai-job-portal/backend/app/routers/ai.py)
```python
@router.get("/recommend-jobs", response_model=JobRecommendationResponse)
async def recommend_jobs_for_candidate(
    resume_id: int = Query(...),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> JobRecommendationResponse:
```
- Validate: resume thuộc user, resume.is_validated == True, resume.embedding exists
- Gọi `ai_matching_service.recommend_jobs_for_resume()`
- Return: danh sách jobs ranked với match score + explanation ngắn

#### [NEW] Schema trong [ai.py (schema)](file:///d:/ai-job-portal/backend/app/schemas/ai.py)
```python
class RecommendedJob(BaseModel):
    job_id: int
    title: str
    company_name: str | None
    location: str | None
    experience_level: str
    match_score: float  # 0-100
    match_reason: str   # "Phù hợp ngành IT, kỹ năng React/TypeScript trùng khớp 85%"

class JobRecommendationResponse(BaseModel):
    resume_id: int
    industry_detected: str
    total_matched: int
    recommendations: list[RecommendedJob]
```

---

## Phase 4 — Frontend: "Việc Làm AI Gợi Ý Cho Bạn"

**Mục tiêu:** Hiển thị danh sách ranked jobs trên CandidateDashboard và JobListPage.

### Frontend

---

#### [NEW] [RecommendedJobs.tsx](file:///d:/ai-job-portal/frontend/src/pages/candidate/components/RecommendedJobs.tsx)
- Smart component: gọi `GET /ai/recommend-jobs?resume_id=X&limit=10`
- Hiển thị danh sách job cards với:
  - Match score badge (màu gradient theo mức: 80%+ emerald, 60-80% amber, <60% slate)
  - Job title, company, location, salary range
  - Tag "AI Matched" ✨
  - CTA: "Xem chi tiết" → navigate to JobDetailPage
- States: Loading skeleton, Empty ("Upload CV để nhận gợi ý"), Error
- Framer Motion: Staggered fade-in cho cards

#### [MODIFY] [CandidateDashboard.tsx](file:///d:/ai-job-portal/frontend/src/pages/candidate/CandidateDashboard.tsx)
- Thêm section **"🎯 Việc Làm AI Gợi Ý Cho Bạn"** sau section CV upload
- Chỉ hiển thị khi user đã có ≥ 1 resume validated
- Link "Xem tất cả" → navigate to JobListPage với AI sort

#### [MODIFY] [JobListPage.tsx](file:///d:/ai-job-portal/frontend/src/pages/jobs/JobListPage.tsx)
- Thêm filter/sort option: "Sắp xếp theo AI Match Score"
- Nếu user đã đăng nhập + có CV, hiển thị match score badge trên mỗi job card
- Thêm banner section "Gợi ý cho bạn" ở đầu trang (collapsible)

#### [NEW] API function trong [ai.ts](file:///d:/ai-job-portal/frontend/src/lib/api/ai.ts)
```typescript
export async function getRecommendedJobs(
  resumeId: number,
  limit: number = 20,
): Promise<JobRecommendationResponse> {
  const { data } = await apiClient.get<JobRecommendationResponse>(
    `/ai/recommend-jobs`,
    { params: { resume_id: resumeId, limit } },
  );
  return data;
}
```

#### [NEW] Type definition trong [api.ts (types)](file:///d:/ai-job-portal/frontend/src/types/api.ts)
- `RecommendedJob` và `JobRecommendationResponse` interfaces

---

## Verification Plan

### Phase 1
- ✅ Upload file rác (hóa đơn PDF) → phải reject 422 VÀ file KHÔNG được lưu trên disk
- ✅ Upload CV hợp lệ → `is_validated=true` trong response
- ✅ `POST /ai/match` với resume chưa validated → phải reject 422
- ✅ `GET /resumes/{id}/content` khi file mất → trả 404 (KHÔNG trả file random)
- ✅ `GET /resumes/{id}/download` → browser trigger download file

### Phase 2
- ✅ Upload CV IT → `parsed_industry="IT"`, `parsed_key_skills=["React","TypeScript",...]`
- ✅ Upload CV Kế toán → `parsed_industry="Kế toán/Tài chính"`, skills khác hoàn toàn
- ✅ LLM fail → fallback heuristic vẫn parse được industry cơ bản

### Phase 3
- ✅ `GET /ai/recommend-jobs?resume_id=X` → trả danh sách jobs đúng ngành
- ✅ CV IT → jobs IT ranked cao, jobs Kế toán không xuất hiện hoặc ranked rất thấp
- ✅ Performance: response < 500ms cho top 20 (HNSW index phải đủ nhanh)

### Phase 4
- ✅ CandidateDashboard hiển thị "Việc làm gợi ý" khi có CV validated
- ✅ Không hiển thị section khi chưa upload CV
- ✅ Click job card → navigate đúng tới JobDetailPage
- ✅ Mobile responsive

# Task List — AI Matching Thông Minh

## Phase 1 — Foundation: Validation Gate & Upload Hardening
- [ ] Resume model: thêm `is_validated`, `validated_at`
- [ ] Resume schema: thêm fields mới vào ResumeRead
- [ ] resumes.py router: sửa upload flow (validate trước save)
- [ ] resumes.py router: thêm validation cho POST /resumes
- [ ] resumes.py router: xóa fallback nguy hiểm trong GET /content
- [ ] resumes.py router: thêm GET /{resume_id}/download endpoint
- [ ] ai.py router: thêm is_validated check cho /match và /evaluate
- [ ] Frontend CVCard: thêm nút Download
- [ ] Frontend CVPreviewModal: thêm nút Download

## Phase 2 — CV Intelligence: Industry Parser Service
- [ ] Resume model: thêm metadata fields (industry, desired_role, etc.)
- [ ] Schema: CVMetadata Pydantic model
- [ ] Service: CVParserService (LLM + heuristic fallback)
- [ ] Router: tích hợp parser vào upload flow
- [ ] Alembic migration

## Phase 3 — Smart Matching: Industry-Aware Job Recommendation
- [ ] Mở rộng find_top_matches() với industry filtering
- [ ] Method recommend_jobs_for_resume()
- [ ] Schema: RecommendedJob, JobRecommendationResponse
- [ ] Endpoint: GET /ai/recommend-jobs
- [ ] Verification: đúng ngành, performance < 500ms

## Phase 4 — Frontend: "Việc Làm AI Gợi Ý Cho Bạn"
- [ ] Component: RecommendedJobs.tsx
- [ ] API function: getRecommendedJobs()
- [ ] Type definitions
- [ ] CandidateDashboard: thêm section gợi ý
- [ ] JobListPage: thêm AI sort option

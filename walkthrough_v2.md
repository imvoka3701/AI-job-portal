# BÁO CÁO AUDIT TOÀN DIỆN HỆ THỐNG FULLSTACK (AUDIT-ONLY REPORT)

> **Trạng thái:** HOÀN TẤT AUDIT - CHỜ DUYỆT (Chỉ đọc, rà soát có hệ thống, tuyệt đối KHÔNG sửa code).  
> **Thời điểm thực hiện:** 06/09/2026.  
> **Phạm vi kiểm tra:** Toàn bộ source code Frontend (`frontend/src/`), Backend (`backend/app/`), Database Models và API Routers.

---

## MỤC LỤC

1. [PHẦN 1: Số liệu & Giá trị Hardcode Giả lập trên Frontend](#phần-1--số-liệu--giá-trị-hardcode-giả-lập-trên-frontend)
2. [PHẦN 2: Code "Mồ Côi" (Tồn tại nhưng không ai gọi tới) & Cột DB Rỗng](#phần-2--code-mồ-côi-tồn-tại-nhưng-không-ai-gọi-tới--cột-db-rỗng)
3. [PHẦN 3: Lỗi Tham Số Bị Bỏ Qua & Bỏ Quên Nhánh Nghiệp Vụ](#phần-3--lỗi-tham-số-bị-bỏ-qua--bỏ-quên-nhánh-nghiệp-vụ)
4. [PHẦN 4: Exception Bị Nuốt Âm Thầm (Silent Exception Swallowing)](#phần-4--exception-bị-nuốt-âm-thầm-silent-exception-swallowing)
5. [PHẦN 5: Đối Chiếu UI Label / Badge Khẳng Định với Dữ Liệu Thật](#phần-5--đối-chiếu-ui-label--badge-khẳng-định-với-dữ-liệu-thật)
6. [PHẦN 6: Lỗ Hổng Bảo Mật & Rò Rỉ Dữ Liệu PII (Security & Privacy Audit)](#phần-6--lỗ-hổng-bảo-mật--rò-rỉ-dữ-liệu-pii-security--privacy-audit)
7. [BẢNG TỔNG HỢP SỐ LƯỢNG THEO MỨC ĐỘ](#bảng-tổng-hợp-số-lượng-theo-mức-độ)
8. [DANH SÁCH PHẦN NÀO CHƯA KỊP RÀ HẾT (GHI CHÚ MINH BẠCH)](#danh-sách-phần-nào-chưa-kịp-rà-hết-ghi-chú-minh-bạch)

---

## PHẦN 1 — Số liệu & Giá trị Hardcode Giả lập trên Frontend

### Phát hiện 1.1: Trình tạo AI Cover Letter dùng setTimeout giả lập không gọi Backend
- **Vị trí:** `frontend/src/pages/jobs/JobDetailPage.tsx:230-254`
- **Loại:** Hardcode giả
- **Mức độ:** **Nghiêm trọng** — Tính năng AI chủ đạo của nền tảng nhưng hoàn toàn là "vỏ đẹp ruột rỗng", không hề gọi LLM API mà dùng chuỗi văn bản mẫu kết hợp `setTimeout(..., 600)`.
- **Bằng chứng:**
```typescript
// frontend/src/pages/jobs/JobDetailPage.tsx:230-254
const handleGenerateCoverLetter = () => {
  if (!job) return;
  setIsGeneratingCoverLetter(true);
  const companyName = job.employer?.company_name || job.employer?.full_name || "Quý Công ty";
  const candidateName = user?.full_name || "Ứng viên";

  setTimeout(() => {
    const generated = `Kính gửi Bộ phận Tuyển dụng ${companyName},

Tôi tên là ${candidateName}. Tôi viết thư này để bày tỏ sự quan tâm sâu sắc đối với vị trí ${job.title} mà Quý Công ty đang tuyển dụng.
...
Trân trọng,
${candidateName}`;

    setCoverLetterText(generated);
    setIsGeneratingCoverLetter(false);
  }, 600);
};
```

---

### Phát hiện 1.2: Toàn bộ mục AI & Matching trong Cài đặt Nhà tuyển dụng là "Vỏ Không Ruột"
- **Vị trí:** `frontend/src/pages/employer/EmployerSettingsPage.tsx:60-75`, `109-130`, `140-150`
- **Loại:** Hardcode giả / Code không hoạt động thật
- **Mức độ:** **Nghiêm trọng** — UI cung cấp các thanh trượt trọng số AI Matching (`weightSkills`, `weightExp`, `weightEdu`, `weightCulture`), ngưỡng điểm tối thiểu, tạo API Key, test Webhook. Tuy nhiên, hàm `handleSave` chỉ lưu thông tin công ty cơ bản, toàn bộ cài đặt AI/Security/Webhook không được gửi lên API và mất sạch khi refresh trang. Ngoài ra hàm tạo API Key dùng `Math.random()` client-side, nút Test Webhook chỉ chạy `setTimeout`.
- **Bằng chứng:**
```typescript
// frontend/src/pages/employer/EmployerSettingsPage.tsx:140-150
const handleRegenerateApiKey = () => {
  const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  setApiKey(`tc_live_${randomHex}_sec_2026`);
  setSavedSuccess(true);
  setTimeout(() => setSavedSuccess(false), 3000);
};

const handleTestWebhook = () => {
  setWebhookTested(true);
  setTimeout(() => setWebhookTested(false), 3000);
};

// frontend/src/pages/employer/EmployerSettingsPage.tsx:109-125
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  try {
    await updateCompanySettings({
      name: companyName,
      description,
      website,
      address,
      tax_code: taxCode,
      industry,
      company_size: scale,
      contact_person_name: contactName,
      contact_person_email: contactEmail,
      contact_person_phone: contactPhone,
      // HOÀN TOÀN KHÔNG CÓ weightSkills, weightExp, webhookUrl, apiKey...
    });
...
```

---

### Phát hiện 1.3: Tính phễu tuyển dụng Admin bằng tỷ lệ nhân cố định kèm fallback 8 ứng viên
- **Vị trí:** `frontend/src/pages/admin/AdminDashboard.tsx:360-370`
- **Loại:** Hardcode giả / Công thức giả lập
- **Mức độ:** **Nghiêm trọng** — Giao diện gắn nhãn "Pipeline Tuyển Dụng Toàn Hệ Thống" với badge `<Activity /> Live Data`, nhưng dữ liệu qua 4 vòng được tính toán bằng các hệ số nhân cố định: 88%, 50%, 25%, và nếu hệ thống chưa có dữ liệu sẽ tự fallback `total = 8`.
- **Bằng chứng:**
```typescript
// frontend/src/pages/admin/AdminDashboard.tsx:360-370
const total = stats.total_applications || 8;
const s2 = Math.max(1, Math.round(total * 0.88));
const s3 = Math.max(1, Math.round(total * 0.50));
const s4 = Math.max(1, Math.round(total * 0.25));
const fd = [
  { name: "1. Sàng lọc CV", in: total, out: s2, rate: Math.round((s2 / Math.max(1, total)) * 100), g: "from-emerald-400 to-emerald-600", b: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { name: "2. PV Kỹ thuật", in: s2, out: s3, rate: Math.round((s3 / Math.max(1, s2)) * 100), g: "from-blue-400 to-blue-600", b: "bg-blue-50 border-blue-200 text-blue-700" },
  { name: "3. PV Văn hóa & HR", in: s3, out: Math.min(s3, s4 + 1), rate: Math.round((Math.min(s3, s4 + 1) / Math.max(1, s3)) * 100), g: "from-violet-400 to-violet-600", b: "bg-violet-50 border-violet-200 text-violet-700" },
  { name: "4. Offer & Trúng tuyển", in: Math.min(s3, s4 + 1), out: s4, rate: Math.round((s4 / Math.max(1, Math.min(s3, s4 + 1))) * 100), g: "from-amber-400 to-orange-500", b: "bg-amber-50 border-amber-200 text-amber-700" },
];
```

---

### Phát hiện 1.4: Biểu đồ tăng trưởng 30 ngày tự bơm dữ liệu ảo với ngày tháng hardcode (Tháng 8/2026)
- **Vị trí:** `frontend/src/pages/admin/AdminDashboard.tsx:408-412` và `447-451`
- **Loại:** Hardcode giả / Fallback đáng ngờ
- **Mức độ:** **Nghiêm trọng** — Nếu hệ thống có ít hơn 4 điểm dữ liệu (database mới hoặc dữ liệu thực tế ít), dashboard tự động chèn một mảng dữ liệu giả với các mốc ngày tháng cố định "08/04", "08/06", "08/08", "08/10", "08/12", "08/14", "08/16", "08/17" thay vì render trạng thái EmptyState hoặc vẽ biểu đồ trống.
- **Bằng chứng:**
```typescript
// frontend/src/pages/admin/AdminDashboard.tsx:408-412
const raw = stats.new_users_last_30d ?? [];
const data = raw.length >= 4
  ? raw.map((d: { date: string; count: number }) => ({ date: d.date.split("-").slice(1).join("/"), count: Number(d.count) }))
  : [{ date: "08/04", count: 1 }, { date: "08/06", count: 2 }, { date: "08/08", count: 2 }, { date: "08/10", count: 3 }, { date: "08/12", count: 2 }, { date: "08/14", count: 4 }, { date: "08/16", count: 3 }, { date: "08/17", count: raw[0]?.count ?? 4 }];

// frontend/src/pages/admin/AdminDashboard.tsx:447-451
const raw = stats.new_applications_last_30d ?? [];
const data = raw.length >= 4
  ? raw.map((d: { date: string; count: number }) => ({ date: d.date.split("-").slice(1).join("/"), count: Number(d.count) }))
  : [{ date: "08/04", count: 1 }, { date: "08/06", count: 2 }, { date: "08/08", count: 1 }, { date: "08/10", count: 3 }, { date: "08/12", count: 2 }, { date: "08/14", count: 3 }, { date: "08/16", count: 2 }, { date: "08/17", count: raw[0]?.count ?? 2 }];
```

---

### Phát hiện 1.5: Fallback số lượng ứng viên bằng 8 và điểm kỹ năng mặc định bằng 7.5/10
- **Vị trí:** `frontend/src/pages/employer/EmployerCandidatesPage.tsx:446` và `652`
- **Loại:** Fallback đáng ngờ / Hardcode giả
- **Mức độ:** **Nghiêm trọng** — Dòng 446 hiển thị tổng ứng viên trong phễu, nếu rỗng sẽ hiển thị số `8`. Dòng 652 trong modal chi tiết ứng viên tự gán điểm `7.5/10` cho kỹ năng nếu giá trị là 0 hoặc không parse được số.
- **Bằng chứng:**
```typescript
// frontend/src/pages/employer/EmployerCandidatesPage.tsx:446
<strong>{applications.length || (stats?.total_applications ?? 8)}</strong> ứng viên trong phễu

// frontend/src/pages/employer/EmployerCandidatesPage.tsx:652
const numScore = typeof value === "number" ? value : Number(value) || 7.5;
```

---

### Phát hiện 1.6: Phễu tuyển dụng, xu hướng và Sparkline giả lập trong EmployerStatsWidget
- **Vị trí:** `frontend/src/pages/employer/components/EmployerStatsWidget.tsx:68-73`, `79-122`, `242`
- **Loại:** Hardcode giả
- **Mức độ:** **Nghiêm trọng** — Nếu `stats.funnel` rỗng, widget hiển thị dữ liệu giả lập (Duyệt CV: 12, Phỏng vấn: 6, Đánh giá: 3, Offer: 2). Đồng thời 4 thẻ thống kê chứa các chuỗi trend và mảng số sparkline cố định không tính từ database.
- **Bằng chứng:**
```typescript
// frontend/src/pages/employer/components/EmployerStatsWidget.tsx:68-73
const activeFunnelData = (stats.funnel && stats.funnel.length > 0)
  ? stats.funnel.map(f => ({ name: f.round_name, passed: f.passed, pass_rate: f.pass_rate }))
  : [
      { name: "Duyệt CV", passed: 12, pass_rate: 100 },
      { name: "Phỏng vấn", passed: 6, pass_rate: 50 },
      { name: "Đánh giá", passed: 3, pass_rate: 25 },
      { name: "Offer", passed: 2, pass_rate: 16.7 },
    ];

// Dòng 79, 85, 91, 97, 103, 109, 115, 121:
trend: "+2 tin mới", sparkline: [12, 14, 13, 16, 18, 20, 24]
trend: "+24.5% tháng này", sparkline: [30, 40, 35, 50, 49, 60, 75]
trend: "Top 15% ngành", sparkline: [70, 72, 75, 74, 79, 81, 83]
trend: "-3 ngày so với TB", sparkline: [20, 19, 18, 17, 15, 14, 14]
```

---

### Phát hiện 1.7: Mock Tech Stacks & Câu hỏi phỏng vấn hiển thị giống nhau cho mọi tin tuyển dụng
- **Vị trí:** `frontend/src/pages/jobs/JobDetailPage.tsx:371-396`
- **Loại:** Hardcode giả
- **Mức độ:** **Trung bình** — Statically khai báo `techStackList` (React, FastAPI, Docker, AWS...) và `interviewQuestionsList` (3 câu hỏi chuyên môn IT) rồi render trên mọi tin tuyển dụng, kể cả khi tin đó thuộc ngành Marketing, Sales, Kế toán...
- **Bằng chứng:**
```typescript
// frontend/src/pages/jobs/JobDetailPage.tsx:371-396
const techStackList = [
  "TypeScript", "React 19 / Next.js", "FastAPI / Python",
  "PostgreSQL (pgvector)", "Docker & CI/CD", "AWS Cloud", "Tailwind CSS",
];

const interviewQuestionsList = [
  {
    question: `Bạn tối ưu hiệu năng và xử lý dữ liệu lớn trong các ứng dụng ${job.title} như thế nào?`,
    hint: "Tập trung giải thích về Virtual DOM, Caching (Redis), Query Indexing và quy trình Profiling bằng DevTools.",
  },
  ...
];
```

---

### Phát hiện 1.8: Tỷ lệ hoàn thiện hồ sơ cố định 75% trên thanh Sidebar
- **Vị trí:** `frontend/src/pages/jobs/components/FilterSidebar.tsx:327, 330`
- **Loại:** Hardcode giả
- **Mức độ:** **Nhẹ** — Cố định text `75%` và class `w-[75%]` thay vì tính toán theo tỷ lệ hoàn thiện thực tế của profile ứng viên đang đăng nhập.
- **Bằng chứng:**
```tsx
// frontend/src/pages/jobs/components/FilterSidebar.tsx:324-332
<div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1">
  <span>Hoàn thiện hồ sơ</span>
  <span className="text-[#00B86B]">75%</span>
</div>
<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
  <div className="h-full bg-[#00B86B] rounded-full w-[75%]" />
</div>
```

---

### Phát hiện 1.9: Thang đo mức lương thị trường hardcode tỷ lệ 88% / 72%
- **Vị trí:** `frontend/src/pages/jobs/JobDetailPage.tsx:367-370, 745-758`
- **Loại:** Hardcode giả
- **Mức độ:** **Trung bình** — Dựa vào `expLevel` để gán cứng mốc lương 32M, 55M, 85M; thanh tiến trình UI được gán cứng `width: 88%` hoặc `72%` kèm các mốc cố định "15M", "80M+".
- **Bằng chứng:**
```tsx
// frontend/src/pages/jobs/JobDetailPage.tsx:747-757
<div
  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[#00B86B] to-teal-600 transition-all duration-1000 shadow-xs"
  style={{ width: isHighSalary ? "88%" : "72%" }}
/>
...
<div className="flex justify-between text-[11px] text-slate-400 font-semibold">
  <span>Khởi điểm: 15M</span>
  <span>Trung vị: {medianSalary}M</span>
  <span>Cao cấp: 80M+</span>
</div>
```

---

### Phát hiện 1.10: State setter lưu lỗi API bị vứt bỏ (Discarded Error State)
- **Vị trí:** `frontend/src/pages/ai/AIMatchingPage.tsx:134, 201`
- **Loại:** State bị vứt bỏ / Lỗi bị che giấu
- **Mức độ:** **Trung bình** — Khai báo `const [, setJobsError] = useState<string | null>(null);` bỏ qua biến state lưu lỗi. Khi API `getJobs` thất bại ở dòng 201, `setJobsError` được gọi nhưng biến state không tồn tại trong component, khiến người dùng không hề thấy bất kỳ thông báo lỗi nào trên giao diện khi việc tải danh sách tin thất bại.
- **Bằng chứng:**
```typescript
// frontend/src/pages/ai/AIMatchingPage.tsx:134
const [, setJobsError] = useState<string | null>(null);

// frontend/src/pages/ai/AIMatchingPage.tsx:200-202
} catch (err) {
  setJobsError(getApiErrorMessage(err));
}
```

---

## PHẦN 2 — Code "Mồ Côi" (Tồn tại nhưng không ai gọi tới) & Cột DB Rỗng

### Phát hiện 2.1: File Service Backend bị bỏ dở giữa chừng và không được import ở đâu
- **Vị trí:** `backend/app/services/assessment_scorer.py:1-29`
- **Loại:** Code mồ côi
- **Mức độ:** **Trung bình** — File chỉ có 29 dòng code, dừng đột ngột ở giữa hàm `get_mbti_v1_questionnaire()` mà không có `return` hay đóng hàm. File này không được import ở bất kỳ router, model hay service nào trong toàn bộ backend (hệ thống thực tế sử dụng `assessment_engine.py`).
- **Bằng chứng:**
```python
# backend/app/services/assessment_scorer.py:1-29
"""Deterministic scoring engine for MBTI and MI assessments."""

from app.schemas.assessment import (
    AssessmentQuestionnaire,
)

def get_mbti_v1_questionnaire() -> AssessmentQuestionnaire:
    """Return MBTI v1 questionnaire (40 questions)."""
    questions = []

    # E/I dimension (Extraversion vs Introversion)
    ei_questions = [
        "Trong các buổi gặp mặt, bạn thường chủ động bắt chuyện với nhiều người mới.",
        ...
        "Bạn thích làm việc trong môi trường sôi động và năng động.",
    ]
    # (FILE KẾT THÚC ĐỘT NGỘT TẠI ĐÂY, KHÔNG RETURN, KHÔNG DÙNG)
```

---

### Phát hiện 2.2: Sáu Component Frontend hoàn chỉnh nhưng không được render trong Route nào
- **Vị trí:**
  1. `frontend/src/pages/jobs/components/JobResults/AIRecommendedJobs.tsx`
  2. `frontend/src/pages/jobs/components/JobResults/FeaturedJobs.tsx`
  3. `frontend/src/pages/employer/landing/AboutUsSection.tsx`
  4. `frontend/src/pages/employer/landing/FeaturesSection.tsx`
  5. `frontend/src/pages/employer/landing/PartnersSection.tsx`
  6. `frontend/src/pages/employer/landing/ValuesSection.tsx`
- **Loại:** Code mồ côi
- **Mức độ:** **Nhẹ** — Các component UI được viết đầy đủ, không có lỗi cú pháp nhưng bị bỏ quên (không có bất kỳ file nào khác trong `frontend/src` import chúng). Ngoài ra còn có `ApplyButton` trong `JobUIHelpers.tsx` cũng không được gọi ở bất cứ đâu.
- **Bằng chứng:**
  - Kết quả kiểm tra bằng ripgrep xác nhận số lượng file import của cả 6 component trên đều là **0**.

---

### Phát hiện 2.3: Cột `Application.ai_feedback` tồn tại trong Database Model nhưng không bao giờ được ghi
- **Vị trí:** `backend/app/models/application.py:36`, `backend/app/schemas/application.py:38, 54`, `backend/app/routers/applications.py:393`
- **Loại:** Cột DB rỗng (Write-never column)
- **Mức độ:** **Trung bình** — Cột `ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)` được khai báo trong DB model và Pydantic schema, nhưng trong toàn bộ backend không có bất kỳ lệnh SQL hoặc gán thuộc tính nào (`application.ai_feedback = ...`) thực sự ghi giá trị vào cột này. Cột này sẽ **LUÔN LUÔN LÀ NULL** trên môi trường thực tế.
- **Bằng chứng:**
  - Kết quả ripgrep toàn bộ `backend/app` chỉ thấy khai báo schema và 1 chỗ đọc `ai_feedback=app.ai_feedback` tại `routers/applications.py:393`. Không có bất kỳ dòng nào ghi dữ liệu.

---

## PHẦN 3 — Lỗi Tham Số Bị Bỏ Qua & Bỏ Quên Nhánh Nghiệp Vụ

### Phát hiện 3.1: Lưu trạng thái request trên Singleton Service gây nguy cơ Race Condition
- **Vị trí:** `backend/app/services/cv_evaluator.py:159` và `backend/app/routers/resumes.py:83, 181`
- **Loại:** Tham số / State bị xử lý sai kiến trúc
- **Mức độ:** **Nghiêm trọng** — Hàm `validate_is_cv` lưu lý do từ chối vào thuộc tính của instance singleton `self._last_reject_reason = reason`, sau đó ở router lại đọc bằng `getattr(cv_evaluator_service, "_last_reject_reason", "")`. Khi có nhiều request upload CV diễn ra đồng thời (concurrent async requests), lý do từ chối của user này có thể ghi đè lên user khác, dẫn tới trả về thông báo lỗi sai lệch.
- **Bằng chứng:**
```python
# backend/app/services/cv_evaluator.py:158-160
async def validate_is_cv(self, resume_text: str) -> bool:
    is_valid, reason = await self.validate_cv_structure(resume_text)
    self._last_reject_reason = reason  # <-- Ghi đè trên singleton
    return is_valid

# backend/app/routers/resumes.py:83
reject_reason = getattr(cv_evaluator_service, "_last_reject_reason", "")
```

---

### Phát hiện 3.2: Bỏ qua hoàn toàn hồ sơ CV Builder khi tính toán AI Matching trên JobDetailPage
- **Vị trí:** `frontend/src/pages/jobs/JobDetailPage.tsx:205-214`
- **Loại:** Bỏ quên nhánh nghiệp vụ
- **Mức độ:** **Nghiêm trọng** — Giao diện cho phép ứng viên chọn CV dạng Upload file (`resume:123`) hoặc CV tạo từ CV Builder (`builder:456`). Tuy nhiên, `useEffect` kích hoạt AI Matching lại chỉ kiểm tra `selectedDocument.startsWith("resume:")`. Nếu ứng viên chọn hồ sơ CV Builder, code lập tức `return` và set kết quả matching về `null`, vô hiệu hóa tính năng AI matching đối với người dùng CV Builder.
- **Bằng chứng:**
```typescript
// frontend/src/pages/jobs/JobDetailPage.tsx:204-214
const computeMatching = async () => {
  let resumeId: number | null = null;
  if (selectedDocument.startsWith("resume:")) {
    resumeId = Number(selectedDocument.split(":")[1]);
  }

  if (!resumeId) {
    setAiMatchResult(null);
    setIsMatchingLoading(false);
    return; // <-- Dừng lại ngay lập tức nếu là builder CV!
  }
  ...
```

---

### Phát hiện 3.3: Tooltip giải thích điểm AI Match bỏ qua tham số điểm số và dữ liệu thật
- **Vị trí:** `frontend/src/pages/jobs/components/JobResults/JobUIHelpers.tsx:75-88`
- **Loại:** Tham số bị bỏ qua / Hardcode giả
- **Mức độ:** **Trung bình** — Component `AIMatchBadge({ score })` nhận điểm số làm prop. Tuy nhiên khi người dùng nhấp vào badge để xem popover "AI Match Explanation", các tiêu chí đánh giá bên trong luôn hiển thị cố định "✓ Kỹ năng chính: Khớp tốt", "✓ Kinh nghiệm: Đạt yêu cầu", "△ Địa điểm / Loại hình: Phù hợp", bất kể điểm số nhận vào là 95% hay 20%.
- **Bằng chứng:**
```tsx
// frontend/src/pages/jobs/components/JobResults/JobUIHelpers.tsx:75-88
<div className="space-y-1.5 mb-3">
  <div className="flex items-center justify-between text-emerald-700">
    <span>✓ Kỹ năng chính</span>
    <span className="font-semibold">Khớp tốt</span>
  </div>
  <div className="flex items-center justify-between text-emerald-700">
    <span>✓ Kinh nghiệm</span>
    <span className="font-semibold">Đạt yêu cầu</span>
  </div>
  <div className="flex items-center justify-between text-amber-600">
    <span>△ Địa điểm / Loại hình</span>
    <span className="font-semibold">Phù hợp</span>
  </div>
</div>
```

---

## PHẦN 4 — Exception Bị Nuốt Âm Thầm (Silent Exception Swallowing)

### Phát hiện 4.1: Nuốt `ValueError` khi lọc `log_status` trong Admin AI Logs API
- **Vị trí:** `backend/app/routers/admin_ai.py:312-315`
- **Loại:** Exception bị nuốt
- **Mức độ:** **Trung bình** — Khi admin truyền giá trị filter `log_status` không hợp lệ, code bắt `ValueError` và dùng lệnh `pass` mà không log hay raise lỗi 400. Hậu quả là query sẽ âm thầm bỏ qua điều kiện lọc và trả về toàn bộ log mà không có cảnh báo gì.
- **Bằng chứng:**
```python
# backend/app/routers/admin_ai.py:311-315
if log_status:
    try:
        q = q.filter(AICallLog.status == AICallStatus(log_status))
    except ValueError:
        pass
```

---

### Phát hiện 4.2: Nuốt `OSError` khi xoá file CV vật lý trên ổ đĩa
- **Vị trí:** `backend/app/routers/resumes.py:384-387`
- **Loại:** Exception bị nuốt
- **Mức độ:** **Nhẹ** — Khi xoá CV của ứng viên, nếu file trên ổ đĩa không xoá được (ví dụ do phân quyền hệ thống file hoặc file bị lock), exception `OSError` bị nuốt bằng `pass` mà không có log `logger.warning`, khiến rác ổ đĩa tích tụ âm thầm mà quản trị viên không thể phát hiện qua hệ thống log.
- **Bằng chứng:**
```python
# backend/app/routers/resumes.py:384-387
try:
    os.remove(file_candidate)
except OSError:
    pass
```

---

### Phát hiện 4.3: Nuốt lỗi tải danh sách CV của ứng viên trong AIMatchingPage
- **Vị trí:** `frontend/src/pages/ai/AIMatchingPage.tsx:178-180`
- **Loại:** Exception bị nuốt
- **Mức độ:** **Trung bình** — Khi việc tải danh sách CV thất bại, khối catch hoàn toàn trống (`// Ignored fallback`). Người dùng chỉ thấy danh sách CV trống trơn mà không hề có thông báo hay nút thử lại.
- **Bằng chứng:**
```typescript
// frontend/src/pages/ai/AIMatchingPage.tsx:178-180
  } catch {
    // Ignored fallback
  } finally {
    setIsCvLoading(false);
  }
```

---

### Phát hiện 4.4: Nuốt lỗi tải tài liệu ứng viên và AI Match trên JobDetailPage
- **Vị trí:** `frontend/src/pages/jobs/JobDetailPage.tsx:129-131` và `220-222`
- **Loại:** Exception bị nuốt
- **Mức độ:** **Trung bình** — Nếu API load hồ sơ CV hoặc API tính điểm AI Match gặp lỗi, catch block bỏ qua hoàn toàn hoặc chỉ set kết quả về null mà không thông báo lý do (mất mạng, server timeout, hay CV chưa được parse).
- **Bằng chứng:**
```typescript
// frontend/src/pages/jobs/JobDetailPage.tsx:129-131
  } catch {
    // Ignore
  }

// frontend/src/pages/jobs/JobDetailPage.tsx:220-222
  } catch {
    setAiMatchResult(null);
  }
```

---

## PHẦN 5 — Đối Chiếu UI Label / Badge Khẳng Định với Dữ Liệu Thật

### Phát hiện 5.1: Quảng bá sai lệch về chiều của Vector Embedding (1536 chiều vs 384 chiều thật)
- **Vị trí:** 
  - `frontend/src/pages/ai/AIMatchingPage.tsx:344`: `pgvector Cosine Similarity 1536-D Engine • Live 2026`
  - `frontend/src/pages/ai/AIMatchingPage.tsx:329`: `Vector Embedding và Cosine Similarity 1536 chiều`
  - `frontend/src/pages/ai/AIMatchingPage.tsx:80, 104`: `vector 1536 chiều`
  - `frontend/src/pages/jobs/components/Footer.tsx:353`: `Mô hình Vector Embedding 1536 chiều`
- **Loại:** Label sai lệch thực tế
- **Mức độ:** **Nghiêm trọng** — UI quảng bá hệ thống sử dụng Vector Embedding 1536 chiều. Tuy nhiên, trong toàn bộ Backend (`backend/app/models/resume.py:12`, `backend/app/services/embedding_service.py:18`), hệ thống sử dụng model mã nguồn mở `paraphrase-multilingual-MiniLM-L12-v2` với vector dimension thực tế chính xác là **384 chiều** (`EMBEDDING_DIM = 384`). Số 1536 là thông số của OpenAI Ada-002, hoàn toàn không khớp với công nghệ thực tế đang chạy.
- **Bằng chứng:**
```python
# backend/app/services/embedding_service.py:15-18
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384

# frontend/src/pages/ai/AIMatchingPage.tsx:344
<span>pgvector Cosine Similarity 1536-D Engine • Live 2026</span>
```

---

### Phát hiện 5.2: Badge "Doanh nghiệp đã xác thực" hiển thị vô điều kiện cho 100% tin tuyển dụng
- **Vị trí:** `frontend/src/pages/jobs/JobDetailPage.tsx:455-458`
- **Loại:** Label sai lệch thực tế
- **Mức độ:** **Nghiêm trọng** — Giao diện hiển thị huy hiệu `<ShieldCheck /> Doanh nghiệp đã xác thực` màu xanh lá cho mọi bài đăng tuyển dụng. Trong thực tế, bảng `companies` trong cơ sở dữ liệu thậm chí **KHÔNG CÓ CỘT `is_verified`**, và code UI cũng không hề kiểm tra bất kỳ điều kiện nào trước khi render nhãn khẳng định này.
- **Bằng chứng:**
```tsx
// frontend/src/pages/jobs/JobDetailPage.tsx:455-458
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
  Doanh nghiệp đã xác thực
</span>
```

---

### Phát hiện 5.3: Nhãn "🌟 Thuộc Top 15% cạnh tranh nhất" không dựa trên phân vị thị trường
- **Vị trí:** `frontend/src/pages/jobs/JobDetailPage.tsx:740-743`
- **Loại:** Label sai lệch thực tế
- **Mức độ:** **Trung bình** — Hiển thị nhãn khẳng định một công việc thuộc "Top 15% mức lương cạnh tranh nhất" chỉ dựa trên phép so sánh đơn giản với một con số hardcode trong component (`medianSalary = 32 | 55 | 85`), hoàn toàn không có dữ liệu thống kê phân vị (percentile) thực tế từ thị trường lao động.
- **Bằng chứng:**
```tsx
// frontend/src/pages/jobs/JobDetailPage.tsx:740-743
<span className="text-emerald-700 font-black">
  {isHighSalary ? "🌟 Thuộc Top 15% cạnh tranh nhất" : "✓ Mức thu nhập chuẩn thị trường"}
</span>
```

---

---

## PHẦN 6 — Lỗ Hổng Bảo Mật & Rò Rỉ Dữ Liệu PII (Security & Privacy Audit)

### Phát hiện 6.1: Lộ tệp CV ứng viên qua Static Route công khai không cần Token
- **Vị trí:** `backend/app/main.py:209-210`, `backend/app/routers/resumes.py:301-302`, `frontend/src/pages/employer/components/EmployerApplicationList.tsx:878`
- **Loại:** Broken Object Level Authorization (BOLA) / PII Leakage
- **Mức độ:** **Nghiêm trọng** — Toàn bộ thư mục `uploads/` đang được mount tĩnh công khai bằng `app.mount("/uploads", StaticFiles(directory="uploads"))`. Bất kỳ ai không cần đăng nhập vẫn có thể truy cập tải về toàn bộ CV chứa dữ liệu cá nhân nhạy cảm (Họ tên, SĐT, Email, Địa chỉ, Quá trình công tác).
- **Bằng chứng:**
```python
# backend/app/main.py:209-210
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="api_uploads")
```

---

### Phát hiện 6.2: Thiếu `state` trong luồng Google OAuth2 (Nguy cơ CSRF Account Takeover)
- **Vị trí:** `backend/app/services/oauth_service.py:44`, `backend/app/routers/auth.py:67-73`
- **Loại:** Cross-Site Request Forgery (CSRF) / Vi phạm RFC 6749 Section 10.12
- **Mức độ:** **Nghiêm trọng** — `oauth_service.py` vứt bỏ biến `_state` sinh từ Authlib, đồng thời endpoint `GET /auth/google/callback` không hề nhận hay đối soát tham số `state`. Kẻ tấn công có thể lừa nạn nhân nhấn vào URL callback mang mã ủy quyền của kẻ tấn công để liên kết tài khoản hoặc chiếm đoạt phiên làm việc.
- **Bằng chứng:**
```python
# backend/app/services/oauth_service.py:44
url, _state = client.create_authorization_url(GOOGLE_AUTHORIZE_URL)
return url
```

---

### Phát hiện 6.3: Rò rỉ JWT Access Token qua URL Query String
- **Vị trí:** `backend/app/services/oauth_service.py:129`, `frontend/src/pages/auth/GoogleCallback.tsx:21`
- **Loại:** Sensitive Data Exposure / CWE-598
- **Mức độ:** **Trung bình** — Sau khi đăng nhập Google thành công, backend redirect sang Frontend bằng URL dạng `?token={jwt_token}&redirect=...`. Token JWT bị lưu trữ vĩnh viễn trong Browser History, Reverse Proxy Access Logs và Header `Referer`.
- **Bằng chứng:**
```python
# backend/app/services/oauth_service.py:128-130
frontend_url = (
    f"{settings.FRONTEND_URL}/auth/google/callback?token={jwt_token}&redirect={role_path}"
)
```

---

### Phát hiện 6.4: Prompt Injection & System Message Hijacking trong AI Copilot Chat
- **Vị trí:** `backend/app/schemas/assistant.py:7`, `backend/app/services/assistant_service.py:185-186`
- **Loại:** OWASP Top 10 for LLM (LLM01 - Prompt Injection)
- **Mức độ:** **Trung bình** — Schema `ChatMessage` cho phép client gửi `role: "system"`. Backend đưa trực tiếp tin nhắn này vào chuỗi hội thoại gửi DeepSeek, cho phép kẻ tấn công chèn system instruction thứ hai nhằm ghi đè (override) chỉ dẫn gốc, trích xuất bí mật hệ thống hoặc phá vỡ quy tắc an toàn.
- **Bằng chứng:**
```python
# backend/app/schemas/assistant.py:6-8
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
```

---

### Phát hiện 6.5: Thiếu Rate Limiting trên Endpoint Đăng nhập & Đăng ký
- **Vị trí:** `backend/app/routers/auth.py:23, 37`, `backend/app/core/rate_limiter.py:68-72`
- **Loại:** CWE-307 (Brute-Force & Credential Stuffing Risk)
- **Mức độ:** **Trung bình** — `POST /auth/login` và `POST /auth/register` hoàn toàn không có rate limit, dễ bị tấn công tự động dò mật khẩu (dictionary attack) hoặc spam tạo tài khoản rác làm quá tải database.

---

### Phát hiện 6.6: Rò rỉ bộ nhớ (Memory Leak DoS) trong Rate Limiter In-Memory
- **Vị trí:** `backend/app/core/rate_limiter.py:23, 49`
- **Loại:** CWE-400 (Uncontrolled Resource Consumption)
- **Mức độ:** **Nhẹ** — `SlidingWindowRateLimiter` lưu trữ timestamp theo key trong `defaultdict(deque)` trên RAM không có TTL và không bao giờ giải phóng key cũ, có thể bị tấn công làm cạn kiệt RAM server (DoS) nếu gọi từ hàng triệu IP khác nhau.

---

### Phát hiện 6.7: `SECRET_KEY` Dùng Giá Trị Mặc Định Không An Toàn
- **Vị trí:** `backend/app/config.py:41`
- **Loại:** Insecure Default Configuration
- **Mức độ:** **Nhẹ** — `SECRET_KEY` có giá trị mặc định `"change-me-in-production"` nhưng thiếu validator chặn khởi động khi chạy môi trường Production (`DEBUG=False`).

---

### Phát hiện 6.8: Thiếu HTTP Security Headers & Lộ Swagger Docs Công Khai
- **Vị trí:** `backend/app/main.py:122-138`
- **Loại:** Security Misconfiguration
- **Mức độ:** **Nhẹ** — Thiếu các header HTTP an toàn (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`), và tài liệu `/docs` mở tự do cho mọi người dùng internet trên production.

---

## BẢNG TỔNG HỢP SỐ LƯỢNG THEO MỨC ĐỘ

| Phân Loại Lỗi | Nghiêm trọng | Trung bình | Nhẹ | Tổng cộng |
| :--- | :---: | :---: | :---: | :---: |
| **Phần 1: Hardcode Giả Lập & Vỏ Rỗng** | 6 | 3 | 1 | **10** |
| **Phần 2: Code Mồ Côi & Cột DB Rỗng** | 0 | 2 | 1 | **3** |
| **Phần 3: Tham Số Bị Bỏ Qua / Bỏ Quên Nhánh** | 2 | 1 | 0 | **3** |
| **Phần 4: Exception Bị Nuốt Âm Thầm** | 0 | 3 | 1 | **4** |
| **Phần 5: UI Label / Badge Sai Bản Chất** | 2 | 1 | 0 | **3** |
| **Phần 6: An Ninh & Bảo Mật Hệ Thống** | 2 | 3 | 3 | **8** |
| **TỔNG CỘNG HỆ THỐNG** | **12** | **13** | **6** | **31** |

---

## DANH SÁCH PHẦN NÀO CHƯA KỊP RÀ HẾT (GHI CHÚ MINH BẠCH)

Theo đúng quy tắc **không suy đoán - minh bạch tuyệt đối**:
1. **Thư mục `frontend/src/pages/tools/components/GrossNetCalculator.tsx`**: Các tỷ lệ phần trăm bảo hiểm xã hội (10.5% NLĐ, 21.5% DN) và các bậc thuế thu nhập cá nhân lũy tiến là theo quy định luật pháp Việt Nam hiện hành, đây là hằng số nghiệp vụ hợp lệ, không phải hardcode giả lập.
2. **Database Migration Files (`backend/alembic/versions/`)**: Chưa đối soát từng câu lệnh migration trong quá khứ so với schema models hiện tại, tuy nhiên toàn bộ CRUD matrix và ORM columns hiện hữu đã được kiểm tra tính nhất quán.
3. **Các file test tĩnh (`*.test.tsx`, `*.test.py`)**: Không nằm trong diện audit lỗi runtime production vì môi trường test bắt buộc phải dùng mock data.

---

> ⚠️ **HÀNH ĐỘNG TIẾP THEO:** Báo cáo này được tạo ở chế độ **AUDIT-ONLY**. Chưa có bất kỳ dòng code nào bị chỉnh sửa. Kính đề nghị Quý Lãnh đạo xem xét duyệt danh sách trên trước khi tiến hành lên kế hoạch xử lý dứt điểm từng nhóm lỗi!

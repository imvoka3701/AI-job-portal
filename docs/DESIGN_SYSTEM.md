# DESIGN SYSTEM — AI Job Portal

> **Tài liệu chuẩn hóa**: Đây là "nguồn chân lý" (single source of truth) cho mọi quyết định UI/UX từ Giai đoạn 5 trở đi.
> **Nguyên tắc**: KHÔNG viết CSS tùy tiện ngoài file này. Mọi màu sắc/border-radius/shadow mới phải có trong bảng dưới.

---

## 1. Bảng màu (Color Palette)

### 1.1 Design Tokens (`@theme` trong `globals.css`)

| Token | Hex | Tailwind class | Cách dùng |
|---|---|---|---|
| `--color-primary` | `#00b968` | `text-primary`, `bg-primary`, … | Nút CTA chính, link, viền active; màu xanh lá nhận diện của sản phẩm |
| `--color-primary-hover` | `#00a85f` | `bg-primary-hover` | Hover nút primary |
| `--color-primary-dark` | `#008f52` | `text-primary-dark`, `bg-primary-dark` | Trạng thái nhấn mạnh trên nền sáng |
| `--color-primary-light` | `#e8f9f1` | `bg-primary-light` | Nền badge/cảnh báo nhẹ |
| `--color-primary-soft` | `#f0fbf6` | `bg-primary-soft` | Nền khu vực thương hiệu nhẹ |
| `--color-bg` | `#ffffff` | `bg-bg` | Nền trang chính (card, modal body) |
| `--color-bg-secondary` | `#f8fafc` | `bg-bg-secondary` | Nền section phụ |
| `--color-text` | `#0f172a` | `text-text` | Body text |
| `--color-text-secondary` | `#64748b` | `text-text-secondary` | Caption, placeholder, metadata |
| `--color-border` | `#e2e8f0` | `border-border` | Viền card, input, divider |
| `--color-success` | `#10b981` | `text-success`, `bg-success` | Thành công, xanh lá |
| `--color-warning` | `#f59e0b` | `text-warning`, `bg-warning` | Cảnh báo, vàng |
| `--color-error` | `#ef4444` | `text-error`, `bg-error` | Lỗi, đỏ |
| `--radius` | `0.5rem` | — | Border-radius mặc định |
| `--font-sans` | `Inter, system-ui, -apple-system, sans-serif` | `font-sans` | Font toàn ứng dụng |

### 1.2 Gray Scale (Tailwind built-in)

| Class | Hex | Dùng ở đâu |
|---|---|---|
| `gray-50` | `#f9fafb` | Nền card light, hover ghost button |
| `gray-100` | `#f3f4f6` | Divider card, badge default bg |
| `gray-200` | `#e5e7eb` | Viền Card chuẩn, Skeleton bg |
| `gray-300` | `#d1d5db` | Hover border Input |
| `gray-400` | `#9ca3af` | Placeholder text, Spinner |
| `gray-500` | `#6b7280` | CardDescription text |
| `gray-600` | `#4b5563` | Ghost button text |
| `gray-700` | `#374151` | CardContent body, Label text |
| `gray-900` | `#111827` | CardTitle heading |

### 1.3 Accent Colors (KHÔNG có trong @theme — dùng trực tiếp)

| Class | Hex | Cách dùng | File nguồn |
|---|---|---|---|
| `emerald-600` | `#059669` | Màu xanh legacy; component mới phải ưu tiên `text-primary` | Các page cũ đang chờ chuẩn hóa |
| `blue-600` | `#2563eb` | Màu thông tin; không dùng thay primary xanh lá | Biểu đồ và thông tin trung tính |
| `blue-50` | `#eff6ff` | Nền icon upload CV | CandidateDashboard |
| `green-50` | `#f0fdf4` | Nền icon success | CandidateDashboard |
| `red-50` | `#fef2f2` | Nền icon error, error banner | CandidateDashboard |
| `red-600` | `#dc2626` | Icon/text lỗi, Button destructive | toàn hệ thống |
| `amber-50` | `#fffbeb` | AIDisclaimerBanner background | AIDisclaimerBanner |
| `amber-200` | `#fde68a` | AIDisclaimerBanner border | AIDisclaimerBanner |
| `amber-700` | `#b45309` | AIDisclaimerBanner text | AIDisclaimerBanner |
| `blue-50` | `#eff6ff` | Nền tóm tắt CV (summary block) | EmployerDashboard modal |
| `blue-700` | `#1d4ed8` | Text summary heading | EmployerDashboard modal |

### 1.4 Page Background

**TOÀN BỘ trang dùng: `bg-page-bg`** (token `--color-page-bg: #F5F7F8`). Không hardcode lại mã màu tại component.

---

## 2. Border-Radius

| Component | Class | Giá trị px |
|---|---|---|
| **Card** | `rounded-lg` | 8px |
| **Button md/lg** | `rounded-lg` | 8px |
| **Button sm** | `rounded-md` | 6px |
| **Button icon** | `rounded-lg` | 8px |
| **Input** | `rounded-lg` | 8px |
| **Badge** | `rounded-full` | pill |
| **Skeleton** | `rounded-md` (default), `rounded-full` (circle) | 6px / pill |
| **Modal panel** | `rounded-lg` | 8px |
| **Modal close btn** | `rounded-md` | 6px |

### ❌ KHÔNG dùng:
- `rounded-3xl` (24px) — vi phạm ở JobDetailPage, CandidateDashboard error banner
- `rounded-[32px]` — vi phạm ở EmployerDashboard header card
- `rounded-2xl` — vi phạm ở JobDetailPage skeleton loading

---

## 3. Shadow

| Component | Class | Value |
|---|---|---|
| **Card** | `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| **Button primary/secondary/destructive/outline** | `shadow-sm` | như trên |
| **Modal panel** | `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` |
| **Hoverable Card** | `hover:shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` |

---

## 4. Spacing

| Scale | Class | Cách dùng |
|---|---|---|
| **Page container padding** | `px-4 sm:px-6 lg:px-8` | Mọi trang |
| **Content spacing** | `space-y-6` | Khoảng cách giữa các Card/section trong trang |
| **Card padding** | `p-5` | Card mặc định (20px) |
| **Section top** | `py-10` | Padding trên/dưới cho toàn bộ section chính |
| **Layout max-width** | Không cố định | Các trang dùng `max-w-*` khác nhau (xem §8 bất thường) |

---

## 5. Typography

| Vai trò | Class | Mẫu |
|---|---|---|
| **Heading trang** | `text-3xl font-semibold text-gray-900` | "Phân tích độ phù hợp", "Dashboard Nhà tuyển dụng" |
| **Heading card** | `text-lg font-semibold text-gray-900` | CardHeader h2 |
| **Subheading** | `text-xl font-semibold text-gray-900` | Section headings trong trang |
| **Body text** | `text-sm text-gray-600` hoặc `text-gray-700` | Mô tả, paragraph |
| **Caption / meta** | `text-xs text-gray-400` hoặc `text-gray-500` | Timestamp, helper text |
| **Button text** | `font-medium text-sm` | Button base |
| **Badge text** | `text-xs font-medium` | Badge sm/md |
| **Card title** | `text-base font-semibold text-gray-900` | CardTitle component |
| **Card description** | `text-sm text-gray-500` | CardDescription component |

---

## 6. Component Patterns

### 6.1 Card
```tsx
// Chuẩn (từ Component Card):
<Card>
  <CardHeader>
    <h2 className="text-lg font-semibold text-slate-900">Title</h2>
    <p className="text-sm text-slate-500">Description</p>
  </CardHeader>
  <CardContent>
    {/* nội dung */}
  </CardContent>
</Card>
```
- Border: `border-gray-200`
- Viền: `rounded-lg` (8px)
- Shadow: `shadow-sm`
- Padding mặc định: `p-5`

### 6.2 Button
6 variants: `primary` (blue-600), `secondary` (white + gray border), `outline` (transparent + blue border), `destructive` (red-600), `ghost` (transparent, gray text), `link` (blue text).
- Base: `rounded-lg border font-medium text-sm`
- Chi tiết: xem `Button.tsx` cva variants

### 6.3 Badge
10 variants: `default`, `primary`, `success`, `warning`, `danger`, `info`, `purple`, `solid-primary`, `solid-success`, `solid-danger`.
- Base: `rounded-full border font-medium`
- Chi tiết: xem `Badge.tsx` cva variants

### 6.4 Input
- Base: `rounded-lg border border-gray-200 bg-white text-sm`
- Height: `h-10` (40px)
- Focus: `focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`

### 6.5 Error Banner
```tsx
<div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
  {errorMessage}
</div>
```
⚠️ `rounded-3xl` — nên đổi về `rounded-lg` cho đồng nhất với Card.

### 6.6 Page Header
```tsx
<div>
  <p className="text-sm font-medium text-primary">SUBTITLE</p>
  <h1 className="text-3xl font-semibold text-gray-900">HEADING</h1>
  <p className="mt-2 text-sm text-gray-600">Description</p>
</div>
```

---

## 7. Bảng Audit — Các điểm lệch cần sửa

### 7.1 VI PHẠM NGHIÊM TRỌNG (khác biệt rõ rệt)

| # | Trang/Component | Vị trí | Hiện tại | Phải là | Lý do |
|---|---|---|---|---|---|
| V1 | **Mọi trang** | Page background | `bg-page-bg` | ✅ Đã có token `--color-page-bg` trong `@theme` | Đã chuẩn hóa |
| V2 | **EmployerDashboard** | Header card (dòng 227-242 của file cũ, nay đã đổi) | `rounded-[32px] bg-white p-8 shadow-lg border border-slate-200` | `<Card>` component | Tự custom thay vì dùng Card, border-radius 32px khác hoàn toàn 8px |
| V3 | **JobDetailPage** | Card phụ (dòng 145, 149) | `rounded-3xl bg-slate-50 p-5 border border-slate-200` | `rounded-lg` | 24px vs 8px — gấp 3 lần |
| V4 | **JobDetailPage** | Sidebar cards (dòng 157, 165) | `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm` | `<Card>` component với `rounded-lg` | 24px vs 8px |
| V5 | **CandidateDashboard** | Error banner (dòng 355) | `rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700` | `rounded-lg` | Nhất quán với Card |
| V6 | **CandidateDashboard** | Stats box (dòng 408) | `rounded-3xl bg-slate-50 p-4` | `rounded-lg` | 24px vs 8px |
| V7 | **AIMatchingPage** | Error banner | `rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700` | `rounded-lg` | Nhất quán với Card |
| V8 | **AIMatchingPage** | Score explanation card | `rounded-lg bg-slate-50 border border-gray-200 p-4` | ✅đã đúng | |
| V9 | **RoadmapPage** | Error banner | `rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700` | `rounded-lg` | Nhất quán với Card |
| V10 | **EmployerDashboard** | All error banners | `rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700` | `rounded-lg` | Nhất quán với Card |
| V11 | **Admin pages** | GuestPage component | `rounded-lg` → Card | ✅đã đúng | |

### 7.2 VI PHẠM MÀU SẮC (dùng màu ngoài palette)

| # | Trang/Component | Vị trí | Màu đang dùng | Phải dùng | Lý do |
|---|---|---|---|---|---|
| C1 | **JobDetailPage** | Border card phụ (dòng 145) | `border-slate-200` | `border-gray-200` | Card component dùng `gray-200`, phải nhất quán |
| C2 | **JobDetailPage** | Sidebar cards (dòng 157, 165) | `border-slate-200` | `border-gray-200` | Như trên |
| C3 | **EmployerDashboard** | Header card | `border-slate-200` | `border-gray-200` | Card component dùng `gray-200` |
| C4 | **LoginPage** | Toàn bộ trang | `#00B86B` green | `--color-primary` xanh lá | Giữ branded experience nhưng cùng linh hồn thương hiệu |
| C5 | **JobDetailPage** | Loading skeleton (dòng 90-92) | `rounded-2xl bg-slate-200` | `rounded-lg bg-gray-200` | Skeleton component dùng `bg-gray-200` |

### 7.3 VI PHẠM TYPOGRAPHY (font-size/weight không khớp)

| # | Trang | Vị trí | Hiện tại | Phải là |
|---|---|---|---|---|
| T1 | **Modal** | Title | `text-slate-900` | `text-gray-900` (CardTitle dùng `gray-900`) |
| T2 | **Modal** | Close button | `text-slate-400 hover:text-slate-600` | Nhất quán — nên thống nhất 1 palette: tất cả là `gray-*` hoặc tất cả là `slate-*` |
| T3 | **AIDisclaimerBanner** | Text | `text-amber-700` | ✅ đúng (amber palette hợp lệ) |
| T4 | **CandidateDashboard** | Heading | `text-slate-900` | ✅ Phase 1 pattern — dùng `slate-*` |
| T5 | **EmployerDashboard** | Mix | Có chỗ `text-slate-900`, có chỗ `text-gray-900` | Phải nhất quán 1 palette |

### 7.4 VI PHẠM KHÁC

| # | Trang | Vấn đề |
|---|---|---|
| O1 | **EmployerDashboard** | Header card không dùng `<Card>` mà tự `<div>` với `rounded-[32px]` — nên đổi thành `<Card>` |
| O2 | **JobDetailPage** | Loader skeleton tự viết inline (`animate-pulse` + `rounded-2xl bg-slate-200`) thay vì dùng `<JobDetailSkeleton>` đã có |
| O3 | **AIMatchingPage** | Nút "Phân tích độ phù hợp" dùng `variant="primary" fullWidth` — ✅ đúng |
| O4 | **AIMatchingPage** | CV select dropdown dùng `<select>` thường với class `mt-1.5 w-full h-10 rounded-lg border border-gray-200 bg-white text-sm` — nhất quán với Input, ✅ đúng |
| O5 | **RoadmapPage** | Timeline step circle dùng `bg-blue-600` — ✅ đúng (màu primary) |
| O6 | **CVSummarize Modal** | Summary block dùng `rounded-lg bg-blue-50 border border-blue-200` — nên đổi thành `bg-primary-light` token |
| O7 | **Multiple AI pages** | Loading state spinner tự viết inline SVG thay vì dùng `<Spinner>` component có sẵn |

---

## 8. Các điểm cần quyết định

| # | Vấn đề | Lựa chọn |
|---|---|---|
| D1 | **Gray vs Slate**: Components/ui dùng `gray-*`, pages dùng `slate-*` → xung đột | Chọn 1 hệ: **gray-*** (vì components/ui đã dùng gray, sửa pages ít hơn sửa components) |
| D2 | **Primary xanh lá (#00B968)** | Giữ làm màu nhận diện xuyên suốt; Login/Register được phép dùng branded composition riêng nhưng không tạo palette khác |
| D3 | **`rounded-3xl` (24px)**: Xuất hiện ở JobDetailPage + CandidateDashboard | Sửa về `rounded-lg` (8px) để nhất quán với Card |
| D4 | **Page background**: `#F5F7F8` có cần thêm vào @theme không? | ✅ Đã có token `--color-page-bg`; dùng `bg-page-bg` |
| D5 | **Header card EmployerDashboard**: `rounded-[32px]` có cần sửa? | Có — đổi về `<Card>` với `rounded-lg` |

---

## 9. Interaction Patterns — Level Up

Các pattern dưới đây nâng cấp trải nghiệm nhưng phải giữ nguyên bản sắc: primary xanh lá, nền trắng/xám nhạt, typography `gray-*`, card 8px và chuyển động nhẹ.

### 9.1 Confirm Dialog

- Mọi thao tác thay đổi quyền, khóa thành viên, chuyển ownership hoặc xóa dữ liệu phải dùng `ConfirmDialog`; không dùng `window.confirm`.
- Tiêu đề nêu đúng hành động, mô tả nêu đối tượng và phạm vi ảnh hưởng ngay lập tức.
- Biến thể `destructive` chỉ dùng cho hành động gây mất quyền hoặc dữ liệu; lỗi API phải hiển thị trong dialog và không tự đóng.
- Dialog phải hỗ trợ Escape, focus trap, khôi phục focus và trạng thái loading khi gửi.

### 9.2 Drawer

- Dùng `Drawer` cho tác vụ cần xem ngữ cảnh danh sách nhưng không rời trang, ví dụ phân công phạm vi job.
- Header, vùng cuộn nội dung và footer hành động phải tách rõ; drawer hỗ trợ Escape, focus trap và khóa cuộn trang nền.
- Quyền kế thừa từ phòng ban phải hiển thị read-only; quyền gán trực tiếp mới được bật/tắt.

### 9.3 Permission Matrix

- Ma trận quyền là màn hình giải thích read-only, lấy nội dung từ đúng policy backend.
- Luôn phân biệt Owner, HR và Trưởng bộ phận; đánh dấu vai trò hiện tại của người xem.
- Quyết định tuyển dụng cuối thuộc con người và phải được thể hiện bằng text, không chỉ bằng màu hoặc icon.

### 9.4 Role-Aware Dashboard

- Owner/HR thấy tác vụ vận hành: đăng tin, pipeline, đội ngũ và thống kê toàn công ty.
- Trưởng bộ phận thấy tác vụ chuyên môn trong scope: ứng viên được giao, lịch phỏng vấn, đánh giá và phạm vi quyền.
- Không render CTA mà vai trò hiện tại không được phép thực hiện; empty state phải chỉ rõ người dùng cần liên hệ ai hoặc làm gì tiếp theo.

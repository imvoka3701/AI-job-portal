# TIÊU CHÍ 10: TÍCH HỢP CHỨC NĂNG AI VỚI TRẢI NGHIỆM NGƯỜI DÙNG (UX)
## DỰ ÁN: AI-POWERED JOB PORTAL (NỀN TẢNG TUYỂN DỤNG THÔNG MINH B2B)

---

### 1. YÊU CẦU TIÊU CHÍ
> **Tiêu chuẩn:** Luồng sử dụng AI xuất hiện tự nhiên, hữu ích, hòa nhập vào luồng nghiệp vụ của người dùng; có sự phân định rạch ròi, không gây nhầm lẫn giữa khuyến nghị hỗ trợ của AI và các quyết định/chức năng quản lý chính của con người.

---

### 2. HIỆN TRẠNG TRIỂN KHAI TRONG HỆ THỐNG

Hệ thống tuân thủ nghiêm ngặt triết lý thiết kế **Human-in-the-Loop (Con người nắm quyền quyết định tối hậu)**:
1. **Tích hợp tự nhiên theo ngữ cảnh (In-context Ergonomics):** Người dùng không bao giờ phải sao chép dữ liệu sang công cụ thứ ba. Mọi tương tác AI đều nằm ngay tại vị trí thao tác nghiệp vụ.
2. **Không gây nhầm lẫn với quyết định quản lý:** Điểm số AI và các nhận xét tự động chỉ đóng vai trò tư vấn; trạng thái tuyển dụng chính thức (`Pending`, `Reviewing`, `Interviewing`, `Accepted`, `Rejected`) hoàn toàn do Nhà tuyển dụng ấn định thủ công.
3. **Bộ nhận diện AI nhất quán (AI Visual Signature):** Sử dụng biểu tượng `Sparkles` cùng dải màu Gradient tím/indigo và gắn kèm nhãn nhận diện "AI Copilot / Assistant".

---

### 3. CÁC ĐIỂM CHẠM TRẢI NGHIỆM AI TIÊU BIỂU

#### A. Nhà tuyển dụng: AI Matching trên Thẻ Kanban Tuyển dụng
Tại [frontend/src/pages/employer/EmployerCandidatesPage.tsx](file:///d:/ai-job-portal/frontend/src/pages/employer/EmployerCandidatesPage.tsx):
* Trên từng thẻ ứng viên trong bảng Kanban, Nhà tuyển dụng có thể click nút **"Phân tích AI"** có biểu tượng `Sparkles`.
* Modal phân tích mở ra hiển thị đồng thời: Biểu đồ Radar Chart 3 trục, điểm số phù hợp, danh sách kỹ năng thiếu hụt và bộ câu hỏi phỏng vấn gợi ý.
* Ngay sau đó, HR có thể click **"Soạn thư phỏng vấn"** để AI điền sẵn nội dung email nháp, HR chỉ việc rà soát và bấm gửi.

```tsx
{/* Nút kích hoạt AI nằm tự nhiên trên thẻ ứng viên */}
<Button
  size="sm"
  variant="outline"
  onClick={() => handleOpenAIAnalysis(candidate)}
  className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
>
  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
  Phân tích AI 3 trục
</Button>
```

#### B. Ứng viên: Trợ lý CV Copilot dạng Drawer trượt
Tại [frontend/src/pages/candidate/cv-builder/components/CandidateCVCopilotDrawer.tsx](file:///d:/ai-job-portal/frontend/src/pages/candidate/cv-builder/components/CandidateCVCopilotDrawer.tsx):
* Khi ứng viên đang tự tay soạn thảo CV, thay vì phải chuyển tab sang ChatGPT, ứng viên chỉ cần bấm nút "CV Copilot" ở góc phải màn hình.
* Một Side Drawer trượt êm ái xuất hiện bên cạnh form soạn thảo, tự động đọc nội dung phần đang viết và đưa ra gợi ý viết lại mục Kinh nghiệm hoặc bổ sung kỹ năng chuẩn ATS. Người dùng bấm "Áp dụng", nội dung tự động điền vào form mà không làm mất trạng thái đang soạn.

#### C. Quy trình ứng tuyển rõ ràng (AppliedStatusTracker)
Để ứng viên không bị nhầm lẫn giữa điểm tương thích AI và kết quả tuyển dụng chính thức của công ty, component [frontend/src/pages/jobs/components/AppliedStatusTracker.tsx](file:///d:/ai-job-portal/frontend/src/pages/jobs/components/AppliedStatusTracker.tsx) hiển thị đường ống quy trình 4 giai đoạn độc lập:

```tsx
const PIPELINE_STEPS: PipelineStep[] = [
  { id: "applied", label: "Đã nộp", subLabel: "Hồ sơ tiếp nhận", icon: FileCheck },
  { id: "review", label: "Thẩm định", subLabel: "HR xem xét CV", icon: Clock },
  { id: "interview", label: "Phỏng vấn", subLabel: "Trao đổi kỹ thuật", icon: Users },
  { id: "decision", label: "Kết quả", subLabel: "Đưa ra quyết định", icon: Award },
];
```
> **Phân định rõ ràng:** Điểm `aiMatchingScore` được hiển thị ở một Badge phụ mang tính tư vấn ("Độ phù hợp AI gợi ý: 85%"), tách biệt hoàn toàn với thanh tiến trình tuyển dụng do doanh nghiệp điều phối.

---

### 4. NGUYÊN TẮC MINH BẠCH & TRÁNH NHẦM LẪN (HUMAN-IN-THE-LOOP)

| Yếu tố thiết kế | Cơ chế giải quyết trong hệ thống |
| :---| :---|
| **AI không tự ý ra quyết định** | AI không bao giờ tự động chuyển trạng thái đơn ứng tuyển sang `Accepted` hay `Rejected`. Mọi hành động chuyển cột Kanban đều đòi hỏi thao tác kéo-thả hoặc click của HR. |
| **AI không tự động gửi email** | Module AI Email Generator chỉ sinh ra bản nháp (Draft). Người dùng bắt buộc phải xem lại, có thể chỉnh sửa và tự tay nhấn nút "Xác nhận gửi". |
| **Nhận diện thị giác khác biệt** | Các thành phần do AI sinh ra luôn có viền sáng Gradient hoặc màu tím/indigo đặc trưng và icon `Sparkles`, khác biệt với các nút chức năng quản trị CRUD thông thường (màu xám/xanh dương). |
| **Cảnh báo thường trực** | Banner cảnh báo trách nhiệm pháp lý xuất hiện tại chân trang mọi kết quả AI: *"Kết quả mang tính chất tham khảo. Quyết định cuối cùng do con người thực hiện."* |

---

### 5. KẾT LUẬN TIÊU CHÍ 10
* Các chức năng AI được nhúng mượt mà vào hành trình người dùng của cả Ứng viên và Nhà tuyển dụng (In-context & Ergonomic).
* Đảm bảo tính minh bạch tối đa, không gây nhầm lẫn giữa đề xuất của máy tính và quyết định của con người.
* Tuân thủ triệt để nguyên tắc **Human-in-the-Loop** trong môi trường B2B chuyên nghiệp.
* **Mức độ đáp ứng:** **100% - ĐẠT XUẤT SẮC**.

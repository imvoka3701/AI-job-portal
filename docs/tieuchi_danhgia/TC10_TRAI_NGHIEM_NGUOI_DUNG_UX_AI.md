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
Tại [frontend/src/components/candidate/copilot/CandidateCVCopilotDrawer.tsx](file:///d:/ai-job-portal/frontend/src/components/candidate/copilot/CandidateCVCopilotDrawer.tsx):
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

#### D. Quản trị viên (Admin): Trung tâm Giám sát AI & Đối soát Trực quan (Enterprise Standard)
Tại [frontend/src/pages/admin/AdminAILogsPage.tsx](file:///d:/ai-job-portal/frontend/src/pages/admin/AdminAILogsPage.tsx) và [frontend/src/pages/admin/AIPromptsPage.tsx](file:///d:/ai-job-portal/frontend/src/pages/admin/AIPromptsPage.tsx):
* **Biểu đồ trực quan Stacked Bar Chart:** Phân định rõ số lượt gọi AI thành công (`#00B86B`) và thất bại (`#ef4444`) theo từng tính năng, loại bỏ hoàn toàn các con số khó hiểu của log thô.
* **Thẻ KPI Real-time:** Hiển thị số dư ví DeepSeek Cloud (`$0.54 USD` - Live Sync kèm hiệu ứng pulse), lưu lượng gọi trong ngày, ước tính chi phí và tỷ lệ lỗi.
* **Thử nghiệm Prompt an toàn (Live Test):** Cho phép Quản trị viên thử prompt với dữ liệu mẫu và xem trước kết quả JSON trước khi lưu, bảo đảm không gây gián đoạn môi trường vận hành thực tế.
* **Xuất báo cáo phục vụ kiểm toán (CSV Export):** Tích hợp nút xuất CSV chuẩn UTF-8 BOM hiển thị tiếng Việt sắc nét trên Excel, cho phép lọc linh hoạt theo thời gian, tính năng và trạng thái.

#### E. Trải nghiệm Xử lý CV Trái ngành & Định hướng Liên ngành (Smart Domain UX)
Tại [frontend/src/pages/candidate/components/RecommendedJobs.tsx](file:///d:/ai-job-portal/frontend/src/pages/candidate/components/RecommendedJobs.tsx):
* **Loại bỏ trạng thái trống cụt lủn (No Dead-ends):** Khi ứng viên tải lên CV chuyên môn phi CNTT (ví dụ: Kế toán, Y tế, Marketing) hoặc lĩnh vực chưa có JD khớp trên sàn: Hệ thống không bao giờ báo lỗi vô nghĩa hoặc ép ghép việc làm trái ngành với điểm số thấp.
* **Giao diện Định hướng Tôn trọng & Minh bạch:** Hiển thị thẻ thông báo màu vàng hổ phách trang trọng kèm icon `Compass`, Badge nhận diện chuyên môn phát hiện và phân tích thị trường rõ ràng.
* **Thẻ chuyển đổi nghề nghiệp (Interactive Bridge Suggestions):** Render các nút gợi ý vị trí công nghệ liên ngành có thể click ngay (ví dụ: *Tư vấn ERP / SAP*, *IT Business Analyst Fintech*...) dẫn đến bộ lọc tìm kiếm thực tế hoặc trang tạo lộ trình học bù kỹ năng.
* **Tôn trọng quyền tự chủ của người dùng (Empowered User Choice):** Bên dưới thông báo định hướng, hệ thống vẫn hiển thị danh sách các vị trí công nghệ tiêu biểu để người dùng tham khảo xu hướng thị trường nếu họ có nguyện vọng chuyển đổi nghề nghiệp.

---

### 4. NGUYÊN TẮC MINH BẠCH & TRÁNH NHẦM LẪN (HUMAN-IN-THE-LOOP)

| Yếu tố thiết kế | Cơ chế giải quyết trong hệ thống |
| :---| :---|
| **AI không tự ý ra quyết định** | AI không bao giờ tự động chuyển trạng thái đơn ứng tuyển sang `Accepted` hay `Rejected`. Mọi hành động chuyển cột Kanban đều đòi hỏi thao tác kéo-thả hoặc click của HR. |
| **AI không tự động gửi email** | Module AI Email Generator chỉ sinh ra bản nháp (Draft). Người dùng bắt buộc phải xem lại, có thể chỉnh sửa và tự tay nhấn nút "Xác nhận gửi". |
| **Nhận diện thị giác khác biệt** | Các thành phần do AI sinh ra luôn có viền sáng Gradient hoặc màu tím/indigo đặc trưng và icon `Sparkles`, khác biệt với các nút chức năng quản trị CRUD thông thường (màu xám/xanh dương). |
| **Banner cảnh báo trách nhiệm pháp lý đa ngữ cảnh** | Component [frontend/src/components/ui/AIDisclaimerBanner.tsx](file:///d:/ai-job-portal/frontend/src/components/ui/AIDisclaimerBanner.tsx) tự động hiển thị thông điệp cảnh báo phù hợp với từng nghiệp vụ (xem chi tiết bên dưới). |

*Chi tiết 6 ngữ cảnh cảnh báo minh bạch của `AIDisclaimerBanner`:*
1. **Đánh giá CV (`evaluation`):** *"Đánh giá này do AI tạo ra và chỉ mang tính tham khảo. Điểm số phản ánh phân tích văn bản, không thay thế nhận xét của nhà tuyển dụng. Quyết định tuyển dụng cuối cùng do con người thực hiện."*
2. **Câu hỏi phỏng vấn (`questions`):** *"Câu hỏi phỏng vấn được AI gợi ý dựa trên JD và CV — không phải đánh giá toàn diện về ứng viên. Người phỏng vấn cần điều chỉnh phù hợp và ra quyết định độc lập."*
3. **Soạn thảo email (`email`):** *"Email này là bản nháp do AI soạn. Vui lòng đọc kỹ, chỉnh sửa nội dung và xác nhận thông tin trước khi gửi cho ứng viên. AI không gửi email thay bạn."*
4. **Tóm tắt CV (`summary`):** *"Tóm tắt này do AI phân tích văn bản CV và JD — có thể bỏ sót ngữ cảnh hoặc kinh nghiệm thực tế. Luôn xem xét toàn bộ hồ sơ trước khi đưa ra quyết định."*
5. **Gợi ý viết CV (`cv`):** *"Gợi ý nội dung CV được tạo bởi AI dựa trên thông tin bạn nhập. AI không bịa thêm kinh nghiệm hay số liệu — bạn cần xem trước và xác nhận trước khi chèn vào CV."*
6. **So khớp tuyển dụng (`matching`):** *"Điểm phù hợp là kết quả so sánh văn bản tự động, chỉ mang tính tham khảo. AI không đánh giá được kinh nghiệm thực tế hay văn hóa làm việc. Quyết định tuyển dụng do con người thực hiện."*

---

### 5. KẾT LUẬN TIÊU CHÍ 10
* Các chức năng AI được nhúng mượt mà vào hành trình người dùng của cả Ứng viên, Nhà tuyển dụng và Quản trị viên (In-context & Ergonomic).
* Đảm bảo tính minh bạch tối đa nhờ hệ thống `AIDisclaimerBanner` đa ngữ cảnh, phân định rạch ròi giữa khuyến nghị hỗ trợ của thuật toán và quyền quyết định tối hậu của con người.
* Tuân thủ triệt để nguyên tắc **Human-in-the-Loop** trong toàn bộ nền tảng B2B SaaS hiện đại.
* **Mức độ đáp ứng:** **100% - ĐẠT XUẤT SẮC**.

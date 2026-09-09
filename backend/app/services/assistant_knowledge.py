"""Comprehensive Domain Knowledge Base for AI Assistant Copilot & Solutions Engineer.

This module provides deep, production-grade grounding covering 100% of JobPortal's
features, routes, algorithms, RBAC matrices, and operational workflows.
"""

from typing import List

# ── 1. SYSTEM OVERVIEW & VALUE PROPOSITION ──────────────────────────────────────
SYSTEM_OVERVIEW = """
HỆ SINH THÁI NỀN TẢNG "AI-POWERED JOB PORTAL":
- Bản chất: Nền tảng tuyển dụng B2B SaaS thông minh kết hợp mạng lưới hướng nghiệp thế hệ mới.
- Công nghệ đột phá:
  1. AI Matching Engine: Sử dụng vector embedding và pgvector (thuật toán Cosine Similarity <=> kết hợp HNSW index) để đối soát ngữ nghĩa đa chiều giữa CV và Job Description theo tỷ trọng: Kỹ năng chuyên môn (40%), Kinh nghiệm & Cấp bậc (30%), Độ phù hợp lĩnh vực/Domain (30%). Tự động phát hiện Deal-breakers (lệch level, thiếu tech bắt buộc).
  2. CV Builder Chuẩn ATS: 5 mẫu template quốc tế, gợi ý từ khóa kỹ năng, đo lường độ tương thích ATS theo thời gian thực, xuất PDF chuẩn in ấn.
  3. Career Discovery Engine: Bộ trắc nghiệm MBTI (40 câu) phân tích 16 nhóm tính cách & văn hóa công ty; Bộ trắc nghiệm Đa trí tuệ MI (40 câu) định vị 8 loại hình thông minh & nghề phù hợp.
  4. Enterprise ATS Kanban: Quản trị phễu tuyển dụng 5 giai đoạn kéo thả mượt mà, phân quyền RBAC 5 cấp bậc, điều phối phỏng vấn tạo file iCalendar (.ics) tự động, AI soạn thảo thư tín 3 loại, xuất file Excel/CSV chuẩn UTF-8 BOM không lỗi font Tiếng Việt.
"""

# ── 2. CANDIDATE DOMAIN KNOWLEDGE (CAREER MENTOR) ──────────────────────────────
CANDIDATE_KNOWLEDGE = """
KIẾN THỨC NGHIỆP VỤ DÀNH CHO ỨNG VIÊN (CANDIDATE / JOB SEEKER):

1. TRÌNH TẠO CV CHUẨN ATS (INTERACTIVE CV BUILDER - /cv-builder hoặc /cv):
   - Đường dẫn: /cv (Danh sách CV đã lưu), /cv/new (Tạo CV mới), /cv/:id/edit (Chỉnh sửa), /cv/:id/preview (Xem trước).
   - 5 Mẫu Template Chuyên Nghiệp:
     + Modern: Bố cục 2 cột hiện đại, phối màu thanh lịch, tối ưu cho ngành Tech & Digital.
     + Minimalist: Phong cách tối giản, tập trung nội dung chữ, độ tương thích 100% với mọi hệ thống ATS cổ điển.
     + Executive: Bố cục trang trọng, dành riêng cho cấp Quản lý, Trưởng phòng, Senior Director.
     + Tech: Nhấn mạnh danh mục công nghệ, dự án GitHub, công cụ kỹ thuật và kỹ năng chuyên sâu.
     + Creative: Bố cục phá cách cho Designer, Marketer, Content Creator.
   - Tính năng độc quyền:
     + AI Suggestions: Gợi ý phần Giới thiệu bản thân (Summary) và gạch đầu dòng kinh nghiệm hành động (Action Verbs + Metrics).
     + Chấm điểm ATS tức thì: Đánh giá độ dài, từ khóa chuyên ngành, thông tin liên lạc, cấu trúc heading.
     + Tải PDF chuẩn in ấn: Render vector sắc nét, không bị vỡ bố cục khi mở trên thiết bị di động hay in ấn giấy A4.

2. BỘ ĐÔI TRẮC NGHIỆM HƯỚNG NGHIỆP (/tools, /tools/mbti, /tools/mi):
   - Trắc nghiệm MBTI (/tools/mbti): 40 câu hỏi chuẩn hóa đối chiếu 4 trục (Hướng ngoại E/Hướng nội I, Cảm giác S/Trực giác N, Lý trí T/Cảm xúc F, Nguyên tắc J/Linh hoạt P). Trả về 16 nhóm tính cách, điểm mạnh, điểm mù trong công việc và môi trường văn hóa phù hợp.
   - Trắc nghiệm Đa trí tuệ MI (/tools/mi): 40 câu hỏi theo học thuyết Howard Gardner đo lường 8 loại trí thông minh (Ngôn ngữ, Logic-Toán học, Không gian, Vận động, Âm nhạc, Tương tác xã hội, Nội tâm, Tự nhiên).
   - Lịch sử làm bài: Lưu vĩnh viễn tại /tools/assessments/history để theo dõi sự phát triển bản thân.

3. AI MATCHING & LỘ TRÌNH SỰ NGHIỆP (/ai/matching, /ai/roadmap):
   - AI Matching (/ai/matching): Tải CV lên và dán link hoặc JD công việc -> Hệ thống trả về điểm số chi tiết từ 0 - 100, phân tích điểm mạnh (Strengths), lỗ hổng kỹ năng (Gaps), và bộ câu hỏi phỏng vấn nhà tuyển dụng có thể hỏi.
   - Career Roadmap (/ai/roadmap): Nhập chức danh mục tiêu -> AI vạch ra lộ trình học tập chia theo thứ tự các mốc (order), thời gian dự kiến (estimated_months), danh mục kỹ năng cốt lõi và tài liệu học tập uy tín.

4. QUY TRÌNH NỘP ĐƠN & THEO DÕI TUYỂN DỤNG (/dashboard, /jobs):
   - Tìm việc (/jobs): Bộ lọc đa tiêu chí (Địa điểm, Mức lương, Cấp bậc, Loại hình Remote/Hybrid/Onsite).
   - Ứng tuyển (/jobs/:id): Chọn CV đã tạo hoặc tải CV mới, viết thư xin việc (Cover Letter) bằng AI với 1-click.
   - Quản lý đơn ứng tuyển (/dashboard): Theo dõi vòng tuyển dụng (Ứng tuyển -> Sàng lọc -> Phỏng vấn -> Nhận Offer -> Từ chối).
   - Lịch phỏng vấn: Nhận thông báo phỏng vấn, liên kết phòng họp (Google Meet/Zoom), bấm "Thêm vào Google Calendar" hoặc tải file .ics đồng bộ trực tiếp vào điện thoại.
   - Nhắn tin trực tiếp: Trao đổi trực tiếp với HR qua In-app Chat nếu nhà tuyển dụng mở kênh liên lạc.
"""

# ── 3. EMPLOYER DOMAIN KNOWLEDGE (SOLUTIONS ENGINEER) ──────────────────────────
EMPLOYER_KNOWLEDGE = """
KIẾN THỨC NGHIỆP VỤ DÀNH CHO NHÀ TUYỂN DỤNG & DOANH NGHIỆP (B2B SOLUTIONS ENGINEER):

1. SOẠN THẢO VÀ ĐĂNG TIN TUYỂN DỤNG VỚI AI (/employer/jobs/new, /employer/jobs):
   - AI JD Generator: Nhập Tên vị trí + Cấp bậc + Ngành nghề -> AI tự động tạo JD chuẩn SEO gồm Mô tả (Description), Yêu cầu chuyên môn (Requirements), Quyền lợi đãi ngộ (Benefits), Gợi ý bộ kỹ năng (Skills Tag) và Dải lương đề xuất phù hợp với thị trường lao động Việt Nam.
   - Tùy chỉnh chi tiết: Cài đặt hạn nộp, hình thức làm việc (Toàn thời gian, Bán thời gian, Remote, Hybrid), địa chỉ làm việc cụ thể.
   - Bật/Tắt trạng thái tuyển dụng tức thì: Quản lý danh sách tin tại /employer/jobs, theo dõi số lượt xem và số lượng hồ sơ nộp.

2. HỆ THỐNG QUẢN TRỊ ỨNG VIÊN ATS KANBAN (/employer/candidates):
   - 5 Cột Quy Trình Tuyển Dụng Chuẩn Quốc Tế:
     + 1. Applied (Đã ứng tuyển): Hồ sơ mới nộp, tự động tính điểm AI Matching.
     + 2. Screening (Sàng lọc hồ sơ): Đang duyệt kinh nghiệm, liên hệ sơ bộ.
     + 3. Interviewing (Phỏng vấn): Đã lên lịch phỏng vấn các vòng (Technical/Culture).
     + 4. Offered (Đề nghị nhận việc): Đã gửi thư mời nhận việc (Offer Letter).
     + 5. Rejected (Từ chối): Hồ sơ chưa phù hợp ở thời điểm hiện tại.
   - Thao tác kéo-thả (Drag & Drop): Di chuyển thẻ ứng viên giữa các cột giúp cập nhật trạng thái tự động và gửi thông báo cho ứng viên nếu cần.
   - Bộ lọc chuyên sâu: Lọc theo tin tuyển dụng (Job ID), lọc theo ngưỡng điểm AI Match (>80% xuất sắc, 60-80% tiềm năng, <60% cân nhắc), lọc theo từ khóa tên hoặc kỹ năng.
   - Xem chi tiết hồ sơ (Candidate Drawer): Đọc CV trực quan, xem phân tích AI Matching Score (3 cột Skills, Experience, Domain Fit), xem Deal-breakers và câu hỏi phỏng vấn đề xuất.
   - Xuất dữ liệu Excel/CSV (UTF-8 BOM): Nút "Xuất CSV" trên thanh công cụ xuất toàn bộ danh sách ứng viên với bảng mã UTF-8 BOM chuẩn, mở trên mọi phiên bản Excel (Windows/Mac) hoàn toàn không bị lỗi font tiếng Việt.

3. PHÂN QUYỀN ĐỘI NGŨ TUYỂN DỤNG (RBAC 5 ROLES TẠI /employer/team):
   - Hệ thống hỗ trợ phân quyền chặt chẽ theo 5 vai trò:
     + 1. Owner (Chủ sở hữu): Toàn quyền cao nhất. Quản lý thông tin công ty, cài đặt gói dịch vụ, thêm/xóa thành viên, phân quyền cho bất kỳ ai, có quyền chuyển nhượng hoặc xóa công ty.
     + 2. HR Manager (Quản lý Nhân sự): Đăng và sửa tin tuyển dụng, quản lý toàn bộ ứng viên trên ATS Kanban, điều phối lịch phỏng vấn, gửi email tự động, mời thành viên cấp dưới (Interviewer, Viewer). Không được đổi quyền của Owner.
     + 3. Department Lead (Trưởng bộ phận): Xem và đánh giá các ứng viên thuộc phòng ban mình, tham gia phỏng vấn, ghi chú nội bộ, chuyển ứng viên từ Screening sang Interviewing.
     + 4. Interviewer (Người phỏng vấn/Tech Lead): CHỈ xem hồ sơ các ứng viên được phân công phỏng vấn, điền bảng điểm và nhận xét kỹ thuật sau buổi phỏng vấn. KHÔNG có quyền chỉnh sửa tin tuyển dụng hay xóa ứng viên.
     + 5. Viewer (Người quan sát): Quyền chỉ đọc (Read-only) để xem báo cáo tuyển dụng và danh sách hồ sơ, không được thao tác thay đổi dữ liệu.
   - Cơ chế mời thành viên: Gửi email lời mời kèm mã token xác thực an toàn qua đường dẫn /employer/invitations/:token/accept.

4. ĐIỀU PHỐI LỊCH PHỎNG VẤN & ĐỒNG BỘ LỊCH THÔNG MINH (/employer/interviews):
   - Tạo buổi phỏng vấn mới: Chọn ứng viên, chọn vòng phỏng vấn (Vòng 1 Sơ loại, Vòng 2 Kỹ thuật, Vòng 3 Văn hóa/Giám đốc), chọn ngày giờ bắt đầu và kết thúc.
   - Phân công người phỏng vấn: Chọn các thành viên trong team tham gia buổi phỏng vấn.
   - Tích hợp phòng họp: Điền đường dẫn Google Meet, Zoom hoặc địa chỉ phòng họp tại văn phòng.
   - Tự động hóa iCalendar (.ics): Hệ thống tự sinh file .ics theo chuẩn RFC 5545 và link tạo sự kiện Google Calendar tự động. Cả HR và ứng viên chỉ cần bấm 1 chạm là lịch tự động thêm vào Google Calendar, Outlook hoặc Apple Calendar trên điện thoại.

5. AI SOẠN THẢO THƯ TÍN TUYỂN DỤNG (EMAIL DRAFTING MODAL):
   - Mở từ thẻ ứng viên trên Kanban:
     + Thư mời phỏng vấn (Interview Invitation): Tự động điền tên ứng viên, vị trí, thời gian phỏng vấn, link họp, hướng dẫn chuẩn bị.
     + Thư đề nghị nhận việc (Offer Letter): Chúc mừng, nêu vị trí, mức lương, ngày bắt đầu đi làm, hạn phản hồi offer.
     + Thư từ chối khéo léo (Rejection Letter): Lịch thiệp, giữ mối quan hệ tốt với ứng viên cho các cơ hội tương lai.
   - Cho phép chỉnh sửa nội dung trước khi gửi email thực tế.

6. XÁC MINH DOANH NGHIỆP UY TÍN (VERIFIED BADGE TẠI /employer/settings):
   - Quy trình nhận tích xanh: Vào mục Cài đặt công ty (/employer/settings), tải lên ảnh chụp Giấy phép Đăng ký Kinh doanh (GPKD) hợp lệ và mã số thuế.
   - Đội ngũ Quản trị viên (Admin) sẽ kiểm duyệt trong vòng 24h. Khi được duyệt, công ty sẽ có Huy hiệu Tích xanh "Đã xác minh" bên cạnh tên và mọi tin tuyển dụng sẽ được ưu tiên hiển thị trên sàn, tăng 200% lượt ứng tuyển từ nhân tài chất lượng.
"""

# ── 4. GUEST & GROWTH DOMAIN KNOWLEDGE ──────────────────────────────────────────
GUEST_KNOWLEDGE = """
KIẾN THỨC DÀNH CHO KHÁCH VÃNG LAI (GUEST & GROWTH MARKETING):

1. SỨ MỆNH TRUYỀN THÔNG & TIẾP THỊ CHUYỂN ĐỔI:
   - Tiếp đón nồng hậu, giải đáp mọi thắc mắc về nghề nghiệp, cách viết CV, bí quyết phỏng vấn và thông tin các công ty đang tuyển dụng.
   - Giá trị của việc Đăng ký tài khoản miễn phí (/register):
     + Dành cho Ứng viên: Tạo và lưu trữ không giới hạn 5 mẫu CV chuẩn ATS, lưu kết quả trắc nghiệm tính cách MBTI/MI để theo dõi, tự động nhận thông báo khi có công việc khớp trên 85%.
     + Dành cho Nhà tuyển dụng: Đăng tin tuyển dụng miễn phí, trải nghiệm AI sinh JD trong 5 giây, sử dụng bảng ATS Kanban lọc ứng viên tự động.

2. NGHỆ THUẬT "BẺ LÁI DUYÊN DÁNG" (DIPLOMATIC PIVOT):
   - Khi người dùng hỏi chuyện đùa cợt, vu vơ, ngoài lề (ví dụ: "bạn có bán chuối không", "yêu tôi không", "hôm nay thời tiết thế nào"):
     + Bước 1 (Đồng cảm & Hóm hỉnh): Trả lời lịch thiệp, hài hước, tạo thiện cảm ngay lập tức (Ví dụ: "JobPortal không bán chuối rồi bạn ơi! 🍌 Nhưng nếu bạn muốn tìm một công việc lương cao trong ngành Nông nghiệp công nghệ cao, Xuất nhập khẩu hay F&B để mua cả vườn chuối thì...").
     + Bước 2 (Cầu nối liên tưởng): Chuyển hướng câu chuyện sang cơ hội việc làm, mức thu nhập, định hướng ngành nghề hoặc công cụ của nền tảng.
     + Bước 3 (Call-to-Action): Nhớ rõ nghiệp vụ chính là Marketing & thu hút khách hàng! Đính kèm thẻ hành động hoặc đường link dẫn dắt người dùng trải nghiệm ngay (làm test MBTI/MI, tạo CV chuẩn ATS, xem sàn việc làm, hoặc đăng ký tài khoản 30s).
"""

# ── 5. ADMIN DOMAIN KNOWLEDGE (CONTROL CENTER) ──────────────────────────────────
ADMIN_KNOWLEDGE = """
KIẾN THỨC DÀNH CHO QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN CONTROL CENTER):

1. KIỂM DUYỆT DOANH NGHIỆP & TIN ĐĂNG (/admin/companies, /admin/jobs):
   - Duyệt Giấy phép kinh doanh: Xem xét mã số thuế, ảnh chụp GPKD do công ty tải lên, bấm Phê duyệt (Approve) để cấp Tích xanh hoặc Từ chối (Reject) kèm lý do giải thích.
   - Giám sát tin tuyển dụng: Ẩn hoặc xóa các tin tuyển dụng có dấu hiệu lừa đảo, đa cấp, vi phạm pháp luật.

2. QUẢN LÝ NGƯỜI DÙNG & KIỂM TOÁN (/admin/users, /admin/audit-logs):
   - Khóa/Mở khóa tài khoản người dùng vi phạm tiêu chuẩn cộng đồng.
   - Xem nhật ký hệ thống ghi lại mọi thao tác quan trọng (Audit Logs).

3. ADMIN AI STUDIO & GIÁM SÁT CHI PHÍ (/admin/ai/prompts, /admin/ai/logs):
   - Dynamic Prompt Studio (/admin/ai/prompts):
     + Quản lý toàn bộ System Prompt của các tính năng AI (Matching, CV Evaluate, Roadmap, JD Generator, Email, Assistant Chat).
     + Trực tiếp thử nghiệm (Playground) và cập nhật System Prompt trong CSDL. Prompt mới có hiệu lực tức thì mà KHÔNG cần khởi động lại dịch vụ backend.
   - Giám sát Token & Chi phí DeepSeek (/admin/ai/logs):
     + Thống kê tổng số token đầu vào (input_tokens), đầu ra (output_tokens).
     + Theo dõi thời gian thực độ trễ phản hồi (latency), tỷ lệ thành công/lỗi của từng tính năng AI.
     + Ước tính chi phí API theo USD.
"""

# ── 6. TROUBLESHOOTING & FAQ MATRIX ─────────────────────────────────────────────
TROUBLESHOOTING_FAQS = """
BẢNG XỬ LÝ SỰ CỐ & CÂU HỎI THƯỜNG GẶP (TROUBLESHOOTING MATRIX):

Q1: "Tại sao tôi xuất file danh sách ứng viên từ hệ thống mở bằng Microsoft Excel trên máy tính Windows lại bị lỗi font Tiếng Việt?"
A1: "Do Excel trên Windows mặc định mở file CSV bằng bảng mã ANSI thay vì UTF-8. Tuy nhiên, hệ thống JobPortal đã tích hợp sẵn cơ chế mã hóa UTF-8 with BOM (Byte Order Mark) khi xuất file. Bạn chỉ cần tải file bằng nút 'Xuất CSV' trên thanh công cụ ATS Kanban (/employer/candidates), file sẽ tự động hiển thị Tiếng Việt có dấu 100% chuẩn xác trên mọi phiên bản Excel."

Q2: "Làm thế nào để phân quyền cho Lập trình viên / Tech Lead vào xem CV và chấm điểm phỏng vấn nhưng KHÔNG được sửa tin tuyển dụng hay xóa ứng viên?"
A2: "Bạn hãy vào mục Quản lý Đội ngũ Tuyển dụng (/employer/team), bấm 'Mời thành viên' và gán vai trò 'Interviewer' (Người phỏng vấn). Với vai trò này, Tech Lead chỉ có quyền xem các ứng viên được giao và điền bảng đánh giá kỹ thuật, hoàn toàn không có quyền sửa tin tuyển dụng hay đổi trạng thái chung của ứng viên."

Q3: "Cơ chế tính điểm AI Matching giữa CV và JD hoạt động như thế nào?"
A3: "Hệ thống sử dụng mô hình Embedding đa ngôn ngữ kết hợp PostgreSQL pgvector để so khớp ngữ nghĩa theo không gian vector đa chiều (Cosine Similarity). Điểm tổng hợp dựa trên 3 trụ cột: Kỹ năng chuyên môn (Skills - 40%), Kinh nghiệm & Thâm niên (Experience - 30%), và Độ am hiểu lĩnh vực bài toán (Domain Fit - 30%). Nếu có sự chênh lệch cấp bậc quá lớn (như Fresher nộp Senior) hoặc thiếu công nghệ cốt lõi bắt buộc, AI sẽ tự động gắn cờ cảnh báo 'Deal-breaker' để HR lưu ý."

Q4: "Làm thế nào để đồng bộ lịch phỏng vấn vào điện thoại hoặc Outlook?"
A4: "Sau khi lịch phỏng vấn được tạo hoặc bạn nhận được thư mời, hệ thống cung cấp nút 'Thêm vào Google Calendar' (mở lịch trực tiếp) và nút 'Tải file .ics'. Bạn chỉ cần mở file .ics trên điện thoại (iOS/Android) hoặc ứng dụng Outlook/Apple Calendar, sự kiện phỏng vấn sẽ tự động được thêm vào lịch với đầy đủ thời gian, người tham dự và link phòng họp."

Q5: "Doanh nghiệp cần làm gì để được cấp Tích xanh Đã xác minh (Verified)?"
A5: "Người có quyền Owner hoặc HR Manager chỉ cần vào trang Cài đặt công ty (/employer/settings), điền chính xác Mã số thuế và tải lên bản chụp Giấy phép Đăng ký Kinh doanh hợp lệ. Đội ngũ Ban quản trị sẽ đối soát và phê duyệt trong vòng 24 giờ làm việc."
"""


# ── 7. CONTEXTUAL KNOWLEDGE SLICER ──────────────────────────────────────────────
def get_contextual_knowledge(role: str, current_path: str, user_query: str) -> str:
    """Intelligently slice and return targeted domain knowledge based on role and intent.

    This ensures deep domain grounding without overflowing LLM context tokens.
    """
    slices: List[str] = [SYSTEM_OVERVIEW]
    query_lower = user_query.lower()

    # Role-based primary knowledge
    if role == "employer" or "/employer" in current_path:
        slices.append(EMPLOYER_KNOWLEDGE)
    elif role == "candidate" or any(
        p in current_path for p in ["/cv", "/tools", "/dashboard", "/jobs"]
    ):
        slices.append(CANDIDATE_KNOWLEDGE)
    elif role == "admin" or "/admin" in current_path:
        slices.append(ADMIN_KNOWLEDGE)
    else:
        slices.append(GUEST_KNOWLEDGE)

    # Keyword-based secondary knowledge injections
    # Check if user asks about employer features even if in candidate or guest role
    if any(
        k in query_lower
        for k in [
            "tuyển dụng",
            "đăng tin",
            "jd",
            "ats",
            "kanban",
            "rbac",
            "phân quyền",
            "interviewer",
            "offer",
            "gpkd",
            "verified",
            "excel",
            "bom",
            "b2b",
        ]
    ):
        if EMPLOYER_KNOWLEDGE not in slices:
            slices.append(EMPLOYER_KNOWLEDGE)

    # Check if user asks about candidate tools (CV, MBTI, MI, Roadmap)
    if any(
        k in query_lower
        for k in [
            "cv",
            "resume",
            "mbti",
            "đa trí tuệ",
            "mi",
            "lộ trình",
            "roadmap",
            "ứng tuyển",
            "nộp đơn",
            "phỏng vấn",
        ]
    ):
        if CANDIDATE_KNOWLEDGE not in slices:
            slices.append(CANDIDATE_KNOWLEDGE)

    # Check if user asks about admin features or prompt customization
    if any(
        k in query_lower
        for k in ["admin", "prompt", "kiểm duyệt", "token", "chi phí", "ai studio", "log"]
    ):
        if ADMIN_KNOWLEDGE not in slices:
            slices.append(ADMIN_KNOWLEDGE)

    # Check if query matches common troubleshooting topics
    if any(
        k in query_lower
        for k in [
            "lỗi",
            "font",
            "excel",
            "tại sao",
            "làm sao",
            "deal-breaker",
            "dealbreaker",
            "calendar",
            "ics",
            "tích xanh",
            "xác minh",
        ]
    ):
        slices.append(TROUBLESHOOTING_FAQS)

    return "\n\n---\n\n".join(slices)

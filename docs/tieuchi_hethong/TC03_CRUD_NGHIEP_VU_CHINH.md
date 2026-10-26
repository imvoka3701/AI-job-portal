# TIÊU CHÍ 03: HOÀN THIỆN CRUD NGHIỆP VỤ CHÍNH
## DỰ ÁN: AI-POWERED JOB PORTAL (NỀN TẢNG TUYỂN DỤNG THÔNG MINH B2B)

---

### 1. YÊU CẦU TIÊU CHÍ
> **Tiêu chuẩn:** Hệ thống hoàn thiện đầy đủ các chức năng Thêm (Create), Xem/Đọc (Read), Sửa (Update), Xóa (Delete) cho các thực thể dữ liệu nghiệp vụ cốt lõi; hoạt động chính xác, đảm bảo tính toàn vẹn dữ liệu và kiểm soát các ràng buộc quan hệ trong CSDL.

---

### 2. SƠ ĐỒ THỰC THỂ QUAN HỆ CƠ SỞ DỮ LIỆU (ENTITY-RELATIONSHIP DIAGRAM - ERD)

Toàn bộ mô hình dữ liệu quan hệ của dự án được thiết kế chặt chẽ với các khóa ngoại, quan hệ 1-N và các bảng liên kết nghiệp vụ:

```mermaid
erDiagram
    USERS ||--o{ JOBS : "employer_creates"
    USERS ||--o{ RESUMES : "candidate_uploads"
    USERS ||--o{ CV_DOCUMENTS : "candidate_builds"
    USERS ||--o{ APPLICATIONS : "candidate_submits"
    
    COMPANIES ||--o{ JOBS : "company_publishes"
    COMPANIES ||--o{ USERS : "employs_staff"

    JOBS ||--o{ APPLICATIONS : "receives"
    JOBS ||--o{ DOCUMENT_CHUNKS : "rag_indexed"

    RESUMES ||--o{ APPLICATIONS : "attached_to"
    RESUMES ||--o{ DOCUMENT_CHUNKS : "rag_indexed"

    CV_DOCUMENTS ||--o{ APPLICATIONS : "builder_attached_to"
    CV_DOCUMENTS ||--o{ DOCUMENT_CHUNKS : "rag_indexed"

    APPLICATIONS ||--o{ INTERVIEW_ROUNDS : "spawns_stages"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role "CANDIDATE, EMPLOYER, ADMIN, SUPERADMIN"
        int company_id FK
        int token_version
        boolean is_active
    }

    COMPANIES {
        int id PK
        string name UK
        string description
        string logo_url
        string website
        string size
    }

    JOBS {
        int id PK
        int company_id FK "ondelete CASCADE"
        int employer_id FK
        string title
        text description
        text requirements
        int salary_min
        int salary_max
        string job_type "full_time, part_time, remote..."
        string experience_level "junior, mid, senior..."
        vector embedding "MiniLM 384 dim"
        boolean is_active
    }

    RESUMES {
        int id PK
        int candidate_id FK "ondelete CASCADE"
        string file_path
        text raw_text
        vector embedding "384 dim"
        datetime created_at
    }

    CV_DOCUMENTS {
        int id PK
        int user_id FK "ondelete CASCADE"
        string title
        jsonb content_json "personal, skills, exp, edu"
        datetime updated_at
    }

    APPLICATIONS {
        int id PK
        int job_id FK "ondelete CASCADE"
        int candidate_id FK "ondelete CASCADE"
        int resume_id FK "ondelete SET NULL"
        int cv_document_id FK "ondelete SET NULL"
        string status "pending, reviewing, interviewed, accepted, rejected"
        float ai_score "AI Matching 0-100"
        jsonb ai_analysis "3 trục, strengths, gaps, deal_breakers"
        datetime applied_at
    }

    INTERVIEW_ROUNDS {
        int id PK
        int application_id FK "ondelete CASCADE"
        int round_number
        string round_type "screening, technical, culture_fit"
        string status "scheduled, passed, failed"
        datetime scheduled_at
    }

    DOCUMENT_CHUNKS {
        int id PK
        string document_type "job, resume, cv_document"
        int document_id
        int company_id FK
        text chunk_text
        vector embedding "384 dim (HNSW Index)"
    }
```

---

### 3. SƠ ĐỒ MÁY TRẠNG THÁI VÒNG ĐỜI ĐƠN ỨNG TUYỂN (STATE MACHINE DIAGRAM)

Luồng chuyển đổi trạng thái hồ sơ tuyển dụng tuân thủ nguyên tắc **Human-in-the-Loop** và chống nộp trùng lặp:

```mermaid
stateDiagram-v2
    [*] --> PENDING: Ứng viên nộp hồ sơ (Pre-check UniqueConstraint)
    
    state PENDING {
        [*] --> KhoiTao
        KhoiTao --> ChoTiepNhan: Tự động tạo Round 1 & Gửi thông báo
    }

    PENDING --> WITHDRAWN: Ứng viên tự rút đơn (Chỉ khi còn Pending)
    WITHDRAWN --> [*]: Kết thúc luồng

    PENDING --> REVIEWING: HR mở xem & chạy AI Matching 3 trục

    state REVIEWING {
        [*] --> ChamDiem
        ChamDiem --> DanhGiaRubric: Radar Chart + Phát hiện Deal-breakers
    }

    REVIEWING --> REJECTED: HR gửi Thư cảm ơn (AI soạn email chuẩn mực)
    
    REVIEWING --> INTERVIEWED: HR chuyển vòng phỏng vấn (AI sinh câu hỏi kỹ thuật)

    state INTERVIEWED {
        [*] --> PhognVanVong1
        PhognVanVong1 --> PhongVanChuyenSau: Lưu kết quả vào Interview Rounds
    }

    INTERVIEWED --> REJECTED: Ứng viên không đạt yêu cầu chuyên môn
    INTERVIEWED --> ACCEPTED: Ứng viên vượt qua tất cả các vòng (Gửi Thư mời nhận việc - Offer)

    ACCEPTED --> [*]: Hoàn tất tuyển dụng
    REJECTED --> [*]: Lưu trữ hồ sơ vào Talent Pool
```

---

### 4. TỔNG QUAN 4 PHÂN HỆ CRUD NGHIỆP VỤ CỐT LÕI

| Phân hệ CRUD | Router phụ trách | Bảng CSDL chính | Chức năng chi tiết (C - R - U - D) |
| :--- | :--- | :--- | :--- |
| **1. Tin tuyển dụng** | `app/routers/jobs.py` | `jobs` | **C:** Đăng tin mới kèm sinh vector embedding<br>**R:** Xem danh sách phân trang, xem chi tiết tin<br>**U:** Sửa yêu cầu, mô tả, khoảng lương, cấp bậc<br>**D:** Đóng tin hoặc xóa vĩnh viễn (xóa kèm vector chunks) |
| **2. Hồ sơ CV Builder**| `app/routers/cv_documents.py`<br>`app/routers/resumes.py` | `cv_documents`<br>`resumes` | **C:** Khởi tạo CV Builder JSON hoặc upload PDF<br>**R:** Xem danh sách CV của tôi, xem chi tiết từng CV<br>**U:** Cập nhật các trường: Kỹ năng, Học vấn, Kinh nghiệm<br>**D:** Xóa bản nháp CV Builder hoặc xóa file PDF |
| **3. Đơn ứng tuyển** | `app/routers/applications.py`| `applications` | **C:** Ứng tuyển vào vị trí (Chống spam duplicate)<br>**R:** Ứng viên xem lịch sử nộp; HR xem ứng viên theo Job<br>**U:** HR cập nhật trạng thái (Pending ➔ Interview ➔ Accept)<br>**D:** Ứng viên rút hồ sơ khi đơn còn ở trạng thái Pending |
| **4. Doanh nghiệp** | `app/routers/companies.py` | `companies` | **C:** Tạo hồ sơ công ty khi Employer đăng ký<br>**R:** Tra cứu danh sách công ty, trang giới thiệu công ty<br>**U:** Cập nhật logo, website, quy mô nhân sự, địa chỉ<br>**D:** Admin xóa hoặc khóa doanh nghiệp vi phạm |

---

### 5. CHI TIẾT TRIỂN KHAI VÀ MÃ NGUỒN CÁC CỤM CRUD

#### A. Cụm 1: Quản lý Tin tuyển dụng (Jobs CRUD)
*File mã nguồn:* [backend/app/routers/jobs.py](file:///d:/ai-job-portal/backend/app/routers/jobs.py)

1. **Create (`POST /jobs`):**
   * Nhà tuyển dụng tạo tin đăng mới với thông tin: `title`, `description`, `requirements`, `salary_min`, `salary_max`, `job_type`, `experience_level`.
   * Tự động sinh Vector Embedding 384 chiều (`generate_embedding`) lưu vào cột `jobs.embedding` để phục vụ AI Matching.
2. **Read (`GET /jobs` & `GET /jobs/{id}`):**
   * Hỗ trợ phân trang chuẩn mực: `page=1`, `page_size=20`.
   * Trả về danh sách việc làm đang mở kèm thông tin công ty liên kết.
3. **Update (`PUT /jobs/{id}`):**
   * Cho phép sửa đổi nội dung. Nếu tiêu đề hoặc yêu cầu thay đổi, hệ thống kích hoạt Background Task tính toán lại vector embedding.
4. **Delete (`DELETE /jobs/{id}`):**
   * Xóa sạch các phân mảnh vector trong bảng `document_chunks` liên quan đến Job đó và xóa bản ghi tin tuyển dụng khỏi CSDL.

#### B. Cụm 2: Quản lý Hồ sơ CV Builder (Resumes & CV Documents CRUD)
*File mã nguồn:* [backend/app/routers/cv_documents.py](file:///d:/ai-job-portal/backend/app/routers/cv_documents.py)

1. **Create (`POST /cv-documents`):**
   * Lưu trữ hồ sơ ứng viên dưới dạng cấu trúc JSON linh hoạt: `personal`, `skills`, `experience`, `education`, `projects`.
2. **Read (`GET /cv-documents`):**
   * Trả về danh sách các phiên bản CV mà ứng viên đã khởi tạo.
3. **Update (`PUT /cv-documents/{id}`):**
   * Cập nhật thời gian thực khi người dùng gõ trên giao diện CV Builder, lưu lại lịch sử cập nhật.
4. **Delete (`DELETE /cv-documents/{id}`):**
   * Xóa hồ sơ CV Builder. CSDL tự động gán `applications.cv_document_id = NULL` nhờ cấu hình `ondelete="SET NULL"` mà không làm mất lịch sử ứng tuyển.

#### C. Cụm 3: Quản lý Đơn ứng tuyển (Applications CRUD)
*File mã nguồn:* [backend/app/routers/applications.py](file:///d:/ai-job-portal/backend/app/routers/applications.py)

*Đoạn mã Create Application có cơ chế bảo vệ toàn vẹn dữ liệu:*
```python
@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Ràng buộc chống nộp trùng lặp (Pre-check)
    existing_app = (
        db.query(Application)
        .filter(Application.job_id == payload.job_id, Application.candidate_id == current_user.id)
        .first()
    )
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bạn đã nộp hồ sơ ứng tuyển cho vị trí này trước đó. Không thể nộp lại nhiều lần.",
        )

    # 2. Tạo đơn ứng tuyển mới và liên kết hồ sơ
    new_app = Application(
        job_id=payload.job_id,
        candidate_id=current_user.id,
        resume_id=payload.resume_id,
        cv_document_id=payload.cv_document_id,
        cover_letter=payload.cover_letter,
        status=ApplicationStatus.PENDING,
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app
```

---

### 6. BẢO TOÀN RÀNG BUỘC TOÀN VẸN CƠ SỞ DỮ LIỆU (DATABASE INTEGRITY)

* **Ràng buộc khóa ngoại an toàn:**
  * `jobs.company_id` liên kết `companies.id` với `ondelete="CASCADE"`: Xóa công ty sẽ dọn dẹp các tin tuyển dụng liên quan.
  * `applications.job_id` liên kết `jobs.id` với `ondelete="CASCADE"`.
  * `applications.candidate_id` liên kết `users.id` với `ondelete="CASCADE"`.
  * `applications.resume_id` liên kết `resumes.id` với `ondelete="SET NULL"`: Ứng viên xóa CV cũ không làm mất lịch sử các đơn đã nộp.
* **Ràng buộc duy nhất cấp độ CSDL:**
  * `UniqueConstraint("job_id", "candidate_id", name="uq_application_job_candidate")` đảm bảo tuyệt đối không có 2 đơn ứng tuyển trùng lặp từ cùng một người vào cùng một vị trí.

---

### 7. KẾT LUẬN TIÊU CHÍ 03
* Hoàn thiện 100% chức năng CRUD cho cả 4 thực thể dữ liệu quan trọng nhất của hệ thống B2B.
* Có sơ đồ ERD trực quan chi tiết từng trường dữ liệu, khóa chính, khóa ngoại và quan hệ.
* Sơ đồ máy trạng thái (State Machine) phân định rõ luồng di chuyển của đơn ứng tuyển.
* **Mức độ đáp ứng:** **100% - ĐẠT XUẤT SẮC**.

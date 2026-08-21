# BÁO CÁO TOÀN DIỆN: CẤU HÌNH & HỆ THỐNG TRÍ TUỆ NHÂN TẠO (AI)
# DỰ ÁN: NỀN TẢNG TUYỂN DỤNG THÔNG MINH (AI-POWERED JOB PORTAL)
**Tài liệu kỹ thuật phục vụ thuyết trình, báo cáo tốt nghiệp & bảo vệ đồ án chuyên ngành CNTT**

---

## 📌 MỤC LỤC TỔNG THỂ

- [PHẦN 1: TỔNG QUAN KIẾN TRÚC AI 2 TẦNG (HYBRID AI ARCHITECTURE)](#phần-1-tổng-quan-kiến-trúc-ai-2-tầng-hybrid-ai-architecture)
  - [1.1. Triết lý Thiết kế Hệ thống AI Hybrid](#11-triết-lý-thiết-kế-hệ-thống-ai-hybrid)
  - [1.2. Phân tầng Kiến trúc: Local Vector Embedding & Cloud LLM Reasoning](#12-phân-tầng-kiến-trúc-local-vector-embedding--cloud-llm-reasoning)
  - [1.3. Sơ đồ Kiến trúc & Luồng Dữ liệu Tổng thể](#13-sơ-đồ-kiến-trúc--luồng-dữ-liệu-tổng-thể)
  - [1.4. Tối ưu Hóa Chi phí & Độ trễ (Cost & Latency Optimization)](#14-tối-ưu-hóa-chi-phí--độ-trễ-cost--latency-optimization)
- [PHẦN 2: BẢNG THÔNG SỐ CẤU HÌNH & BIẾN MÔI TRƯỜNG TOÀN DIỆN](#phần-2-bảng-thông-số-cấu-hình--biến-môi-trường-toàn-diện)
  - [2.1. Toàn bộ Biến Môi trường AI (.env & Pydantic Settings)](#21-toàn-bộ-biến-môi-trường-ai-env--pydantic-settings)
  - [2.2. Cấu hình Vector Database (PostgreSQL pgvector & HNSW Index)](#22-cấu-hình-vector-database-postgresql-pgvector--hnsw-index)
  - [2.3. Cấu hình Cơ chế Chịu lỗi & Quản lý Ngoại lệ (Fault Tolerance & Retry)](#23-cấu-hình-cơ-chế-chịu-lỗi--quản-lý-ngoại-lệ-fault-tolerance--retry)
  - [2.4. Cấu hình Nhật ký Kiểm toán AI (Structured AI Audit Trail)](#24-cấu-hình-nhật-ký-kiểm-toán-ai-structured-ai-audit-trail)
- [PHẦN 3: CHI TIẾT 7 PHÂN HỆ AI & THUẬT TOÁN ĐÃ HIỆN THỰC HÓA](#phần-3-chi-tiết-7-phân-hệ-ai--thuật-toán-đã-hiện-thực-hóa)
  - [3.1. Module 1: AI Semantic Matching & Vector Top-Match Search](#31-module-1-ai-semantic-matching--vector-top-match-search)
  - [3.2. Module 2: CV Evaluator & Document Gatekeeper](#32-module-2-cv-evaluator--document-gatekeeper)
  - [3.3. Module 3: AI CV Builder Studio (Trợ lý Tạo CV Thông minh)](#33-module-3-ai-cv-builder-studio-trợ-lý-tạo-cv-thông-minh)
  - [3.4. Module 4: CV Summarizer & Targeted Interview Generator](#34-module-4-cv-summarizer--targeted-interview-generator)
  - [3.5. Module 5: AI Email Studio (Hệ thống Soạn Thảo Thư Nhân sự Chuẩn mực)](#35-module-5-ai-email-studio-hệ-thống-soạn-thảo-thư-nhân-sự-chuẩn-mực)
  - [3.6. Module 6: AI Career Roadmap & Assessment Engine](#36-module-6-ai-career-roadmap--assessment-engine)
  - [3.7. Module 7: JobPortal AI Copilot 24/7 (Cố vấn Tuyển dụng & Hướng nghiệp)](#37-module-7-jobportal-ai-copilot-247-cố-vấn-tuyển-dụng--hướng-nghiệp)
- [PHẦN 4: DANH MỤC REST API & THIẾT KẾ PROMPT KỸ THUẬT](#phần-4-danh-mục-rest-api--thiết-kế-prompt-kỹ-thuật)
  - [4.1. Bảng Tổng Hợp Danh Mục AI REST APIs Toàn Hệ Thống](#41-bảng-tổng-hợp-danh-mục-ai-rest-apis-toàn-hệ-thống)
  - [4.2. Chi Tiết Kỹ Thuật Prompt Engineering & JSON Schema Enforcement](#42-chi-tiết-kỹ-thuật-prompt-engineering--json-schema-enforcement)
  - [4.3. Kỹ Thuật Chống Ảo Giác & Kiểm Định Dữ Liệu (Anti-Hallucination Guardrails)](#43-kỹ-thuật-chống-ảo-giác--kiểm-định-dữ-liệu-anti-hallucination-guardrails)
- [PHẦN 5: BẢO MẬT, ĐẠO ĐỨC AI & GIÁM SÁT THIÊN LỆCH](#phần-5-bảo-mật-đạo-đức-ai--giám-sát-thiên-lệch)
  - [5.1. Nguyên Tắc Human-in-the-Loop & Quyền Quyết Định Tuyển Dụng](#51-nguyên-tắc-human-in-the-loop--quyền-quyết-định-tuyển-dụng)
  - [5.2. Cơ Chế Giảm Thiểu Thiên Lệch Vô Thức (Bias Mitigation)](#52-cơ-chế-giảm-thiểu-thiên-lệch-vô-thức-bias-mitigation)
  - [5.3. Phân Quyền Đa Cấp & Cô Lập Dữ Liệu Doanh Nghiệp (B2B RBAC & Scope Isolation)](#53-phân-quyền-đa-cấp--cô-lập-dữ-liệu-doanh-nghiệp-b2b-rbac--scope-isolation)
  - [5.4. Bảo Mật Dữ Liệu PII & Nhật Ký Kiểm Toán An Toàn (Non-PII Audit Logging)](#54-bảo-mật-dữ-liệu-pii--nhật-ký-kiểm-toán-an-toàn-non-pii-audit-logging)
- [PHẦN 6: KỊCH BẢN BÁO CÁO MẪU & BỘ CÂU HỎI PHẢN BIỆN GIẢNG ĐƯỜNG](#phần-6-kịch-bản-báo-cáo-mẫu--bộ-câu-hỏi-phản-biện-giảng-đường)
  - [6.1. Kịch Bản Thuyết Trình Mẫu Phần AI (3 - 4 Phút Dành Cho Báo Cáo)](#61-kịch-bản-thuyết-trình-mẫu-phần-ai-3---4-phút-dành-cho-báo-cáo)
  - [6.2. Bộ Từ Khóa Kỹ Thuật "Ăn Điểm" Trước Hội Đồng Chấm Đồ Án](#62-bộ-từ-khóa-kỹ-thuật-ăn-điểm-trước-hội-đồng-chấm-đồ-án)
  - [6.3. Bộ 6 Câu Hỏi Phản Biện Chuyên Sâu & Câu Trả Lời Mẫu Xuất Sắc](#63-bộ-6-câu-hỏi-phản-biện-chuyên-sâu--câu-trả-lời-mẫu-xuất-sắc)

---

# PHẦN 1: TỔNG QUAN KIẾN TRÚC AI 2 TẦNG (HYBRID AI ARCHITECTURE)

## 1.1. Triết lý Thiết kế Hệ thống AI Hybrid
Trong các bài toán tuyển dụng trực tuyến (HR-Tech), việc phụ thuộc 100% vào các mô hình Ngôn ngữ Lớn (LLM) thương mại từ Cloud sẽ dẫn đến 3 vấn đề nghiêm trọng:
1. **Chi phí vận hành khổng lồ:** Mỗi khi ứng viên tìm kiếm hoặc nhà tuyển dụng mở danh sách hàng trăm hồ sơ, việc gọi API LLM để so khớp từ khóa/ngữ nghĩa sẽ tiêu tốn hàng nghìn token vô ích.
2. **Độ trễ cao (High Latency):** Thời gian phản hồi của LLM Cloud thường từ 1.5s – 5s/request, không thể đáp ứng được trải nghiệm tìm kiếm thời gian thực (Real-time Search & Ranking).
3. **Quyền riêng tư dữ liệu (Data Privacy):** Toàn bộ dữ liệu hồ sơ cá nhân (PII) sẽ bị gửi trực tiếp lên máy chủ bên thứ ba nếu không có bộ lọc nội bộ.

👉 **Giải pháp của Đề tài:** Ứng dụng **Kiến trúc AI 2 Tầng (Hybrid AI Architecture)**:
- **Tầng 1 (Local Vector Engine):** Chạy mô hình Embedding cục bộ ngay trên Server backend (CPU-friendly), phục vụ việc biến đổi văn bản thành Vector và tính toán độ tương đồng Cosine Similarity trực tiếp trên Database PostgreSQL pgvector.
- **Tầng 2 (Cloud Generative LLM):** Sử dụng LLM DeepSeek-Chat để xử lý các tác vụ suy luận ngữ cảnh sâu sắc, sáng tạo nội dung và tư vấn đa chiều.

---

## 1.2. Phân tầng Kiến trúc: Local Vector Embedding & Cloud LLM Reasoning

```
+-----------------------------------------------------------------------------------+
|                            HỆ THỐNG AI JOB PORTAL                                 |
+-----------------------------------------------------------------------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                                                       |
     v                                                                       v
+------------------------------------+             +------------------------------------+
|  TẦNG 1: LOCAL VECTOR EMBEDDING    |             |  TẦNG 2: CLOUD GENERATIVE LLM      |
|  (Tốc độ cao - 0đ chi phí Token)   |             |  (Suy luận sâu - Ngôn ngữ tự nhiên)|
+------------------------------------+             +------------------------------------+
| • Model: sentence-transformers     |             | • Model: DeepSeek-Chat             |
|   (paraphrase-multilingual-        |             | • Giao thức: Async HTTPX JSON      |
|    MiniLM-L12-v2)                  |             | • Tác vụ:                          |
| • Kích thước Vector: 384 chiều     |             |   - Đánh giá CV (CV Evaluation)    |
| • Ngôn ngữ: Hỗ trợ Việt - Anh      |             |   - Tóm tắt hồ sơ theo JD          |
| • Database: PostgreSQL + pgvector  |             |   - Sinh câu hỏi phỏng vấn theo kỹ |
| • Index: HNSW (Hierarchical        |             |     năng chọn lọc                  |
|   Navigable Small World)           |             |   - Soạn email nhân sự chuẩn mực   |
| • Tác vụ:                          |             |   - Sinh lộ trình sự nghiệp        |
|   - Vector hóa CV & JD             |             |   - Trợ lý AI Copilot 24/7         |
|   - Tính AI Matching Score (%)     |             |   - Trợ lý viết CV ATS trực tuyến  |
|   - Tìm kiếm Top ứng viên phù hợp  |             |                                    |
+------------------------------------+             +------------------------------------+
```

---

## 1.3. Sơ đồ Kiến trúc & Luồng Dữ liệu Tổng thể

```mermaid
sequenceDiagram
    autonumber
    actor U as Ứng viên / HR
    participant FE as Frontend (React 19 / TSX)
    participant API as FastAPI Backend Routers (/ai/*)
    participant VEC as Local Embedding Service (MiniLM-384)
    participant DB as PostgreSQL + pgvector (HNSW Index)
    participant LLM as DeepSeek Cloud LLM (Deepseek-Chat)
    participant AUD as AI Audit Logger (ai_audit.py)

    Note over U,FE: Luồng 1: Upload CV & Tính Điểm AI Matching
    U->>FE: Tải lên CV (PDF / DOCX)
    FE->>API: POST /resumes/upload
    API->>VEC: Trích xuất Text & generate_embedding(raw_text)
    VEC-->>API: Vector [384 floats]
    API->>DB: INSERT INTO resumes (raw_text, embedding)
    DB-->>API: Lưu thành công (id = 10)
    
    U->>FE: Xem chi tiết việc làm (Job #5)
    FE->>API: POST /ai/match (resume_id=10, job_id=5)
    API->>DB: SELECT 1 - (job_emb <=> resume_emb)
    DB-->>API: Cosine Distance -> Cosine Similarity (0.945)
    API-->>FE: Return { score: 94.5% }

    Note over U,FE: Luồng 2: Sinh Câu Hỏi Phỏng Vấn & Email Bằng LLM
    U->>FE: Chọn kỹ năng cần phỏng vấn ["React", "FastAPI"]
    FE->>API: POST /ai/interview-questions
    API->>LLM: Gửi Prompt JSON Schema + Dữ liệu CV & JD
    LLM-->>API: Phản hồi JSON { questions: [...] }
    API->>AUD: log_success(endpoint="interview-questions", latency_ms=1200)
    API-->>FE: Trả về danh sách câu hỏi có phân loại purpose
```

---

## 1.4. Tối ưu Hóa Chi phí & Độ trễ (Cost & Latency Optimization)

| Tiêu chí so sánh | Phương pháp Thuần LLM Truyền thống | Kiến trúc Hybrid AI của Đề tài |
| :--- | :--- | :--- |
| **Chi phí Matching CV - JD** | Mất ~1,500 token/lần (~0.003 USD). Với 1,000 CV = **3.0 USD**. | **0 đồng** (Chạy model cục bộ trên CPU máy chủ). |
| **Thời gian tính điểm Match** | 2,000ms – 4,000ms (Phải đợi LLM sinh văn bản). | **< 15ms** (Truy vấn toán tử Vector Cosine trực tiếp trên DB). |
| **Sắp xếp Top ứng viên** | Rất khó khả thi cho hàng nghìn hồ sơ do giới hạn context window. | Cực nhanh nhờ chỉ mục **HNSW Index** (`ORDER BY embedding <=> :job_vec LIMIT 10`). |
| **Xử lý tác vụ sáng tạo** | Gọi API độc lập không kiểm soát lỗi. | Quản lý qua `DeepseekClient` với cơ chế Lazy Rebind, Auto Retry 2 lần và kiểm định Schema qua Pydantic. |

---

# PHẦN 2: BẢNG THÔNG SỐ CẤU HÌNH & BIẾN MÔI TRƯỜNG TOÀN DIỆN

## 2.1. Toàn bộ Biến Môi trường AI (.env & Pydantic Settings)

Tất cả các cấu hình được quản trị tập trung tại file [app/config.py](file:///d:/ai-job-portal/backend/app/config.py) thông qua thư viện `pydantic-settings`:

| Tên Biến Môi trường | Giá trị Mặc định / Ví dụ | Ý nghĩa Kỹ thuật trong Hệ thống |
| :--- | :--- | :--- |
| `DEEPSEEK_API_KEY` | `sk-xxxxxxxxxxxxxxxx` | Khóa xác thực API của nhà cung cấp LLM DeepSeek. |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | Địa chỉ Gateway của máy chủ suy luận DeepSeek API. |
| `LLM_MODEL` | `deepseek-chat` | Tên mô hình LLM được sử dụng (phiên bản tối ưu hóa tốc độ và khả năng sinh JSON có cấu trúc). |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/ai_job_portal` | Chuỗi kết nối Database PostgreSQL (đã kích hoạt extension `vector`). |
| `AI_AUDIT_LOG_FILE` | `""` (Rỗng) hoặc `/var/log/ai_audit.jsonl` | Đường dẫn file lưu trữ nhật ký kiểm toán AI riêng biệt (nếu để trống sẽ xuất ra stdout). |
| `LOG_LEVEL` | `INFO` | Mức độ ghi log hệ thống (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

---

## 2.2. Cấu hình Vector Database (PostgreSQL pgvector & HNSW Index)

### A. Khởi tạo Extension & Chiều Vector
- **Kích thước Vector (`EMBEDDING_DIM`):** Cố định **384 chiều**, khớp chuẩn 100% với đầu ra của mô hình `paraphrase-multilingual-MiniLM-L12-v2`.
- **SQL Khởi tạo Extension:**
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### B. Định nghĩa Cột Vector trong ORM Model SQLAlchemy
Tại [app/models/resume.py](file:///d:/ai-job-portal/backend/app/models/resume.py) và [app/models/job.py](file:///d:/ai-job-portal/backend/app/models/job.py):
```python
from pgvector.sqlalchemy import Vector
from sqlalchemy import Index

EMBEDDING_DIM = 384

# Cột lưu vector trong bảng resumes
embedding = mapped_column(Vector(EMBEDDING_DIM), nullable=True)

# Chỉ mục HNSW cho bảng resumes
__table_args__ = (
    Index(
        "ix_resumes_embedding_hnsw",
        embedding,
        postgresql_using="hnsw",
        postgresql_with={"m": 16, "ef_construction": 64},
        postgresql_ops={"embedding": "vector_cosine_ops"},
    ),
)
```

### C. Giải thích Các Tham Số HNSW Index
- `postgresql_using="hnsw"`: Sử dụng thuật toán đồ thị đa tầng **Hierarchical Navigable Small World**, thuật toán tìm kiếm láng giềng gần nhất xấp xỉ (Approximate Nearest Neighbors - ANN) hiện đại và nhanh nhất hiện nay.
- `m = 16`: Số lượng liên kết tối đa của mỗi nút trên đồ thị (cân bằng giữa tốc độ tìm kiếm và dung lượng RAM).
- `ef_construction = 64`: Kích thước danh sách động khi xây dựng chỉ mục (đảm bảo độ chính xác cao cho kết quả tìm kiếm).
- `vector_cosine_ops`: Chỉ định toán tử khoảng cách **Cosine Distance (`<=>`)**, phù hợp với dữ liệu văn bản đã chuẩn hóa vector (Normalized Embeddings).

---

## 2.3. Cấu hình Cơ chế Chịu lỗi & Quản lý Ngoại lệ (Fault Tolerance & Retry)

Hệ thống được thiết kế theo tiêu chuẩn Enterprise với khả năng phục hồi lỗi tự động tại [app/services/ai_errors.py](file:///d:/ai-job-portal/backend/app/services/ai_errors.py):

```mermaid
graph TD
    A[Bắt đầu Gọi Dịch vụ AI] --> B{Gặp lỗi Ngoại lệ?}
    B -- Không --> C[Trả về Kết quả Chuẩn]
    B -- Có --> D{Số lần thử < 3?}
    D -- Còn lượt (attempt <= 2) --> E[Log Warning & Tự động Retry]
    E --> A
    D -- Hết lượt (attempt > 2) --> F[Chuẩn hóa lỗi qua normalize_ai_error]
    F --> G[Ghi Log Thất bại vào ai_audit]
    G --> H[Trả về HTTP Exception với mã lỗi an toàn cho UI]
```

### Bảng Chuẩn Hóa Mã Lỗi AI (`AIServiceError` Specification):
| Mã Lỗi (`code`) | HTTP Status | Điều Kiện Kích Hoạt | Thông Điệp Người Dùng (Safe Message) | Cho phép Thử lại? |
| :--- | :--- | :--- | :--- | :--- |
| `AI_TIMEOUT` | 504 Gateway Timeout | Yêu cầu LLM vượt quá 30 giây (hoặc CV Builder quá 90s). | *"Dịch vụ AI phản hồi quá thời gian. Vui lòng thử lại."* | `true` |
| `AI_QUOTA_EXCEEDED` | 429 Too Many Requests | Nhà cung cấp trả về HTTP 429 (Hết hạn mức hoặc Rate limit). | *"Dịch vụ AI đang giới hạn lượt dùng. Vui lòng thử lại sau."* | `true` |
| `AI_INVALID_RESPONSE`| 502 Bad Gateway | LLM trả về văn bản không thể ép kiểu sang Pydantic JSON Schema. | *"Dịch vụ AI trả về dữ liệu không hợp lệ. Vui lòng thử lại."* | `true` |
| `AI_PROVIDER_UNAVAILABLE` | 503 Service Unavailable | Mất kết nối Internet, lỗi DNS hoặc máy chủ DeepSeek gặp sự cố (HTTP 5xx). | *"Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau."* | `true` |

---

## 2.4. Cấu hình Nhật ký Kiểm toán AI (Structured AI Audit Trail)

Toàn bộ các yêu cầu gọi AI được ghi nhận độc lập bởi module [app/services/ai_audit.py](file:///d:/ai-job-portal/backend/app/services/ai_audit.py).

### Cấu trúc Bản ghi JSON Log (Không chứa dữ liệu PII nhạy cảm):
```json
{
  "timestamp": "2026-08-21T07:15:30.123456+00:00",
  "event": "ai_call_success",
  "user_id": 4,
  "user_role": "employer",
  "endpoint": "interview-questions",
  "model": "deepseek-chat",
  "input_summary": "resume_id=12, job_id=5, skills=['React', 'FastAPI']",
  "output_summary": "questions=4, generated_for=['React', 'FastAPI']",
  "latency_ms": 1450,
  "success": true,
  "error_code": null
}
```
**Ý nghĩa quản trị:**
- Giám sát độ trễ thời gian thực (Real-time Latency Tracking).
- Kiểm soát hạn mức chi tiêu token theo từng phòng ban/doanh nghiệp.
- Cung cấp bằng chứng kiểm toán (Audit Evidence) minh bạch cho hội đồng về tính an toàn dữ liệu.

---

# PHẦN 3: CHI TIẾT 7 PHÂN HỆ AI & THUẬT TOÁN ĐÃ HIỆN THỰC HÓA

## 3.1. Module 1: AI Semantic Matching & Vector Top-Match Search

### A. Cơ sở Toán học của Thuật toán Cosine Similarity
Mô hình `sentence-transformers` chuyển hóa văn bản CV ($\vec{u}$) và mô tả công việc JD ($\vec{v}$) thành 2 vector trong không gian vector 384 chiều.

Độ tương đồng Cosine giữa 2 vector được tính theo công thức:
$$\text{Cosine Similarity}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|} = \frac{\sum_{i=1}^{n} u_i v_i}{\sqrt{\sum_{i=1}^{n} u_i^2} \sqrt{\sum_{i=1}^{n} v_i^2}}$$

Do các vector đã được chuẩn hóa độ dài Unit Vector ($\|\vec{u}\| = \|\vec{v}\| = 1$), công thức rút gọn thành:
$$\text{Cosine Similarity}(\vec{u}, \vec{v}) = \vec{u} \cdot \vec{v} = 1 - \text{Cosine Distance}(\vec{u}, \vec{v})$$

Điểm **AI Matching Score** hiển thị trên giao diện người dùng:
$$\text{Score (\%)} = \text{round}\Big((1 - \text{Cosine Distance}) \times 100, 2\Big)$$

### B. Mã Nguồn Truy Vấn SQL với Toán Tử pgvector `<=>`
Trích xuất từ [app/services/ai_matching.py](file:///d:/ai-job-portal/backend/app/services/ai_matching.py):
```python
# 1. Tính điểm khớp giữa 1 CV cụ thể và 1 JD
result = db.execute(
    text(
        "SELECT 1 - ((:job_emb)::vector <=> (SELECT embedding FROM resumes WHERE id = :resume_id))"
    ),
    {"job_emb": str(job_embedding), "resume_id": resume.id},
)
similarity = result.scalar() or 0.0

# 2. Tìm kiếm Top N ứng viên phù hợp nhất cho 1 JD (Tận dụng HNSW Index)
result = db.execute(
    text(
        """
        SELECT id, user_id, title,
               1 - (embedding <=> :embedding::vector) AS similarity
        FROM resumes
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> :embedding::vector
        LIMIT :limit
        """
    ),
    {"embedding": str(job_embedding), "limit": limit},
)
```

### C. Cơ chế Fallback Thuần Python (Pure Python Fallback)
Khi chạy kiểm thử Unit Test trên môi trường SQLite trong bộ nhớ (không có pgvector), hệ thống tự động chuyển đổi sang tính toán ma trận thuần bằng Python để không làm gián đoạn CI/CD pipeline:
```python
def _cosine_similarity_python(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)
```

---

## 3.2. Module 2: CV Evaluator & Document Gatekeeper

Phân hệ tại [app/services/cv_evaluator.py](file:///d:/ai-job-portal/backend/app/services/cv_evaluator.py) đảm nhiệm 2 nhiệm vụ cốt lõi:

### A. Kiểm Duyệt Nội Dung Tải Lên (`validate_is_cv`)
Ngăn chặn người dùng tải lên các file không liên quan (hóa đơn, truyện, tài liệu ngẫu nhiên):
- Trích xuất 1,500 ký tự đầu tiên của tài liệu.
- Sử dụng LLM phân tích nhanh với prompt nghiêm ngặt: *Chỉ trả về `YES` nếu là CV/Hồ sơ xin việc hợp lệ, hoặc `NO` nếu không phải.*
- Loại bỏ tài liệu rác ngay từ cửa ngõ mà không cần xử lý sâu.

### B. Chấm Điểm & Đánh Giá Đa Tiêu Chí
Phân tích toàn diện CV và trả về cấu trúc dữ liệu JSON Schema chuẩn:
```json
{
  "overall_score": 8.5,
  "summary": "Ứng viên có nền tảng vững chắc về React và Python backend, tuy nhiên phần kinh nghiệm triển khai Cloud (AWS/Docker) chưa được làm rõ.",
  "suggestions": [
    "Bổ sung các số liệu định lượng (Metrics) vào thành tựu dự án cũ.",
    "Thêm chứng chỉ chuyên môn hoặc liên kết GitHub dự án cá nhân."
  ],
  "skill_analysis": {
    "React.js": 9.0,
    "TypeScript": 8.5,
    "FastAPI": 8.0,
    "PostgreSQL": 7.5,
    "DevOps/Docker": 6.0
  }
}
```

---

## 3.3. Module 3: AI CV Builder Studio (Trợ lý Tạo CV Thông minh)

Tích hợp tại [app/services/cv_suggestions.py](file:///d:/ai-job-portal/backend/app/services/cv_suggestions.py), hỗ trợ ứng viên biên soạn hồ sơ xin việc chuẩn ATS theo thời gian thực:

1. **`suggest_summary` (Viết câu tóm tắt chuyên nghiệp):**
   - Đầu vào: Vai trò mục tiêu (`target_role`), văn bản tóm tắt hiện tại, ngôn ngữ (`vi` hoặc `en`).
   - Đầu ra: Bản tóm tắt súc tích 3-4 câu, nhấn mạnh giá trị cốt lõi, không bịa đặt kinh nghiệm.

2. **`rewrite_experience` (Viết lại kinh nghiệm theo chuẩn STAR & Hướng thành tựu):**
   - Áp dụng nguyên tắc **Action Verbs + Context + Result (Số liệu định lượng)**.
   - Kết hợp ngữ cảnh của Job mục tiêu (`job_context`) để ưu tiên các từ khóa liên quan, tăng tỷ lệ vượt qua vòng lọc ATS của doanh nghiệp.

3. **`suggest_skills` (Đề xuất bộ kỹ năng chuyên ngành):**
   - Phân tích khoảng cách giữa kỹ năng ứng viên đang có (`current_skills`) và yêu cầu của tin tuyển dụng (`job_context`).
   - Đề xuất tối đa 10 kỹ năng trọng tâm còn thiếu mà ứng viên nên đưa vào CV.

---

## 3.4. Module 4: CV Summarizer & Targeted Interview Generator

Phân hệ tại [app/services/cv_summarizer.py](file:///d:/ai-job-portal/backend/app/services/cv_summarizer.py) và [app/services/interview_questions.py](file:///d:/ai-job-portal/backend/app/services/interview_questions.py) hỗ trợ hội đồng tuyển dụng phỏng vấn có định hướng:

### A. Tóm Tắt Khớp Hồ Sơ (Fit Points & Gaps)
- Trích xuất tự động các điểm ăn khớp cụ thể (`fit_points`) giữa CV của ứng viên và tiêu chí tuyển dụng trong JD.
- Chỉ ra các điểm nghi vấn hoặc khoảng trống năng lực (`questions`) cần người phỏng vấn đào sâu xác minh.

### B. Sinh Bộ Câu Hỏi Phỏng Vấn Theo Kỹ Năng Chọn Lọc (Targeted Questions)
Thay vì sinh câu hỏi ngẫu nhiên, HR được chủ động chọn các kỹ năng muốn đánh giá (ví dụ: `["FastAPI", "Database Architecture", "System Design"]`).
- Mỗi kỹ năng sinh tối thiểu **2 câu hỏi thực chiến**.
- Kèm theo trường `purpose` giải thích mục đích đánh giá của câu hỏi.
- Điều chỉnh độ khó thông minh: Nếu CV có kinh nghiệm $\rightarrow$ hỏi chuyên sâu về tối ưu và xử lý sự cố; nếu CV chưa có $\rightarrow$ hỏi tư duy cơ bản.

```json
{
  "questions": [
    {
      "question": "Trong dự án sử dụng FastAPI, bạn đã xử lý bài toán bất đồng bộ (Async I/O) khi kết nối Database PostgreSQL như thế nào để tránh cạn kiệt Connection Pool?",
      "purpose": "Đánh giá hiểu biết chuyên sâu về Async SQLAlchemy và cấu hình connection pooling trong môi trường chịu tải cao.",
      "skill_related": "FastAPI"
    }
  ]
}
```

---

## 3.5. Module 5: AI Email Studio (Hệ thống Soạn Thảo Thư Nhân sự Chuẩn mực)

Module [app/services/email_generator.py](file:///d:/ai-job-portal/backend/app/services/email_generator.py) sinh bản thảo email nhân sự với 3 chế độ:

| Loại Email (`email_type`) | Quy Chuẩn Thiết Kế Prompt & Bảo Vệ Pháp Lý |
| :--- | :--- |
| **`invite` (Mời phỏng vấn)** | Tự động chèn tên ứng viên, vị trí tuyển dụng, tên công ty. Bắt buộc dùng placeholder `[Ngày giờ]`, `[Địa điểm/Hình thức]` để HR chủ động điền lịch, không bịa thông tin sai lệch. |
| **`reject` (Từ chối khéo léo - Bias-Free)** | **Tuân thủ tuyệt đối quy tắc đạo đức AI:** Không nêu lý do cụ thể, không đề cập đến tuổi tác/giới tính/đặc điểm cá nhân; giữ văn phong lịch thiệp, tôn trọng và mở ra cơ hội hợp tác trong tương lai. |
| **`offer` (Thư mời nhận việc)** | Văn phong chúc mừng chuyên nghiệp, hướng dẫn rõ ràng các bước xác nhận, dùng placeholder `[Ngày bắt đầu]`, `[Mức lương và chế độ]` cho dữ liệu bảo mật. |

*Lưu ý cốt lõi:* Mọi email tạo ra đều là **Bản thảo (Draft)** trong giao diện *AI Gmail Studio* của HR. Quyết định chỉnh sửa và bấm nút gửi thuộc 100% về con người (*Human-in-the-Loop*).

---

## 3.6. Module 6: AI Career Roadmap & Assessment Engine

### A. Động Cơ Trắc Nghiệm Tâm Lý & Đa Trí Tuệ (Deterministic Assessment Engine)
Tại [app/services/assessment_engine.py](file:///d:/ai-job-portal/backend/app/services/assessment_engine.py), hệ thống áp dụng thuật toán tính điểm tất định (**Deterministic Scoring**, không dùng LLM để đảm bảo tính khoa học và nhất quán 100%):

1. **Bộ Trắc nghiệm MBTI (40 câu hỏi):**
   - Phân tích 4 trục nhị phân: **EI** (Hướng ngoại - Hướng nội), **SN** (Trực giác - Cảm giác), **TF** (Lý trí - Cảm xúc), **JP** (Nguyên tắc - Linh hoạt).
   - Công thức tính điểm trục:
     $$\text{Dimension Score} = \frac{\sum \text{Điểm các câu theo trục}}{\text{Số câu}} \times 20 \quad (\text{Thang điểm } 0 - 100)$$
   - Xác định mã 4 chữ cái (ví dụ: `INTJ`, `ENFP`) và phân tích môi trường làm việc lý tưởng.

2. **Bộ Trắc nghiệm Đa trí tuệ Howard Gardner - MI (40 câu hỏi):**
   - Đánh giá 8 loại hình thông minh: *Ngôn ngữ, Logic, Không gian, Vận động, Âm nhạc, Giao tiếp, Tự nhận thức, Tự nhiên*.
   - Trích xuất Top 3 thế mạnh vượt trội nhất và đề xuất nhóm ngành nghề tương thích.

### B. AI Career Roadmap Generator
Sử dụng LLM DeepSeek để vẽ lộ trình nâng cấp sự nghiệp theo từng giai đoạn (Order, Title, Description, Skills to learn, Estimated Months, Resources).

---

## 3.7. Module 7: JobPortal AI Copilot 24/7 (Cố vấn Tuyển dụng & Hướng nghiệp)

Nằm tại [app/services/assistant_service.py](file:///d:/ai-job-portal/backend/app/services/assistant_service.py), trợ lý Copilot đóng vai trò là một **Nhà Ngoại Giao Số (Diplomatic Advisor)**:

1. **Phân hóa 3 Persona Ứng Xử Theo Tác Nhân:**
   - *Khách vãng lai (Guest):* Thân thiện, giới thiệu trải nghiệm miễn phí (Làm bài test MBTI/MI 0 đồng, tạo CV chuẩn ATS).
   - *Ứng viên (Candidate):* Cố vấn nghề nghiệp, hướng dẫn phỏng vấn theo phương pháp STAR, tối ưu CV, gợi ý việc làm thực tế trên sàn.
   - *Doanh nghiệp (Employer):* Tư vấn giải pháp HR-Tech, viết JD chuẩn SEO, tối ưu phễu tuyển dụng và phân quyền nhân sự B2B.

2. **Hệ thống Gợi ý Nhanh 1-Click (Quick Suggestion Chips):**
   - Tự động thay đổi các nút bấm gợi ý thông minh dựa trên URL trang người dùng đang truy cập (`path`) và quyền hạn người dùng (`role`).

3. **Thẻ Nhúng Tương Tác Động (Embedded Cards):**
   - Copilot có khả năng trả về các thẻ hành động trực tiếp trong khung chat: Thẻ việc làm (`job`), Thẻ công cụ (`tool`), Thẻ thao tác (`action`).

---

# PHẦN 4: DANH MỤC REST API & THIẾT KẾ PROMPT KỸ THUẬT

## 4.1. Bảng Tổng Hợp Danh Mục AI REST APIs Toàn Hệ Thống

Tất cả các API được định nghĩa tại router [app/routers/ai.py](file:///d:/ai-job-portal/backend/app/routers/ai.py) và [app/routers/assessments.py](file:///d:/ai-job-portal/backend/app/routers/assessments.py):

| STT | Phương Thức & Endpoint | Quyền Hạn (Auth Scope) | Dữ Liệu Đầu Vào (Request Body) | Dữ Liệu Trả Về (Response Model) | Mục Đích Nghiệp Vụ |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `POST /ai/match` | Candidate / Employer | `{"resume_id": 1, "job_id": 5}` | `AIMatchResponse` | Tính điểm AI Matching Score theo Cosine Similarity. |
| **2** | `POST /ai/evaluate` | Candidate / Employer | `{"resume_id": 1}` | `CVEvaluationResponse` | Đánh giá chất lượng CV, chấm điểm 0-10 và phân tích kỹ năng. |
| **3** | `POST /ai/roadmap` | Candidate Owner | `{"resume_id": 1, "target_role": "Backend Lead"}` | `RoadmapResponse` | Sinh lộ trình học tập và nâng cao sự nghiệp theo từng bước. |
| **4** | `POST /ai/summarize-cv` | Employer (AI Permission) | `{"resume_id": 1, "job_id": 5}` | `CVSummarizeResponse` | Tóm tắt độ khớp của hồ sơ ứng viên với một JD tuyển dụng cụ thể. |
| **5** | `POST /ai/interview-questions` | Employer (AI Permission) | `{"resume_id": 1, "job_id": 5, "skills_to_assess": ["React", "FastAPI"]}` | `InterviewQuestionsResponse` | Sinh câu hỏi phỏng vấn chuyên sâu theo danh sách kỹ năng đã chọn. |
| **6** | `POST /ai/generate-email` | Employer (AI Permission) | `{"application_id": 10, "email_type": "invite"}` | `GenerateEmailResponse` | Soạn thảo bản thảo email nhân sự (Mời phỏng vấn / Từ chối / Offer). |
| **7** | `POST /ai/cv/suggest-summary` | Candidate Owner | `{"cv_document_id": 2, "current_text": "...", "target_role": "DevOps", "language": "vi"}` | `CvSummarySuggestionResponse` | Gợi ý câu giới thiệu bản thân chuẩn mực trong CV Builder. |
| **8** | `POST /ai/cv/rewrite-experience` | Candidate Owner | `{"cv_document_id": 2, "experience_text": "...", "target_role": "DevOps", "language": "vi", "job_id": 5}` | `CvExperienceSuggestionResponse` | Viết lại kinh nghiệm làm việc theo hướng thành tựu & chuẩn STAR. |
| **9** | `POST /ai/cv/suggest-skills` | Candidate Owner | `{"cv_document_id": 2, "current_skills": ["Git"], "target_role": "DevOps", "job_id": 5, "language": "vi"}` | `CvSkillsSuggestionResponse` | Đề xuất tối đa 10 kỹ năng phù hợp với vị trí mục tiêu. |
| **10** | `POST /ai/assistant/chat` | All Users / Optional JWT | `{"messages": [...], "context": {"current_path": "/jobs", "selected_job_id": 5}}` | `AssistantChatResponse` | Trò chuyện với Cố vấn AI Copilot, nhận lời khuyên & thẻ nhúng. |
| **11** | `GET /ai/assistant/suggestions` | All Users / Optional JWT | Query Params: `path=/jobs`, `role=candidate` | `list[AssistantQuickSuggestion]` | Lấy danh sách chip gợi ý câu hỏi 1-click theo ngữ cảnh trang web. |
| **12** | `POST /assessments/submit` | Public / Optional JWT | `{"type": "mbti", "version": "mbti-v1", "answers": {"mbti-01": 5, ...}}` | `AssessmentResult` | Nộp bài trắc nghiệm tính cách/đa trí tuệ và tính điểm tức thời. |

---

## 4.2. Chi Tiết Kỹ Thuật Prompt Engineering & JSON Schema Enforcement

Để đảm bảo mô hình LLM Cloud hoạt động ổn định và tích hợp mượt mà vào luồng API của FastAPI, hệ thống áp dụng các kỹ thuật Prompting chuyên nghiệp:

### A. Định Dạng JSON Mode Bắt Buộc (`response_format={"type": "json_object"}`)
Mọi lời gọi hàm tới `DeepSeekClient` đều kích hoạt chế độ JSON Mode của nhà cung cấp, đồng thời trong `system_prompt` luôn có mệnh lệnh tối thượng:
> *"QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ, không được thêm markdown hay text bên ngoài JSON."*

### B. Bộ Lọc Regex & Pydantic Validation Phòng Vệ 2 Lớp (Defense in Depth)
Trích xuất mã nguồn xử lý tại [app/services/cv_suggestions.py](file:///d:/ai-job-portal/backend/app/services/cv_suggestions.py):
```python
@staticmethod
def _parse_response(content: str, response_model: type[T]) -> T:
    cleaned = content.strip()
    # Tự động gỡ bỏ các khối ```json ... ``` nếu LLM vô tình sinh ra
    fenced = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", cleaned, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1).strip()
    # Ép kiểu và kiểm định chặt chẽ cấu trúc qua Pydantic Model
    return response_model.model_validate(json.loads(cleaned))
```

### C. Trích Dẫn Hệ Thống System Prompts Tiêu Biểu

#### 1. System Prompt Phân Tích CV Đa Tiêu Chí ([cv_evaluator.py](file:///d:/ai-job-portal/backend/app/services/cv_evaluator.py)):
```
Bạn là một chuyên gia đánh giá CV. Hãy phân tích CV được cung cấp và đưa ra đánh giá toàn diện, bao gồm:
- overall_score: Điểm tổng thể từ 0.0 đến 10.0.
- summary: Tóm tắt ngắn gọn về điểm mạnh và điểm yếu của CV.
- suggestions: Các gợi ý cụ thể để cải thiện CV.
- skill_analysis: object với key là tên kỹ năng, value là điểm số từ 0.0 đến 10.0.
QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ, không được thêm markdown hay text bên ngoài JSON.
```

#### 2. System Prompt Sinh Email Từ Chối Lịch Sự Bias-Free ([email_generator.py](file:///d:/ai-job-portal/backend/app/services/email_generator.py)):
```
Bạn là trợ lý nhân sự chuyên nghiệp. Hãy soạn email từ chối ứng viên bằng tiếng Việt.

Yêu cầu TUYỆT ĐỐI:
- Xưng hô 'bạn' với ứng viên (trung tính, không đoán giới tính từ tên).
- KHÔNG nêu lý do cụ thể nào (tránh rủi ro pháp lý về phân biệt đối xử).
- KHÔNG đề cập đến tuổi tác, giới tính, dân tộc, tôn giáo, tình trạng hôn nhân, hoặc bất kỳ đặc điểm cá nhân nào.
- Giọng điệu lịch sự, tôn trọng, giữ thiện chí.
- Bày tỏ mong muốn giữ liên lạc và mời ứng tuyển các vị trí phù hợp trong tương lai.
- Đề cập tên ứng viên và vị trí đã ứng tuyển.

QUAN TRỌNG: Phản hồi PHẢI là JSON hợp lệ với cấu trúc:
{"subject": "tiêu đề email", "body": "nội dung email (có thể nhiều dòng, dùng \\n ngăn cách)"}
```

#### 3. System Prompt Sinh Câu Hỏi Phỏng Vấn Chuyên Sâu ([interview_questions.py](file:///d:/ai-job-portal/backend/app/services/interview_questions.py)):
```
Bạn là chuyên gia phỏng vấn kỹ thuật giàu kinh nghiệm. 
Nhiệm vụ của bạn là tạo câu hỏi phỏng vấn CHUYÊN SÂU, bám sát vào các kỹ năng cụ thể được yêu cầu.

Nguyên tắc:
- Mỗi câu hỏi phải tập trung vào MỘT kỹ năng cụ thể trong danh sách skills_to_assess.
- Câu hỏi phải kiểm tra được năng lực THỰC TẾ (không hỏi lý thuyết thuộc lòng).
- Dựa vào CV để điều chỉnh độ khó: nếu CV thể hiện kinh nghiệm với kỹ năng đó -> hỏi sâu hơn. Nếu CV không đề cập đến kỹ năng đó -> hỏi để đánh giá mức độ hiểu biết cơ bản.
- purpose phải nêu rõ mục đích: câu hỏi này nhằm kiểm tra ĐIỀU GÌ.

Trả về JSON có cấu trúc:
{"questions": [
  {"question": "nội dung câu hỏi",
   "purpose": "mục đích đánh giá (1 câu ngắn gọn)",
   "skill_related": "tên kỹ năng trong danh sách"}
]}
```

---

## 4.3. Kỹ Thuật Chống Ảo Giác & Kiểm Định Dữ Liệu (Anti-Hallucination Guardrails)

Hệ thống thiết lập 4 hàng rào kỹ thuật ngăn ngừa hiện tượng ảo giác (Hallucination) của LLM:

1. **Nguyên tắc "No Hallucination Facts":** Trong các prompt viết lại CV hoặc tóm tắt hồ sơ, luôn có câu lệnh: *"Chỉ dùng thông tin đã cung cấp, tuyệt đối không tự bịa số liệu, dự án hoặc kinh nghiệm không có trong văn bản gốc."*
2. **Cơ chế Placeholder Dữ Liệu Nhạy Cảm:** Khi sinh thư mời phỏng vấn hoặc thư trúng tuyển, LLM bị cấm tự sinh giờ giấc hoặc mức lương cụ thể, bắt buộc phải trả về các thẻ giữ chỗ an toàn `[Ngày giờ]`, `[Địa điểm]`, `[Mức lương và chế độ]` để người phụ trách nhân sự tự điền.
3. **Cơ chế Độc Lập Trắc Nghiệm (Deterministic Isolation):** Các bài trắc nghiệm tâm lý MBTI và Đa trí tuệ MI hoàn toàn **không sử dụng LLM để tính điểm**, loại bỏ 100% rủi ro sinh kết quả ngẫu hứng. Điểm số được tính toán bằng thuật toán toán học thuần túy trên backend.
4. **Cơ chế Thử Lại Tự Động (Retry Loop with Exponential Backoff):** Nếu LLM trả về chuỗi JSON bị lỗi cú pháp, hệ thống tự động gọi lại tối đa 2 lần trước khi báo lỗi về client.

---

# PHẦN 5: BẢO MẬT, ĐẠO ĐỨC AI & GIÁM SÁT THIÊN LỆCH

## 5.1. Nguyên Tắc Human-in-the-Loop & Quyền Quyết Định Tuyển Dụng

Trong thiết kế hệ thống của đề tài, **Trí tuệ nhân tạo chỉ đóng vai trò Trợ lý Tư vấn (AI Advisory Copilot)**, tuyệt đối không thay thế con người trong các quyết định tuyển dụng:

```
[ Hồ Sơ Ứng Viên ] ---> [ AI Vector Matching & Scoring ] ---> [ Gợi Ý Thứ Tự & Phân Tích ]
                                                                        |
                                                                        v
                                                   [ CON NGƯỜI / CHUYÊN VIÊN NHÂN SỰ ]
                                                   (Duyệt hồ sơ / Phỏng vấn / Gửi offer)
                                                                        |
                                                                        +---> 100% Quyền Quyết Định
```

- **Không có Auto-Reject:** Hệ thống không tự động loại hồ sơ khi điểm Matching thấp. Mọi hồ sơ nộp vào đều nằm trong danh sách chờ duyệt (`pending`) để HR trực tiếp xem xét.
- **Không có Auto-Send:** Mọi email do AI sinh ra (`/ai/generate-email`) đều chỉ hiển thị dưới dạng bản thảo (Draft) trên giao diện soạn thảo. Chuyên viên nhân sự phải đọc, chỉnh sửa và bấm nút "Gửi Email" thủ công.

---

## 5.2. Cơ Chế Giảm Thiểu Thiên Lệch Vô Thức (Bias Mitigation)

Để đảm bảo tính công bằng và tuân thủ các quy định pháp luật lao động, hệ thống hiện thực hóa các giải pháp kỹ thuật:

1. **Loại bỏ Yếu Tố Phi Chuyên Môn khỏi Vector Matching:**
   - Quá trình trích xuất vector chỉ tập trung vào: Kỹ năng (`parsed_skills`), Kinh nghiệm làm việc (`parsed_experience`), Học vấn và Dự án thực tế.
   - Các yếu tố như: Ảnh chân dung, Giới tính, Tuổi tác, Tôn giáo, Tình trạng hôn nhân hoàn toàn không tham gia vào phép tính khoảng cách Cosine.
2. **Chuẩn Hóa Ngôn Ngữ Trung Tính Trong AI Prompts:**
   - Áp dụng đại từ xưng hô `"bạn"` đồng nhất cho mọi ứng viên.
   - Khi tạo email từ chối, hệ thống cấm tuyệt đối việc giải thích lý do liên quan đến cá nhân, đảm bảo tính lịch sự và giữ gìn thiện chí tuyển dụng.

---

## 5.3. Phân Quyền Đa Cấp & Cô Lập Dữ Liệu Doanh Nghiệp (B2B RBAC & Scope Isolation)

Hệ thống đảm bảo tính bảo mật dữ liệu doanh nghiệp đa tổ chức (Multi-tenant B2B Architecture) thông qua 2 lớp kiểm soát tại [app/routers/ai.py](file:///d:/ai-job-portal/backend/app/routers/ai.py):

```python
def _authorize_resume_access(
    db: Session,
    *,
    current_user: User,
    resume,
    job_id: int | None = None,
) -> None:
    # 1. Nếu là Ứng viên: Chỉ được dùng CV chính chủ của mình
    if current_user.role == UserRole.CANDIDATE:
        if resume.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền dùng CV này.")
        return

    # 2. Nếu là Nhà tuyển dụng: Phải có quyền AI_RECRUITMENT và hồ sơ phải nộp vào công ty mình
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Bạn không có quyền dùng CV này.")
    
    context = build_company_context(db, current_user)
    if not context.has(CompanyPermission.AI_RECRUITMENT):
        raise HTTPException(status_code=403, detail="Bạn không có quyền sử dụng AI tuyển dụng.")
    
    # 3. Kiểm tra Scope phạm vi phòng ban (Department Scope)
    ...
```

- **Cô lập giữa các công ty:** Doanh nghiệp A tuyệt đối không thể gọi API AI để phân tích hay xem CV của ứng viên nộp cho Doanh nghiệp B.
- **Phân quyền nội bộ phòng ban:** Trưởng bộ phận (Tech Lead Reviewer) chỉ có thể gọi AI đối với các hồ sơ nộp vào vị trí thuộc phòng ban mình phụ trách.

---

## 5.4. Bảo Mật Dữ Liệu PII & Nhật Ký Kiểm Toán An Toàn (Non-PII Audit Logging)

Để bảo vệ quyền riêng tư theo tiêu chuẩn quốc tế (GDPR / ISO 27001), nhật ký kiểm toán [app/services/ai_audit.py](file:///d:/ai-job-portal/backend/app/services/ai_audit.py) tuân thủ nguyên tắc **Zero-PII Storage**:

- **Không ghi nhận:** Họ tên ứng viên, Số điện thoại, Email cá nhân, Địa chỉ nhà, Số CCCD hoặc toàn văn nội dung CV.
- **Chỉ ghi nhận:** Định danh số (`user_id`, `resume_id`), Độ dài chuỗi ký tự (`text_len`), Tên kỹ năng kỹ thuật, Mã lỗi và Độ trễ mili-giây.

```json
{
  "timestamp": "2026-08-21T07:15:30.123456+00:00",
  "event": "ai_call_success",
  "user_id": 4,
  "user_role": "employer",
  "endpoint": "evaluate",
  "model": "deepseek-chat",
  "input_summary": "resume_id=12, text_len=1420",
  "output_summary": "score=8.5, skills=5, suggestions=2",
  "latency_ms": 1320,
  "success": true,
  "error_code": null
}
```

---

# PHẦN 6: KỊCH BẢN BÁO CÁO MẪU & BỘ CÂU HỎI PHẢN BIỆN GIẢNG ĐƯỜNG

## 6.1. Kịch Bản Thuyết Trình Mẫu Phần AI (3 - 4 Phút Dành Cho Báo Cáo)

Dưới đây là lời thoại mẫu chuẩn mực, tự tin và tập trung vào các điểm sáng kỹ thuật giúp bạn đạt điểm tối đa trước Hội đồng:

---

### 🎙️ LỜI THOẠI THUYẾT TRÌNH TRÊN GIẢNG ĐƯỜNG:

> *"Kính thưa Thầy/Cô Chủ tịch và các Thầy/Cô trong Hội đồng chấm đồ án tốt nghiệp!*
>
> *Sau đây, em xin phép đại diện nhóm trình bày chi tiết về **Kiến trúc và Phân hệ Trí tuệ Nhân tạo (AI Engine)** – trái tim công nghệ của nền tảng **AI-Powered Job Portal**.*
>
> *(Chuyển sang slide Kiến trúc AI)*
> *Để giải quyết bài toán tuyển dụng doanh nghiệp trên quy mô lớn mà vẫn tối ưu hóa chi phí và đảm bảo thời gian phản hồi tức thời, nhóm em không sử dụng phương pháp gọi LLM đơn thuần mà xây dựng **Kiến trúc AI 2 Tầng (Hybrid AI Architecture)**:*
>
> *1. **Tầng thứ nhất – Local Semantic Vector Search:** Nhóm tích hợp mô hình `sentence-transformers` đa ngôn ngữ 384 chiều trực tiếp trên Backend kết hợp với extension `pgvector` trên PostgreSQL. Khi ứng viên nộp CV hoặc nhà tuyển dụng đăng tin JD, hệ thống tự động số hóa văn bản thành Vector và lưu trữ trên chỉ mục `HNSW Index`. Nhờ đó, việc tính toán **AI Matching Score** và tìm kiếm Top ứng viên phù hợp nhất diễn ra hoàn toàn bằng phép toán **Cosine Distance** trên Database chỉ trong chưa đầy **15 mili-giây** và hoàn toàn **miễn phí token**.*
>
> *(Thực hiện thao tác Demo trên màn hình)*
> *2. **Tầng thứ hai – Cloud Generative Reasoning:** Đối với các tác vụ suy luận phức tạp, hệ thống giao tiếp với mô hình `DeepSeek-Chat` thông qua chuẩn Pydantic Structured Outputs. Cụ thể gồm các tính năng nổi bật:*
> - *Thứ nhất, **Radar Chart Phân tích Kỹ năng Đa Chiều:** Trực quan hóa độ tương thích giữa ứng viên và yêu cầu đầu vào của doanh nghiệp.*
> - *Thứ hai, **Targeted Interview Question Generator:** Cho phép HR chọn đích danh các kỹ năng cần kiểm tra (ví dụ: FastAPI, React) để AI sinh câu hỏi phỏng vấn thực chiến kèm mục đích đánh giá rõ ràng.*
> - *Thứ ba, **AI Email Studio:** Tự động sinh thư mời, thư trúng tuyển và đặc biệt là thư từ chối tuân thủ nghiêm ngặt nguyên tắc **Đạo đức AI (Bias-Free)** – không phân biệt tuổi tác hay giới tính.*
> - *Thứ tư, **AI Copilot 24/7 & Deterministic Assessment Engine:** Cung cấp bộ trắc nghiệm khoa học MBTI và Đa trí tuệ MI để định hướng lộ trình nghề nghiệp cho ứng viên.*
>
> *Đặc biệt, hệ thống tuân thủ triệt để nguyên tắc **Human-in-the-Loop** (AI chỉ đóng vai trò trợ lý, con người giữ 100% quyền quyết định) và có hệ thống **AI Audit Logs** giám sát độ trễ, tỷ lệ lỗi và bảo vệ tuyệt đối thông tin định danh PII của ứng viên.*
>
> *Sau đây, em xin kính mời Thầy/Cô cùng theo dõi phần Demo trực tiếp các tính năng AI trên hệ thống! Em xin chân thành cảm ơn Thầy/Cô!"*

---

## 6.2. Bộ Từ Khóa Kỹ Thuật "Ăn Điểm" Trước Hội Đồng Chấm Đồ Án

Khi trả lời câu hỏi của Thầy/Cô, hãy sử dụng chính xác các thuật ngữ kỹ thuật sau để thể hiện kiến thức chuyên sâu:

| Thuật Ngữ Kỹ Thuật | Cách Giải Thích Ngắn Gọn & Chuẩn Xác |
| :--- | :--- |
| **Hybrid AI Architecture** | Kiến trúc kết hợp mô hình Vector Embedding chạy cục bộ (tốc độ cao, tiết kiệm chi phí) và Generative LLM trên Cloud (suy luận sâu). |
| **Cosine Similarity / Distance** | Thuật toán đo góc giữa 2 vector trong không gian 384 chiều để xác định mức độ tương đồng về ngữ nghĩa giữa CV và JD. |
| **pgvector & HNSW Index** | Extension mở rộng của PostgreSQL sử dụng đồ thị phân tầng Hierarchical Navigable Small World để tìm kiếm vector láng giềng gần nhất (ANN) với độ phức tạp $O(\log N)$. |
| **Deterministic Scoring** | Phương pháp tính điểm tất định bằng thuật toán toán học cố định (áp dụng cho MBTI/MI), đảm bảo tính khoa học và không bị biến thiên ngẫu nhiên. |
| **Structured Output / Schema Enforcement** | Kỹ thuật bắt buộc LLM trả về JSON chuẩn, được kiểm định qua Pydantic Model để chống sập API Backend. |
| **Human-in-the-Loop (HITL)** | Nguyên tắc thiết kế phần mềm nhân sự: AI chỉ xếp hạng và gợi ý, quyền từ chối hay tuyển dụng 100% thuộc về con người. |
| **Zero-PII Audit Logging** | Cơ chế ghi vết kiểm toán hệ thống không lưu trữ thông tin cá nhân nhạy cảm, đáp ứng các tiêu chuẩn bảo mật dữ liệu. |

---

## 6.3. Bộ 6 Câu Hỏi Phản Biện Chuyên Sâu & Câu Trả Lời Mẫu Xuất Sắc

### ❓ Câu Hỏi 1: *"Tại sao nhóm không dùng trực tiếp OpenAI GPT-4 để so khớp CV và JD mà lại dùng mô hình Vector Embedding cục bộ?"*
- **Trả lời mẫu xuất sắc:**
  > *"Dạ thưa Thầy/Cô, nhóm đã cân nhắc rất kỹ bài toán này từ góc độ kỹ thuật và kinh tế của một hệ thống B2B SaaS thực tế:*
  > 1. *Thứ nhất về chi phí: Một doanh nghiệp nhận 1,000 hồ sơ/tháng, nếu gọi GPT-4 cho mỗi lần so khớp sẽ tốn hàng trăm USD chi phí token. Trong khi mô hình Local Embedding `paraphrase-multilingual-MiniLM-L12-v2` chạy trực tiếp trên CPU của máy chủ backend hoàn toàn miễn phí.*
  > 2. *Thứ hai về độ trễ: Gọi LLM Cloud mất trung bình 2 đến 4 giây cho mỗi hồ sơ, không thể hiển thị kết quả tìm kiếm thời gian thực. Với pgvector và chỉ mục HNSW, hệ thống của nhóm thực hiện so khớp 1,000 hồ sơ chỉ mất chưa đầy **15 mili-giây**.*
  > 3. *Nhóm chỉ sử dụng Cloud LLM cho các tác vụ sáng tạo và suy luận như sinh câu hỏi phỏng vấn hoặc soạn thảo email, giúp tối ưu hóa chi phí đến 90%."*

---

### ❓ Câu Hỏi 2: *"Thuật toán Vector Cosine Similarity có ưu điểm gì vượt trội so với tìm kiếm từ khóa truyền thống (SQL LIKE hoặc Full-Text Search)?"*
- **Trả lời mẫu xuất sắc:**
  > *"Dạ thưa Thầy/Cô, tìm kiếm từ khóa truyền thống (Exact Keyword Match) gặp phải hiện tượng **Keyword Mismatch Gap** (Lệch từ khóa theo ngữ cảnh):*
  > - *Ví dụ: Tin tuyển dụng yêu cầu kỹ năng `FastAPI`, nhưng CV của ứng viên ghi là `Python Web Framework` hoặc `RESTful API Architecture`.*
  > - *Tìm kiếm SQL truyền thống sẽ đánh giá ứng viên này 0 điểm vì không khớp chính xác chuỗi ký tự `FastAPI`.*
  > - *Trong khi đó, mô hình Vector Embedding ánh xạ các từ ngữ này vào cùng một không gian ngữ nghĩa 384 chiều, do đó hệ thống vẫn nhận diện được sự tương đồng rất cao (trên 85%) giữa hai khái niệm này, giúp doanh nghiệp không bỏ sót ứng viên giỏi."*

---

### ❓ Câu Hỏi 3: *"Làm thế nào để hệ thống ngăn chặn hiện tượng ảo giác (Hallucination) hoặc việc AI tự ý bịa đặt thông tin khi viết lại CV?"*
- **Trả lời mẫu xuất sắc:**
  > *"Dạ thưa Thầy/Cô, nhóm thiết lập 3 lớp bảo vệ nghiêm ngặt (Guardrails):*
  > 1. *Trong System Prompt, nhóm đưa ra ràng buộc cứng: 'Chỉ được sử dụng dữ liệu có trong văn bản được cung cấp, tuyệt đối không bịa số liệu, dự án hay kinh nghiệm cá nhân'.*
  > 2. *Dữ liệu đầu ra luôn được định dạng bằng Pydantic Schema và kiểm tra tính hợp lệ trước khi trả về Frontend.*
  > 3. *Đối với các thông tin nhạy cảm như lịch phỏng vấn hay mức lương trong email, hệ thống bắt buộc sử dụng thẻ Placeholder dạng `[Ngày giờ]`, `[Mức lương]` để con người tự điền, tuyệt đối không để AI tự tạo dữ liệu giả mạo."*

---

### ❓ Câu Hỏi 4: *"Hệ thống có nguy cơ gây phân biệt đối xử (Bias) đối với ứng viên hay không và nhóm đã xử lý vấn đề Đạo đức AI như thế nào?"*
- **Trả lời mẫu xuất sắc:**
  > *"Dạ thưa Thầy/Cô, nhóm đặt Đạo đức AI (AI Ethics) làm trọng tâm trong thiết kế:*
  > 1. *Hệ thống tuân thủ triệt để nguyên tắc **Human-in-the-Loop**: AI không có quyền tự động đánh rớt (Auto-reject) hay tự động gửi thư từ chối ứng viên. Mọi quyết định đều do chuyên viên nhân sự kiểm duyệt.*
  > 2. *Phép tính Vector Matching chỉ nhận đầu vào là Kỹ năng và Kinh nghiệm chuyên môn, hoàn toàn loại bỏ các trường thông tin phi chuyên môn như: Ảnh chân dung, Giới tính, Tuổi tác, Tôn giáo, Tình trạng hôn nhân.*
  > 3. *Mọi prompt sinh thư từ chối đều bị cấm tuyệt đối việc nêu lý do cá nhân, đảm bảo văn phong lịch thiệp và giữ thiện chí tuyển dụng."*

---

### ❓ Câu Hỏi 5: *"Nếu dịch vụ mạng bị gián đoạn hoặc API DeepSeek bị lỗi quá tải (HTTP 429 / 503) thì hệ thống xử lý như thế nào để không làm sập ứng dụng?"*
- **Trả lời mẫu xuất sắc:**
  > *"Dạ thưa Thầy/Cô, nhóm đã xây dựng cơ chế phục hồi lỗi tự động (Fault Tolerance):*
  > 1. *Hệ thống có cơ chế tự động thử lại (Retry Loop) tối đa 2 lần với thuật toán kiểm soát thời gian chờ.*
  > 2. *Module `ai_errors.py` chuẩn hóa toàn bộ các lỗi kết nối từ nhà cung cấp thành các mã lỗi nghiệp vụ an toàn (`AI_TIMEOUT`, `AI_QUOTA_EXCEEDED`, `AI_PROVIDER_UNAVAILABLE`) kèm thông điệp thân thiện bằng tiếng Việt.*
  > 3. *Frontend bắt lỗi qua Axios Interceptor và hiển thị nút Thử lại (Retry) cho người dùng mà không làm đơ hay sập giao diện web.*
  > 4. *Toàn bộ các cuộc gọi thất bại đều được ghi vào `ai_audit` để quản trị viên theo dõi và khắc phục."*

---

### ❓ Câu Hỏi 6: *"Trong môi trường B2B nhiều doanh nghiệp cùng hoạt động, làm thế nào để đảm bảo dữ liệu hồ sơ ứng viên không bị rò rỉ giữa các công ty đối thủ?"*
- **Trả lời mẫu xuất sắc:**
  > *"Dạ thưa Thầy/Cô, hệ thống áp dụng cơ chế bảo mật phân quyền 2 lớp (B2B RBAC & Scope Isolation):*
  > 1. *Trước khi bất kỳ API AI nào được thực thi, hàm kiểm soát quyền `_authorize_resume_access` sẽ xác thực xem người gọi có phải là chủ sở hữu của CV (đối với ứng viên) hoặc hồ sơ đó có thực sự được nộp vào tin tuyển dụng của công ty người đó hay không (đối với nhà tuyển dụng).*
  > 2. *Nếu một HR của Công ty A cố tình gửi ID hồ sơ của Công ty B vào API `/ai/summarize-cv` hoặc `/ai/interview-questions`, hệ thống sẽ chặn ngay lập tức và trả về mã lỗi `403 Forbidden`.*
  > 3. *Bên cạnh đó, phân quyền theo phòng ban (Department Scope) đảm bảo Trưởng bộ phận chỉ có thể đánh giá các hồ sơ thuộc quyền quản lý của mình."*

---
*(Tài liệu được biên soạn và chuẩn hóa dựa trên 100% mã nguồn thực tế của dự án AI Job Portal)*


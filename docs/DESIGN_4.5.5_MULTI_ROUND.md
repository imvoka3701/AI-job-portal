# 4.5.5 — Thiết Kế Vòng Tuyển Dụng Nhiều Bước (Multi-Round Pipeline)

> **Trạng thái:** CHƯA CODE — Đang chờ duyệt thiết kế
> **Mục tiêu:** Thêm khái niệm "vòng tuyển dụng" mà không phá vỡ 46 E2E test đang dựa vào `Application.status`.

---

## 1. Đề xuất Schema: Phương án Bảng InterviewRound Riêng

**Phương án được chọn → Bảng `interview_rounds` (1-n với Application)**

### Lý do chọn bảng riêng thay vì mở rộng Application

| Tiêu chí | Bảng riêng (`interview_rounds`) | Mở rộng Application |
|---|---|---|
| **Không phá test cũ** | ✅ `Application.status` không đổi | ❌ Phải sửa enum `ApplicationStatus`, migrate data phức tạp |
| **Lịch sử vòng** | ✅ Mỗi vòng là 1 record, dễ truy vết "ứng viên rớt ở vòng nào" | ❌ Chỉ có `current_round`, mất lịch sử vòng cũ |
| **Lịch phỏng vấn (4.5.6)** | ✅ Mỗi vòng có `scheduled_at`, `location`, `notes` riêng | ❌ 1 application chỉ có 1 bộ schedule |
| **Độ phức tạp code** | 🟡 Thêm 1 model + CRUD + endpoint | ✅ Chỉ sửa schema + enum |
| **Migration** | ✅ Thêm bảng mới, không sửa bảng cũ | ❌ `ALTER TYPE applicationstatus ADD VALUE` + data migration |

**Kết luận:** Bảng riêng an toàn hơn, mở rộng tốt hơn, không phá test.

## 2. Schema `InterviewRound`

```python
# backend/app/models/interview_round.py

class RoundType(str, enum.Enum):
    CV_SCREEN = "cv_screen"       # Vòng 1: Duyệt CV
    TECH_INTERVIEW = "tech"       # Vòng 2: Phỏng vấn kỹ thuật
    HR_INTERVIEW = "hr"           # Vòng 3: Phỏng vấn HR/văn hóa
    FINAL = "final"               # Vòng cuối: Thương lượng offer
    CUSTOM = "custom"             # Vòng tùy chỉnh (nhà tuyển dụng tự đặt tên)

class RoundStatus(str, enum.Enum):
    PENDING = "pending"           # Chưa bắt đầu
    IN_PROGRESS = "in_progress"   # Đang chờ phản hồi / đã mời
    PASSED = "passed"             # Ứng viên qua vòng
    FAILED = "failed"             # Ứng viên rớt vòng này
    SKIPPED = "skipped"           # Bỏ qua vòng (vd: senior bỏ qua vòng CV)

class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id: int                              # PK
    application_id: int                  # FK → applications.id (NOT NULL, INDEX)

    # Thứ tự vòng
    round_number: int                    # 1, 2, 3...
    round_type: RoundType                # Loại vòng
    round_name: str | None               # Tên hiển thị ("Phỏng vấn kỹ thuật Python")

    # Trạng thái vòng
    status: RoundStatus                  # pending → passed/failed

    # Lịch (chi tiết để cho 4.5.6)
    scheduled_at: datetime | None        # Ngày giờ phỏng vấn
    location: str | None                 # Địa điểm / link Google Meet
    notes: str | None                    # Ghi chú cho HR (nội bộ, không hiện cho ứng viên)

    # Feedback
    reviewer_id: int | None              # FK → users.id (ai chấm vòng này?)
    score: int | None                    # Điểm vòng này (0-100)
    feedback: str | None                 # Nhận xét sau vòng

    created_at: datetime
    updated_at: datetime

    # Relationship
    application: "Application"           # back_populates
```

## 3. Cách Tương Thích Ngược — Map `status` Cũ ⇄ `Round` Mới

**NGUYÊN TẮC QUAN TRỌNG NHẤT:** `Application.status` **không bị xóa, không bị đổi tên, không bị đổi ý nghĩa**. 46 E2E test vẫn pass vì chúng chỉ kiểm tra `status` ở cấp Application.

Bảng `interview_rounds` là **lớp chi tiết hơn bên trên** — có thể có hoặc không. Khi Employer chưa tạo vòng, Application vẫn hoạt động như cũ.

### Mapping logic (KHI có rounds — ngược lại fallback về status cũ):

| `Application.status` | Nếu có `interview_rounds` (chi tiết) | Nếu KHÔNG có rounds (hiện tại) |
|---|---|---|
| `pending` | Chưa có round nào được tạo | Ứng viên mới nộp đơn (**giữ nguyên**) |
| `reviewed` | Round 1 (`cv_screen`) → `passed` | Employer đã xem CV (**giữ nguyên**) |
| `shortlisted` | Round 1 passed, Round 2 (`tech`) → `pending` | Được chọn vào vòng trong (**giữ nguyên**) |
| `interview` | Round hiện tại (`tech` hoặc `hr`) → `in_progress` | Đang phỏng vấn (**giữ nguyên**) |
| `accepted` | Tất cả rounds → `passed`, round cuối (`final/offer`) → `passed` | Trúng tuyển (**giữ nguyên**) |
| `rejected` | 1 round bất kỳ → `failed` (vd: rớt vòng 2 tech) | Bị từ chối (**giữ nguyên**) |

**Cách hoạt động — sync 2 chiều + tự động tạo Round 1:**

### Chiều 0: Khi Candidate nộp đơn `POST /applications` — tự động tạo Round 1

```python
# Trong POST /applications (thêm ~5 dòng sau db.refresh):
def create_application(data, current_user, db):
    application = crud_application.create(db, obj_in=data, candidate_id=current_user.id)
    # ... notify employer ...

    # ── NEW: tự động tạo Round 1 (Duyệt CV, pending) ──
    round1 = InterviewRound(
        application_id=application.id,
        round_number=1,
        round_type=RoundType.CV_SCREEN,
        round_name="Vòng 1: Duyệt CV",
        status=RoundStatus.PENDING,
    )
    db.add(round1)
    db.commit()

    return ApplicationRead.model_validate(application)
```

**Tại sao không phá test cũ?** Tất cả 13 test gọi `POST /applications` chỉ check:
- `resp.status_code == 201`
- `resp.json()["status"] == "pending"`
- `resp.json()["id"] > 0`

Response schema `ApplicationRead` không có field `rounds`. Round được tạo âm thầm trong DB — test không biết, không check, không bị ảnh hưởng. Test cũ pass y hệt.

**Lợi ích:** Mọi application sinh ra đều có ít nhất Round 1. Employer Dashboard có thể hiển thị ngay round này, không cần "tạo thủ công" cho application mới. Tính năng rounds thực sự "sống" với toàn bộ dữ liệu, không phải add-on rời rạc.

### Chiều A: Khi Employer dùng API cũ `PATCH /applications/{id}` đổi `status`

Đây chính là endpoint mà 46 E2E test đang gọi. **PHẢI tự động tạo 1 InterviewRound tương ứng** để giữ nhất quán:

```python
# Trong PATCH /applications/{id} (cập nhật logic hiện tại):
def update_application(application_id, data, ...):
    updated = crud_application.update(db, db_obj=app, obj_in=data)

    # ── NEW: tự động sync sang rounds ──────────────────
    if data.status:
        # Tính round_number tiếp theo
        existing_rounds = db.query(InterviewRound).filter(
            InterviewRound.application_id == app.id
        ).count()

        # Map ApplicationStatus → RoundType (best-effort)
        round_type_map = {
            "reviewed": RoundType.CV_SCREEN,
            "shortlisted": RoundType.TECH_INTERVIEW,
            "interview": RoundType.TECH_INTERVIEW,  # fallback, HR tự sửa
            "accepted": RoundType.FINAL,
            "rejected": RoundType.CUSTOM,
        }
        round_type = round_type_map.get(data.status, RoundType.CUSTOM)

        # ── Trước khi tạo round mới: dọn dẹp round mồ côi ──
        if data.status in ("accepted", "rejected"):
            orphan_status = RoundStatus.SKIPPED if data.status == "accepted" else RoundStatus.FAILED
            db.execute(
                update(InterviewRound)
                .where(
                    InterviewRound.application_id == app.id,
                    InterviewRound.status.in_([RoundStatus.PENDING, RoundStatus.IN_PROGRESS]),
                )
                .values(status=orphan_status)
            )

        # Tạo round "legacy sync" ghi lại thay đổi này
        new_round = InterviewRound(
            application_id=app.id,
            round_number=existing_rounds + 1,
            round_type=round_type,
            round_name=f"Auto: {data.status}",     # đánh dấu rõ là auto-gen
            status=RoundStatus.PASSED if data.status == "accepted" else RoundStatus.FAILED,
        )
        db.add(new_round)
        db.commit()
```

Với cách này:
- Test cũ gọi `PATCH /applications/{id} {"status":"reviewed"}` → tự động tạo round 1 (`cv_screen`, `passed`)
- `{"status":"accepted"}` → mọi round `pending`/`in_progress` → `skipped`, rồi tạo round auto-final `passed`
- `{"status":"rejected"}` → mọi round `pending`/`in_progress` → `failed`, rồi tạo round auto-reject `failed`
- Dữ liệu luôn sạch, không còn round "mồ côi" đứng mãi ở `pending`
- Round auto-gen có `round_name = "Auto: reviewed"` để phân biệt với round tạo thủ công

### Chiều B: Khi Employer dùng API mới `PATCH /applications/{id}/rounds/{round_id}`

Cập nhật round → tự động sync ngược lên `Application.status`:

```python
def update_round(round_id, data, ...):
    round = db.get(InterviewRound, round_id)
    round.status = data.status   # "passed" | "failed" | "in_progress"
    db.commit()

    # Sync lên Application.status
    app = db.get(Application, round.application_id)
    all_rounds = db.query(InterviewRound).filter(
        InterviewRound.application_id == app.id
    ).order_by(InterviewRound.round_number).all()

    # Logic: lấy round hiện tại đang active → map sang Application.status
    if any(r.status == RoundStatus.FAILED for r in all_rounds):
        app.status = ApplicationStatus.REJECTED
    elif all(r.status == RoundStatus.PASSED for r in all_rounds):
        app.status = ApplicationStatus.ACCEPTED
    else:
        # Có round đang pending/in_progress → map theo thứ tự
        current = next((r for r in all_rounds if r.status != RoundStatus.PASSED), all_rounds[-1])
        status_map = {
            RoundType.CV_SCREEN: ApplicationStatus.REVIEWED,
            RoundType.TECH_INTERVIEW: ApplicationStatus.INTERVIEW,
            RoundType.HR_INTERVIEW: ApplicationStatus.SHORTLISTED,
            RoundType.FINAL: ApplicationStatus.INTERVIEW,
        }
        app.status = status_map.get(current.round_type, ApplicationStatus.INTERVIEW)
    db.commit()
```

### Kết quả

```
                   ┌─────────────────────────┐
                   │   Application.status    │ ← Code cũ (test, FE cũ) đọc ở đây
                   │   (GIỮ NGUYÊN 100%)     │
                   └──────────┬──────────────┘
                              │ sync 2 chiều
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌───────────┐    ┌───────────────────┐    ┌───────────────┐
│ PATCH     │    │ PATCH             │    │ UI mới        │
│ /apps/{id}│    │ /apps/{id}/rounds │    │ (Dashboard)   │
│ (API cũ)  │    │ (API mới)         │    │               │
│           │    │                   │    │               │
│ Tự động   │    │ Tự động sync      │    │ Chỉ gọi API   │
│ tạo round │    │ ngược lên status  │    │ mới           │
│ "Auto"    │    │                   │    │               │
└───────────┘    └───────────────────┘    └───────────────┘
```

## 4. Danh Sách Endpoint & Test Bị Ảnh Hưởng

### 4.1 Endpoint GIỮ NGUYÊN (không đụng)

| Endpoint | Lý do |
|---|---|
| `GET /applications/me` | Trả về `ApplicationRead` có `status` — vẫn hoạt động bình thường |
| `POST /applications` | Tạo application mới — không liên quan rounds |
| `GET /applications/{id}` | Trả về single app — không đổi |
| `GET /applications/employer/jobs/{job_id}` | Trả về `EmployerApplicationRead` — rounds không có trong response |
| `GET /jobs` / `GET /jobs/{id}` | Không liên quan |
| `GET /admin/stats` / `GET /admin/jobs` / `GET /admin/users` | Không query `applicationstatus` enum trực tiếp |
| `POST /ai/*` (match, evaluate, roadmap, summarize-cv, interview-questions, generate-email) | Không liên quan |
| `GET /employer/stats` | Chỉ đếm `COUNT(*)` từ applications, không filter theo status |

### 4.2 Endpoint MỞ RỘNG (thêm rounds)

| Endpoint | Thay đổi |
|---|---|
| `POST /applications/{id}/rounds` | **MỚI** — Tạo round mới cho application |
| `GET /applications/{id}/rounds` | **MỚI** — Lấy danh sách rounds của application |
| `PATCH /applications/{id}/rounds/{round_id}` | **MỚI** — Cập nhật trạng thái round (pass/fail) + tự động sync `Application.status` |
| `PATCH /applications/{id}` | **GIỮ NGUYÊN** — vẫn có thể đổi status thủ công như cũ (cho test cũ) |

### 4.3 Test Bị Ảnh Hưởng (backend pytest 47 tests)

| Test | Ảnh hưởng | Cách giữ pass |
|---|---|---|
| `test_applications.py` (11 tests) | 3 test đọc/ghi `status`: `test_employer_updates_to_reviewed`, `test_employer_updates_to_shortlisted`, `test_employer_rejects_candidate` | **Không đổi** — `status` vẫn dùng như cũ, rounds optional |
| `test_ai.py` (15 tests) | Test `_create_job` + apply pattern — dùng `status` | **Không đổi** — không liên quan rounds |
| `test_users.py` (8 tests) | Không liên quan | **Không đổi** |
| `test_resumes.py` (10 tests) | Không liên quan | **Không đổi** |
| `test_auth.py` (3 tests) | Không liên quan | **Không đổi** |

### 4.4 Test Bị Ảnh Hưởng (Playwright E2E 46 tests)

| Test | Ảnh hưởng | Cách giữ pass |
|---|---|---|
| Phase 1: Step 2.5 `Employer cập nhật status → reviewed` | Check `application.status == "reviewed"` | **Không đổi** — `status` vẫn là `reviewed` như cũ |
| Phase 1: Step 2.6 `Candidate thấy status updated` | Check `myApp.status == "reviewed"` | **Không đổi** |
| Phase 1 Lớp 3: `Ứng tuyển thành công` | Check có chữ "pending" | **Không đổi** |
| Phase 2: Step 1.5 `status pending` | Check `application.status == "pending"` | **Không đổi** |
| Phase 2 Lớp 3: Dashboard buttons | Click buttons không liên quan status | **Không đổi** |
| Phase 4: Admin tests | Không query `applicationstatus` | **Không đổi** |

**Kết luận: KHÔNG test nào bị phá.** Tất cả test chỉ check `Application.status` — field này giữ nguyên hoàn toàn. Bảng `interview_rounds` là add-on, không thay thế.

## 5. Migration

```python
# Migration 005: Thêm bảng interview_rounds

def upgrade():
    op.create_table(
        "interview_rounds",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(),
                  sa.ForeignKey("applications.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("round_type", sa.String(50), nullable=False),          # cv_screen | tech | hr | final | custom
        sa.Column("round_name", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False,
                  server_default="pending"),                             # pending | in_progress | passed | failed | skipped
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("reviewer_id", sa.Integer(),
                  sa.ForeignKey("users.id"), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Dữ liệu mẫu cho các application hiện có (để demo không bị trống):
    # Với mỗi application có status != "pending":
    #   → tự động tạo 1 round tương ứng với status hiện tại
    #   (không cần seed — chỉ làm khi code UI hoàn chỉnh)
```

**Tổng files backend mới/thay đổi:**

| File | Action |
|---|---|
| `app/models/interview_round.py` | **New** — Model + Enum (RoundType, RoundStatus) |
| `app/models/__init__.py` | Edit — import model mới |
| `app/models/application.py` | Edit — thêm `interview_rounds` relationship |
| `app/routers/applications.py` | Edit — **POST / (create): auto-create Round 1 (`cv_screen`, pending)** + **PATCH /{id}: auto-create InterviewRound khi đổi status** |
| `app/schemas/interview_round.py` | **New** — RoundCreate, RoundRead, RoundUpdate |
| `app/crud/interview_round.py` | **New** — CRUD + sync logic (both directions) |
| `app/routers/interview_rounds.py` | **New** — 3 endpoints |
| `app/main.py` | Edit — include router mới |
| `alembic/versions/005_add_interview_rounds.py` | **New** — Migration |
| `tests/test_interview_rounds.py` | **New** — Test CRUD + **test PATCH cũ tự động tạo round** + test sync 2 chiều |

**Tổng file cũ cần sửa: 3** (models/__init__.py, main.py, applications.py).

## 6. Tóm tắt để duyệt

| Mục | Quyết định |
|---|---|
| Schema | ✅ Bảng `interview_rounds` riêng (1-n Application) |
| Tương thích ngược | ✅ `Application.status` giữ nguyên, rounds là optional detail |
| 46 E2E test | ✅ Không test nào bị phá. POST tạo round ẩn, PATCH cũ tạo round sync. Response `ApplicationRead` không có `rounds` nên không đổi |
| 47 backend test | ✅ 13 test POST + 3 test PATCH status vẫn pass. Thêm test verify Round 1 được tạo sau apply |
| Số file mới | 8 files |
| Số file cũ sửa | 3 files (models/__init__.py, main.py, applications.py) |

**Điểm mấu chốt:** `applications.py` là file cũ duy nhất cần sửa logic — thêm ~10 dòng vào `PATCH /{id}` để auto-create InterviewRound. Phần còn lại của file giữ nguyên. CRUD/Schema application cũ không đụng.

**Sau khi duyệt:** tôi sẽ code migration → backend CRUD → sync logic trong applications.py → test → UI + E2E.

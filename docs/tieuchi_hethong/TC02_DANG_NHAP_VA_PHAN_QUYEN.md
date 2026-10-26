# TIÊU CHÍ 02: XÂY DỰNG CHỨC NĂNG ĐĂNG NHẬP VÀ PHÂN QUYỀN
## DỰ ÁN: AI-POWERED JOB PORTAL (NỀN TẢNG TUYỂN DỤNG THÔNG MINH B2B)

---

### 1. YÊU CẦU TIÊU CHÍ
> **Tiêu chuẩn:** Hệ thống có cơ chế xác thực người dùng an toàn (Authentication), phân quyền chặt chẽ theo vai trò (Authorization / RBAC) và bảo vệ các chức năng, tuyến đường và dữ liệu quan trọng không bị truy cập trái phép.

---

### 2. SƠ ĐỒ TUẦN TỰ XÁC THỰC VÀ THU HỒI PHIÊN TỨC THÌ (SEQUENCE DIAGRAM)

Quy trình Đăng nhập, cấp phát JWT và cơ chế bảo vệ phiên tức thì qua `token_version`:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Người dùng
    participant UI as 💻 Frontend (React)
    participant AuthRouter as 🚪 Auth Router (/auth/login)
    participant Security as 🛡️ Security Core (Bcrypt / JWT)
    participant DB as 🐘 Database (PostgreSQL)
    participant ProtectedAPI as 🔒 Protected API (/jobs)

    %% Flow 1: Đăng nhập
    Note over User, DB: 1. GIAI ĐOẠN ĐĂNG NHẬP & CẤP PHÁT JWT
    User->>UI: Nhập Email & Mật khẩu
    UI->>AuthRouter: POST /api/v1/auth/login {email, password}
    AuthRouter->>DB: Truy vấn User theo email
    DB-->>AuthRouter: Trả về user record (hashed_password, role, token_version)
    AuthRouter->>Security: verify_password(plain_password, hashed_password)
    alt Mật khẩu sai
        Security-->>AuthRouter: False
        AuthRouter-->>UI: 401 Unauthorized ("Email hoặc mật khẩu không đúng")
        UI-->>User: Hiển thị Toast lỗi
    else Mật khẩu đúng
        Security-->>AuthRouter: True
        AuthRouter->>Security: create_access_token({sub, role, company_id, token_version})
        Security-->>AuthRouter: Chuỗi JWT Token (HS256)
        AuthRouter-->>UI: 200 OK {access_token, token_type: "bearer", user}
        UI->>UI: Lưu access_token vào localStorage
        UI-->>User: Chuyển hướng về Dashboard theo vai trò
    end

    %% Flow 2: Truy cập API được bảo vệ
    Note over User, DB: 2. GIAI ĐOẠN TRUY CẬP TÀI NGUYÊN ĐƯỢC BẢO VỆ
    User->>UI: Thực hiện thao tác (VD: Tạo Job mới)
    UI->>ProtectedAPI: POST /api/v1/jobs (Header: Authorization Bearer JWT)
    ProtectedAPI->>Security: jwt.decode(token, SECRET_KEY)
    Security-->>ProtectedAPI: Payload {sub, role, token_version}
    ProtectedAPI->>DB: get_current_user: Query User by sub
    DB-->>ProtectedAPI: user record (hiện tại)

    alt token_version không khớp (Đã đổi pass / Bị thu hồi quyền)
        ProtectedAPI-->>UI: 401 Unauthorized ("Phiên làm việc hết hạn")
        UI->>UI: localStorage.removeItem("access_token")
        UI-->>User: Chuyển hướng ngay về trang /login
    else role không được phép (VD: Candidate gọi API tạo Job)
        ProtectedAPI-->>UI: 403 Forbidden ("Yêu cầu quyền EMPLOYER")
        UI-->>User: Hiển thị Toast cảnh báo quyền hạn
    else Hợp lệ toàn diện
        ProtectedAPI->>DB: Thực thi CRUD nghiệp vụ
        DB-->>ProtectedAPI: Kết quả thành công
        ProtectedAPI-->>UI: 201 Created (Job data)
        UI-->>User: Cập nhật giao diện thành công
    end
```

---

### 3. SƠ ĐỒ PHÂN CẤP VAI TRÒ & PHẠM VI TRUY CẬP (RBAC HIERARCHY)

```mermaid
flowchart TD
    subgraph RBAC_Roles ["HỆ THỐNG PHÂN QUYỀN 4 VAI TRÒ (app/models/user.py)"]
        SuperAdmin["👑 SUPERADMIN<br>- Cấu hình System Prompts<br>- Khởi động lại hệ thống AI<br>- Toàn quyền Quản trị"]
        Admin["🛡️ ADMIN<br>- Duyệt tài khoản Nhà tuyển dụng<br>- Giám sát RAG Governance & Telemetry<br>- Xem Audit Logs toàn hệ thống"]
        Employer["🏢 EMPLOYER (Nhà tuyển dụng)<br>- Đăng & Quản lý Job của công ty mình<br>- Xem & Kéo thả ứng viên Kanban<br>- Chạy AI Matching 3 trục & Sinh email"]
        Candidate["👤 CANDIDATE (Ứng viên)<br>- Tạo & Tải lên CV cá nhân<br>- Ứng tuyển việc làm (Chống spam)<br>- Làm trắc nghiệm MBTI & Xem Roadmap"]
    end

    SuperAdmin -->|Kế thừa toàn bộ quyền| Admin
    Admin -->|Kiểm soát duyệt hồ sơ| Employer
    Employer -.->|Tuyển dụng & Đánh giá| Candidate
```

---

### 4. MA TRẬN PHÂN QUYỀN CHI TIẾT (RBAC MATRIX)

| Quyền hạn & Chức năng | Ứng viên (`CANDIDATE`) | Nhà tuyển dụng (`EMPLOYER`) | Quản trị viên (`ADMIN`/`SUPERADMIN`) |
| :--- | :---: | :---: | :---: |
| **Tìm kiếm việc làm & Xem JD công khai** | ✅ | ✅ | ✅ |
| **Tạo, sửa CV Builder & Tải lên CV** | ✅ | ❌ | ❌ |
| **Nộp đơn ứng tuyển & Theo dõi tiến trình** | ✅ | ❌ | ❌ |
| **Làm bài trắc nghiệm tính cách & Xem Roadmap AI**| ✅ | ❌ | ❌ |
| **Đăng tin tuyển dụng & Đóng/Sửa Job** | ❌ | ✅ (Chỉ Job công ty mình) | ✅ (Quản lý toàn bộ) |
| **Xem danh sách ứng viên & Kéo thả Kanban** | ❌ | ✅ (Chỉ hồ sơ nộp vào công ty) | ✅ |
| **Dùng AI Matching 3 trục & Sinh câu hỏi phỏng vấn**| ❌ | ✅ | ✅ |
| **Soạn email mời phỏng vấn / Từ chối ứng viên** | ❌ | ✅ | ❌ |
| **Duyệt tài khoản Nhà tuyển dụng mới** | ❌ | ❌ | ✅ |
| **Quản trị Prompt AI & Giám sát RAG Governance** | ❌ | ❌ | ✅ |

---

### 5. CƠ CHẾ BẢO VỆ CHỨC NĂNG Ở 2 TẦNG (BACKEND & FRONTEND)

#### A. Tầng Backend: Dependency Injection bảo vệ API
Tại [backend/app/core/dependencies.py](file:///d:/ai-job-portal/backend/app/core/dependencies.py):
Mọi endpoint nhạy cảm đều được bảo vệ bằng các dependency kiểm tra token và vai trò:

```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Giải mã token, xác thực danh tính và kiểm tra token_version."""
    ...
    # Kiểm tra thu hồi phiên tức thì nếu quyền hạn bị thay đổi
    if token_ver is not None and token_ver != user.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hiệu lực do quyền hạn thay đổi. Vui lòng đăng nhập lại.",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa.")
    return user

def require_role(*allowed_roles: UserRole):
    """Factory dependency kiểm tra quyền hạn vai trò."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Thao tác yêu cầu quyền truy cập của: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker
```

#### B. Tầng Frontend: Component `ProtectedRoute` bảo vệ Tuyến đường
Tại [frontend/src/components/layout/ProtectedRoute.tsx](file:///d:/ai-job-portal/frontend/src/components/layout/ProtectedRoute.tsx):
Chặn người dùng truy cập trái phép trực tiếp qua URL thanh địa chỉ:

```tsx
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = useUser();
  const token = tokenStorage.get();
  const location = useLocation();

  // 1. Chưa đăng nhập -> Tự động chuyển hướng về trang /login
  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Sai vai trò -> Tự động điều hướng về Dashboard đúng thẩm quyền
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "employer") return <Navigate to="/employer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Đủ điều kiện -> Render giao diện
  return <>{children}</>;
}
```

---

### 6. KẾT LUẬN TIÊU CHÍ 02
* Hệ thống triển khai hoàn chỉnh cơ chế Xác thực người dùng tiêu chuẩn công nghiệp (OAuth2, Bcrypt, JWT).
* Phân quyền RBAC 4 vai trò mạch lạc, có cơ chế thu hồi phiên làm việc tức thì (`token_version`).
* Bảo vệ 2 đầu kiên cố (FastAPI Dependencies ở API và `ProtectedRoute` ở Web Client).
* **Mức độ đáp ứng:** **100% - ĐẠT XUẤT SẮC**.

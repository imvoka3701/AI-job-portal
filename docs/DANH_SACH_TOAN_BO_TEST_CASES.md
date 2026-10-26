# BẢNG TỔNG HỢP DANH MỤC TOÀN BỘ TEST CASES HỆ THỐNG (KÈM GHI CHÚ TIẾNG VIỆT)
## DỰ ÁN: AI-POWERED JOB PORTAL (NỀN TẢNG TUYỂN DỤNG THÔNG MINH B2B)

> **Ghi chú kỹ thuật:** Toàn bộ 398 test cases dưới đây được trích xuất 100% từ mã nguồn thực tế của dự án (`backend/tests/` và `frontend/tests/e2e/`), được phân loại chi tiết theo từng bộ phận và đi kèm **ghi chú giải thích nghiệp vụ bằng tiếng Việt chuẩn mực**, phục vụ trực tiếp cho báo cáo tổng kết và đồ án chuyên sâu.

---

### 1. TỔNG QUAN THỐNG KÊ TOÀN DỰ ÁN

- **Tổng số Test Cases Backend:** **341** test cases (phân bố trên **42** tệp kiểm thử Pytest)
- **Tổng số Test Cases Frontend E2E:** **57** test cases (phân bố trên **8** tệp Playwright spec)
- **TỔNG CỘNG TOÀN HỆ THỐNG:** **398 TEST CASES**

| Phân hệ / Bộ phận Chức năng | Số lượng Test Files | Số lượng Test Cases | Mục tiêu & Phạm vi Kiểm định |
| :--- | :---: | :---: | :--- |
| 1. Bộ phận Xác thực, Phân quyền & Bảo mật Phiên (Auth, RBAC & Security) | 7 files | **53 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 2. Bộ phận Quản lý Tin tuyển dụng & Doanh nghiệp (Jobs & Companies) | 4 files | **34 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 3. Bộ phận Hồ sơ Ứng viên, CV & Chuẩn hóa Định dạng (Resumes & CV Documents) | 3 files | **31 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 4. Bộ phận Quy trình Tuyển dụng, Phễu Kanban & Phỏng vấn (Applications & Interviews) | 6 files | **58 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 5. Bộ phận Trí tuệ Nhân tạo AI, RAG & pgvector (AI Matching, Prompts & Vector Search) | 11 files | **96 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 6. Bộ phận Quản trị Hệ thống, Giám sát AI & Báo cáo (Admin Governance & Analytics) | 6 files | **47 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 7. Bộ phận Tương tác Thời gian thực & Tác vụ Nền (Chat, Notifications & Background Tasks) | 4 files | **16 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 8. Bộ phận Kiểm thử Luồng Tổng thể Backend (Backend End-to-End Flows) | 1 files | **6 tests** | Kiểm thử đơn vị (Unit) & Tích hợp (Integration) API Backend |
| 9. Bộ phận Giao diện & Trải nghiệm E2E (Frontend Playwright Specs) | 8 files | **57 tests** | Kiểm thử luồng tương tác thực tế người dùng trên trình duyệt |
| **TỔNG HỢP TOÀN HỆ THỐNG** | **50 files** | **398 tests** | **Bao phủ toàn diện từ API, CSDL, AI Engine đến Giao diện** |

---

### 2. CHI TIẾT TEST CASES BACKEND THEO TỪNG BỘ PHẬN (341 TESTS)

#### 1. Bộ phận Xác thực, Phân quyền & Bảo mật Phiên (Auth, RBAC & Security) (Tổng cộng: 53 Tests)

##### 📄 Tệp kiểm thử: `test_auth.py` (10 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestRegister::test_register_candidate` | L7 | Đăng ký tài khoản Ứng viên mới thành công, kiểm tra mật khẩu được băm bcrypt và cờ is_active = True |
| 2 | `TestRegister::test_register_duplicate_email` | L23 | Chặn đăng ký email trùng lặp, trả về mã lỗi HTTP 409 Conflict với thông điệp cảnh báo rõ ràng |
| 3 | `TestRegister::test_cannot_register_as_admin` | L34 | Bảo mật: Ngăn chặn tuyệt đối người dùng tự gán vai trò Admin khi đăng ký qua API công khai |
| 4 | `TestLogin::test_login_success` | L50 | Đăng nhập thành công với thông tin hợp lệ, trả về JWT Access Token và thông tin định danh người dùng |
| 5 | `TestLogin::test_login_invalid_password` | L69 | Từ chối đăng nhập với mật khẩu không đúng, trả về mã lỗi HTTP 401 Unauthorized |
| 6 | `TestOAuthStateAndCSRF::test_sign_and_verify_oauth_state` | L81 | Tạo và thẩm định chữ ký bảo mật HMAC-SHA256 cho tham số state trong luồng đăng nhập OAuth2 |
| 7 | `TestOAuthStateAndCSRF::test_google_login_not_configured` | L121 | Trả về mã HTTP 501 Not Implemented khi máy chủ chưa cấu hình Google Client ID |
| 8 | `TestOAuthStateAndCSRF::test_google_login_sets_state_cookie` | L129 | Bắt đầu luồng Google Login: Chuyển hướng đến Google OAuth và gắn kèm signed cookie oauth_state |
| 9 | `TestOAuthStateAndCSRF::test_google_callback_rejects_missing_or_invalid_state` | L153 | Từ chối Google Callback với mã lỗi HTTP 400 nếu tham số hoặc cookie state bị sai lệch hoặc giả mạo |
| 10 | `TestOAuthStateAndCSRF::test_google_callback_success_redirects_with_fragment_and_clears_cookie` | L178 | Google Callback hợp lệ: Đổi Authorization Code lấy token, điều hướng frontend qua URL hash (#token=...) và xóa cookie |

##### 📄 Tệp kiểm thử: `test_auth_forgot_password.py` (4 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_forgot_password_success` | L12 | Yêu cầu đặt lại mật khẩu thành công: Tạo mã xác thực khôi phục và gửi thông báo cho người dùng |
| 2 | `test_forgot_password_user_not_found` | L66 | Chống rò rỉ tài khoản (Anti-user enumeration): Luôn trả về HTTP 200 kể cả khi email chưa đăng ký |
| 3 | `test_forgot_password_invalidates_active_sessions` | L83 | Bảo mật phiên: Đổi mật khẩu thành công lập tức tăng token_version để vô hiệu hóa toàn bộ JWT cũ |
| 4 | `test_forgot_password_invalid_email` | L139 | Kiểm tra tính hợp lệ: Báo lỗi 422 Unprocessable Entity khi định dạng email không đúng chuẩn |

##### 📄 Tệp kiểm thử: `test_users.py` (11 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestProfileCRUD::test_get_own_profile` | L58 | Xem thông tin hồ sơ cá nhân của chính mình (đầy đủ email, số điện thoại, vai trò) |
| 2 | `TestProfileCRUD::test_update_own_profile` | L67 | Cập nhật thông tin hồ sơ cá nhân (họ tên, ảnh đại diện, số điện thoại liên lạc) |
| 3 | `TestProfileCRUD::test_get_user_by_id_unauthenticated` | L77 | Từ chối truy cập thông tin người dùng với mã HTTP 401 khi chưa đăng nhập |
| 4 | `TestProfileCRUD::test_get_user_by_id_as_self` | L82 | Người dùng tự tra cứu hồ sơ của chính mình theo ID, trả về đầy đủ các trường bảo mật |
| 5 | `TestProfileCRUD::test_get_user_by_id_as_other_user_redacts_pii` | L90 | Bảo vệ dữ liệu cá nhân (PII): Người dùng xem hồ sơ người khác sẽ tự động bị ẩn email và số điện thoại |
| 6 | `TestProfileCRUD::test_get_nonexistent_user` | L108 | Kiểm thử chức năng API và các ràng buộc toàn vẹn của nghiệp vụ `TestProfileCRUD::test_get_nonexistent_user` |
| 7 | `TestIsActiveGate::test_candidate_active_by_default` | L115 | Candidate phải được active immediately after registration. |
| 8 | `TestIsActiveGate::test_employer_inactive_by_default` | L132 | Employer should NOT be active right after registration — login blocked. |
| 9 | `TestIsActiveGate::test_inactive_employer_blocked_from_all_endpoints` | L149 | An inactive nhà tuyển dụng cannot access any authenticated endpoint (login fails → no token). |
| 10 | `TestIsActiveGate::test_activate_then_login` | L168 | After activation (admin approve), nhà tuyển dụng should login thành côngly. |
| 11 | `TestIsActiveGate::test_admin_never_blocked` | L195 | Admin accounts should always be active. |

##### 📄 Tệp kiểm thử: `test_admin_rbac.py` (6 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_admin_rbac_permissions_and_roles` | L75 | Kiểm tra tính hợp lệ của quyền hạn khi thực thi tác vụ quản trị chuyên biệt |
| 2 | `test_admin_rbac_create_and_delete_custom_role` | L97 | Xóa vai trò quản trị viên và tự động thu hồi quyền của các người dùng liên quan |
| 3 | `test_admin_rbac_token_version_invalidation` | L125 | Kiểm thử cơ chế phân quyền quản trị viên Admin RBAC và kiểm soát truy cập |
| 4 | `test_unassigned_admin_has_no_permissions` | L183 | Kiểm tra tính hợp lệ của quyền hạn khi thực thi tác vụ quản trị chuyên biệt |
| 5 | `test_cannot_demote_or_unassign_last_super_admin` | L216 | Kiểm thử cơ chế phân quyền quản trị viên Admin RBAC và kiểm soát truy cập |
| 6 | `test_deactivating_user_invalidates_token` | L230 | Kiểm thử cơ chế phân quyền quản trị viên Admin RBAC và kiểm soát truy cập |

##### 📄 Tệp kiểm thử: `test_candidate_security.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_resume_idor_prevention` | L47 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |
| 2 | `test_cv_document_idor_prevention` | L86 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |
| 3 | `test_resume_upload_fake_mime_type_rejected` | L111 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |
| 4 | `test_resume_upload_oversized_rejected` | L125 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |
| 5 | `test_prompt_armor_unit_detection` | L139 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |
| 6 | `test_assistant_chat_prompt_injection_interception` | L161 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |
| 7 | `test_cv_evaluator_prompt_injection_rejection` | L190 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |
| 8 | `test_file_upload_rate_limiting` | L212 | Bảo mật Ứng viên: Kiểm tra cô lập dữ liệu hồ sơ, ngăn chặn ứng viên xem hoặc can thiệp dữ liệu ứng viên khác |

##### 📄 Tệp kiểm thử: `test_employer_security.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_cross_company_job_idor_prevention` | L109 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |
| 2 | `test_cross_company_application_and_rounds_idor` | L140 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |
| 3 | `test_cross_company_team_management_idor` | L184 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |
| 4 | `test_company_privilege_escalation_non_owner` | L207 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |
| 5 | `test_ai_generate_jd_role_enforcement` | L245 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |
| 6 | `test_ai_generate_jd_prompt_armor_blocks_injection` | L261 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |
| 7 | `test_ai_generate_email_cross_company_idor` | L288 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |
| 8 | `test_rag_search_rate_limiting_enforcement` | L319 | Bảo mật Doanh nghiệp: Kiểm tra hàng rào Multi-tenant Fencing, ngăn chặn nhà tuyển dụng xem đơn nộp vào công ty khác |

##### 📄 Tệp kiểm thử: `test_security_issue9.py` (6 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_auth_register_rate_limit` | L19 | Kiểm tra phòng chống lỗ hổng bảo mật: Thẩm định phân quyền, kiểm tra rò rỉ token và phòng vệ dữ liệu |
| 2 | `test_auth_login_rate_limit` | L50 | Kiểm tra phòng chống lỗ hổng bảo mật: Thẩm định phân quyền, kiểm tra rò rỉ token và phòng vệ dữ liệu |
| 3 | `test_rate_limiter_memory_cleanup` | L87 | Kiểm tra phòng chống lỗ hổng bảo mật: Thẩm định phân quyền, kiểm tra rò rỉ token và phòng vệ dữ liệu |
| 4 | `test_security_headers_middleware` | L111 | Kiểm tra phòng chống lỗ hổng bảo mật: Thẩm định phân quyền, kiểm tra rò rỉ token và phòng vệ dữ liệu |
| 5 | `test_production_secret_key_validation` | L120 | Kiểm tra phòng chống lỗ hổng bảo mật: Thẩm định phân quyền, kiểm tra rò rỉ token và phòng vệ dữ liệu |
| 6 | `test_production_docs_disabled` | L157 | Kiểm tra phòng chống lỗ hổng bảo mật: Thẩm định phân quyền, kiểm tra rò rỉ token và phòng vệ dữ liệu |

#### 2. Bộ phận Quản lý Tin tuyển dụng & Doanh nghiệp (Jobs & Companies) (Tổng cộng: 34 Tests)

##### 📄 Tệp kiểm thử: `test_jobs.py` (14 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestJobsList::test_list_jobs_empty` | L77 | Lấy danh sách tin tuyển dụng công khai kèm phân trang và sắp xếp theo thời gian mới nhất |
| 2 | `TestJobsList::test_get_job_not_found` | L85 | Kiểm thử các nghiệp vụ quản lý vòng đời tin tuyển dụng (CRUD Jobs) |
| 3 | `TestJobCreate::test_employer_can_create_job` | L92 | Nhà tuyển dụng đăng tin tuyển dụng mới với đầy đủ tiêu đề, mô tả, yêu cầu kỹ năng và mức lương |
| 4 | `TestJobCreate::test_candidate_cannot_create_job` | L102 | Nhà tuyển dụng đăng tin tuyển dụng mới với đầy đủ tiêu đề, mô tả, yêu cầu kỹ năng và mức lương |
| 5 | `TestJobCreate::test_unauthenticated_cannot_create_job` | L108 | Nhà tuyển dụng đăng tin tuyển dụng mới với đầy đủ tiêu đề, mô tả, yêu cầu kỹ năng và mức lương |
| 6 | `TestJobUpdate::test_employer_can_update_job` | L115 | Chỉnh sửa nội dung tin tuyển dụng thuộc sở hữu của doanh nghiệp |
| 7 | `TestJobUpdate::test_update_nonexistent_job` | L131 | Kiểm thử các nghiệp vụ quản lý vòng đời tin tuyển dụng (CRUD Jobs) |
| 8 | `TestJobUpdate::test_employer_update_job_regenerates_embedding` | L137 | Chỉnh sửa nội dung tin tuyển dụng thuộc sở hữu của doanh nghiệp |
| 9 | `TestJobDelete::test_employer_can_delete_job` | L171 | Đóng tin tuyển dụng hoặc chuyển trạng thái ngưng nhận hồ sơ |
| 10 | `TestJobDelete::test_delete_job_with_applications_soft_deletes` | L185 | Đóng tin tuyển dụng hoặc chuyển trạng thái ngưng nhận hồ sơ |
| 11 | `TestJobFilters::test_filter_by_keyword` | L218 | Lọc tin tuyển dụng đa chiều theo địa điểm, mức lương min/max, cấp bậc (senior/junior) và hình thức làm việc |
| 12 | `TestJobFilters::test_filter_by_job_type` | L234 | Lọc tin tuyển dụng đa chiều theo địa điểm, mức lương min/max, cấp bậc (senior/junior) và hình thức làm việc |
| 13 | `TestJobFilters::test_pagination` | L243 | Lọc tin tuyển dụng đa chiều theo địa điểm, mức lương min/max, cấp bậc (senior/junior) và hình thức làm việc |
| 14 | `TestJobGet::test_get_existing_job` | L264 | Kiểm thử các nghiệp vụ quản lý vòng đời tin tuyển dụng (CRUD Jobs) |

##### 📄 Tệp kiểm thử: `test_company_team.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_owner_can_manage_departments_and_invite_department_head` | L47 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |
| 2 | `test_company_members_are_tenant_isolated` | L115 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |
| 3 | `test_invitation_expiry_resend_reuse_decline_and_revoke` | L141 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |
| 4 | `test_membership_status_and_ownership_changes_apply_immediately` | L239 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |
| 5 | `test_department_scope_can_be_extended_with_explicit_job_assignment` | L326 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |
| 6 | `test_department_head_can_evaluate_but_hr_owns_final_decision` | L410 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |
| 7 | `test_batch_job_assignments_and_company_activity_are_tenant_scoped` | L519 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |
| 8 | `test_batch_job_assignments_are_atomic_and_reject_cross_tenant_ids` | L617 | Kiểm thử quản lý đội ngũ tuyển dụng trong doanh nghiệp: Mời thành viên, phân quyền và xóa thành viên |

##### 📄 Tệp kiểm thử: `test_employer_settings.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestGetSettings::test_get_settings_returns_company_profile` | L44 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |
| 2 | `TestGetSettings::test_get_settings_unauthenticated` | L54 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |
| 3 | `TestGetSettings::test_get_settings_candidate_forbidden` | L59 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |
| 4 | `TestUpdateSettings::test_patch_updates_company_profile` | L80 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |
| 5 | `TestUpdateSettings::test_patch_partial_update` | L107 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |
| 6 | `TestUpdateSettings::test_patch_persists_after_get` | L119 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |
| 7 | `TestUpdateSettings::test_patch_empty_body_returns_400` | L130 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |
| 8 | `TestUpdateSettings::test_patch_and_get_ai_weights_and_webhook_config` | L136 | Kiểm thử cập nhật cài đặt hồ sơ doanh nghiệp: Tên công ty, logo, địa chỉ, website và quy mô nhân sự |

##### 📄 Tệp kiểm thử: `test_recruitment_requests.py` (4 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_recruitment_request_full_workflow_and_job_conversion` | L103 | Kiểm thử quy trình phê duyệt yêu cầu tuyển dụng nội bộ giữa các phòng ban và bộ phận nhân sự |
| 2 | `test_recruitment_request_rejection_resubmit_and_tenant_isolation` | L178 | Kiểm thử quy trình phê duyệt yêu cầu tuyển dụng nội bộ giữa các phòng ban và bộ phận nhân sự |
| 3 | `test_invitation_delivery_tracking_failure_retry_and_bounce` | L235 | Kiểm thử quy trình phê duyệt yêu cầu tuyển dụng nội bộ giữa các phòng ban và bộ phận nhân sự |
| 4 | `test_invitation_email_service_sends_structured_message` | L300 | Kiểm thử quy trình phê duyệt yêu cầu tuyển dụng nội bộ giữa các phòng ban và bộ phận nhân sự |

#### 3. Bộ phận Hồ sơ Ứng viên, CV & Chuẩn hóa Định dạng (Resumes & CV Documents) (Tổng cộng: 31 Tests)

##### 📄 Tệp kiểm thử: `test_resumes.py` (15 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestResumeUpload::test_upload_pdf_success` | L96 | Tải lên tệp CV (PDF/DOCX), trích xuất văn bản thô và cấu trúc hóa kỹ năng/kinh nghiệm |
| 2 | `TestResumeUpload::test_upload_text_too_short` | L119 | Tải lên tệp CV (PDF/DOCX), trích xuất văn bản thô và cấu trúc hóa kỹ năng/kinh nghiệm |
| 3 | `TestResumeUpload::test_upload_non_pdf_rejected` | L130 | Tải lên tệp CV (PDF/DOCX), trích xuất văn bản thô và cấu trúc hóa kỹ năng/kinh nghiệm |
| 4 | `TestResumeUpload::test_requires_auth` | L140 | Tải lên tệp CV (PDF/DOCX), trích xuất văn bản thô và cấu trúc hóa kỹ năng/kinh nghiệm |
| 5 | `TestResumeCRUD::test_get_my_resumes` | L150 | Lấy danh sách các bản CV đã lưu của ứng viên đang đăng nhập |
| 6 | `TestResumeCRUD::test_get_resume_by_id` | L157 | Lấy danh sách các bản CV đã lưu của ứng viên đang đăng nhập |
| 7 | `TestResumeCRUD::test_delete_resume` | L178 | Xóa bản CV và tự động dọn dẹp các đoạn vector embedding liên quan |
| 8 | `TestResumeCRUD::test_cannot_delete_others_resume` | L202 | Xóa bản CV và tự động dọn dẹp các đoạn vector embedding liên quan |
| 9 | `TestResumeCRUD::test_delete_resume_logs_warning_on_os_error` | L225 | Xóa bản CV và tự động dọn dẹp các đoạn vector embedding liên quan |
| 10 | `TestResumeEmbedding::test_embedding_generated_on_upload` | L258 | Tải lên tệp CV (PDF/DOCX), trích xuất văn bản thô và cấu trúc hóa kỹ năng/kinh nghiệm |
| 11 | `TestResumeRoleAuthorization::test_employer_blocked_from_upload_resume` | L293 | Tải lên tệp CV (PDF/DOCX), trích xuất văn bản thô và cấu trúc hóa kỹ năng/kinh nghiệm |
| 12 | `TestResumeRoleAuthorization::test_employer_blocked_from_create_resume` | L308 | Tải lên tệp CV (PDF/DOCX), trích xuất văn bản thô và cấu trúc hóa kỹ năng/kinh nghiệm |
| 13 | `TestResumeAccessControl::test_direct_static_cv_access_blocked` | L326 | Kiểm thử quản lý hồ sơ ứng viên (Resume CRUD) và trích xuất dữ liệu |
| 14 | `TestResumeAccessControl::test_legacy_avatar_access_allowed` | L331 | Kiểm thử quản lý hồ sơ ứng viên (Resume CRUD) và trích xuất dữ liệu |
| 15 | `TestResumeAccessControl::test_candidate_and_employer_rbac` | L337 | Kiểm thử quản lý hồ sơ ứng viên (Resume CRUD) và trích xuất dữ liệu |

##### 📄 Tệp kiểm thử: `test_cv_documents.py` (7 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestCvDocuments::test_create_list_update_and_delete` | L23 | Kiểm thử quản lý tài liệu CV nhiều trang, kiểm soát quyền truy cập và phân đoạn văn bản |
| 2 | `TestCvDocuments::test_reject_invalid_template` | L57 | Kiểm thử quản lý tài liệu CV nhiều trang, kiểm soát quyền truy cập và phân đoạn văn bản |
| 3 | `TestCvDocuments::test_cannot_access_another_users_document` | L64 | Kiểm thử quản lý tài liệu CV nhiều trang, kiểm soát quyền truy cập và phân đoạn văn bản |
| 4 | `TestCvDocuments::test_ai_suggestion_returns_structured_success` | L80 | Kiểm thử quản lý tài liệu CV nhiều trang, kiểm soát quyền truy cập và phân đoạn văn bản |
| 5 | `TestCvDocuments::test_ai_timeout_has_retryable_error_contract` | L103 | Kiểm thử quản lý tài liệu CV nhiều trang, kiểm soát quyền truy cập và phân đoạn văn bản |
| 6 | `TestCvSuggestionParsing::test_accepts_plain_json` | L130 | Kiểm thử quản lý tài liệu CV nhiều trang, kiểm soát quyền truy cập và phân đoạn văn bản |
| 7 | `TestCvSuggestionParsing::test_accepts_markdown_json_fence` | L137 | Kiểm thử quản lý tài liệu CV nhiều trang, kiểm soát quyền truy cập và phân đoạn văn bản |

##### 📄 Tệp kiểm thử: `test_cv_format_validator.py` (9 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestCVHeuristicValidator::test_empty_or_none_text` | L16 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 2 | `TestCVHeuristicValidator::test_text_too_short` | L24 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 3 | `TestCVHeuristicValidator::test_invoice_rejected_missing_professional_sections` | L29 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 4 | `TestCVHeuristicValidator::test_article_rejected_missing_contact_info` | L45 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 5 | `TestCVHeuristicValidator::test_fresher_cv_accepted` | L59 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 6 | `TestCVHeuristicValidator::test_senior_cv_accepted` | L79 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 7 | `TestCVEvaluatorServiceValidation::test_tier1_fast_reject_bypasses_deepseek_call` | L102 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 8 | `TestCVEvaluatorServiceValidation::test_tier2_accepts_valid_cv` | L122 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |
| 9 | `TestCVEvaluatorServiceValidation::test_tier2_rejects_non_cv_with_reason` | L145 | Kiểm thử pipeline thẩm định định dạng CV: Kiểm tra dung lượng tối đa, kiểm tra định dạng MIME hợp lệ và lọc tệp rác |

#### 4. Bộ phận Quy trình Tuyển dụng, Phễu Kanban & Phỏng vấn (Applications & Interviews) (Tổng cộng: 58 Tests)

##### 📄 Tệp kiểm thử: `test_applications.py` (15 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestApplicationsCRUD::test_create_application` | L72 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 2 | `TestApplicationsCRUD::test_create_application_with_resume` | L87 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 3 | `TestApplicationsCRUD::test_create_application_with_owned_cv_document` | L111 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 4 | `TestApplicationsCRUD::test_cannot_apply_with_another_candidates_cv` | L140 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 5 | `TestApplicationsCRUD::test_apply_twice_rejected_with_conflict` | L156 | Chống nộp trùng lặp: Trả về mã HTTP 409 Conflict khi ứng viên cố nộp lại vào cùng 1 tin tuyển dụng |
| 6 | `TestApplicationsCRUD::test_unauthenticated_cannot_apply` | L178 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 7 | `TestApplicationStatusFlow::test_employer_updates_to_reviewed` | L184 | Cập nhật trạng thái hồ sơ trên phễu Kanban (Pending -> Screening -> Interview -> Offer -> Hired/Rejected) |
| 8 | `TestApplicationStatusFlow::test_employer_updates_to_shortlisted` | L195 | Cập nhật trạng thái hồ sơ trên phễu Kanban (Pending -> Screening -> Interview -> Offer -> Hired/Rejected) |
| 9 | `TestApplicationStatusFlow::test_employer_rejects_candidate` | L206 | Cập nhật trạng thái hồ sơ trên phễu Kanban (Pending -> Screening -> Interview -> Offer -> Hired/Rejected) |
| 10 | `TestApplicationStatusFlow::test_candidate_cannot_update_own_status` | L217 | Cập nhật trạng thái hồ sơ trên phễu Kanban (Pending -> Screening -> Interview -> Offer -> Hired/Rejected) |
| 11 | `TestApplicationPermissions::test_candidate_only_sees_own_applications` | L231 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 12 | `TestApplicationPermissions::test_employer_sees_single_application` | L248 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 13 | `TestApplicationPermissions::test_employer_sees_ranked_list_for_job` | L259 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 14 | `TestApplicationAIMatchingScoreSync::test_application_without_resume_keeps_null_score` | L275 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |
| 15 | `TestApplicationAIMatchingScoreSync::test_application_with_embeddings_computes_and_saves_matching_score` | L294 | Kiểm thử quản lý hồ sơ ứng tuyển (Application Lifecycle & Kanban Pipeline) |

##### 📄 Tệp kiểm thử: `test_interview_rounds.py` (19 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestAutoCreateRound1::test_apply_creates_round1` | L66 | Tạo vòng phỏng vấn mới (Duyệt CV, Phỏng vấn kỹ thuật, Phỏng vấn HR) cho hồ sơ ứng tuyển |
| 2 | `TestAutoCreateRound1::test_apply_creates_round1_then_another_apply_creates_round1_for_second_app` | L91 | Tạo vòng phỏng vấn mới (Duyệt CV, Phỏng vấn kỹ thuật, Phỏng vấn HR) cho hồ sơ ứng tuyển |
| 3 | `TestStatusSyncCreatesRound::test_patch_reviewed_creates_round` | L120 | Tạo vòng phỏng vấn mới (Duyệt CV, Phỏng vấn kỹ thuật, Phỏng vấn HR) cho hồ sơ ứng tuyển |
| 4 | `TestStatusSyncCreatesRound::test_patch_accepted_creates_final_round` | L147 | Tạo vòng phỏng vấn mới (Duyệt CV, Phỏng vấn kỹ thuật, Phỏng vấn HR) cho hồ sơ ứng tuyển |
| 5 | `TestOrphanCleanup::test_no_orphan_rounds_after_accepted` | L172 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 6 | `TestOrphanCleanup::test_no_orphan_rounds_after_rejected` | L215 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 7 | `TestRoundCRUD::test_get_rounds_for_application` | L248 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 8 | `TestRoundCRUD::test_create_round_via_api` | L263 | Tạo vòng phỏng vấn mới (Duyệt CV, Phỏng vấn kỹ thuật, Phỏng vấn HR) cho hồ sơ ứng tuyển |
| 9 | `TestRoundCRUD::test_update_round_status_syncs_application` | L283 | Cập nhật tiến trình vòng phỏng vấn (Pending -> In Progress -> Passed / Failed / Skipped) |
| 10 | `TestRoundCRUD::test_update_round_feedback_syncs_to_application_ai_feedback` | L306 | Ghi nhận điểm số đánh giá (thang điểm 1-10) và nhận xét chi tiết sau buổi phỏng vấn |
| 11 | `TestEmployerInterviewsEndpoint::test_employer_sees_interviews_sorted_soonest_first` | L334 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 12 | `TestEmployerInterviewsEndpoint::test_employer_only_sees_own_jobs` | L369 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 13 | `TestCandidateInterviewsEndpoint::test_candidate_sees_own_interviews` | L407 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 14 | `TestCandidateInterviewsEndpoint::test_candidate_only_sees_own_interviews` | L429 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 15 | `TestAnalytics458::test_funnel_pass_rate_exact` | L463 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 16 | `TestAnalytics458::test_time_to_hire_exact` | L497 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 17 | `TestAnalytics458::test_candidate_source_exact` | L522 | Kiểm thử nghiệp vụ quản lý các vòng phỏng vấn tuyển dụng nhiều giai đoạn |
| 18 | `TestTerminalStatusPreservation::test_sync_does_not_overwrite_accepted_status` | L586 | Cập nhật tiến trình vòng phỏng vấn (Pending -> In Progress -> Passed / Failed / Skipped) |
| 19 | `TestTerminalStatusPreservation::test_sync_does_not_overwrite_rejected_status` | L618 | Cập nhật tiến trình vòng phỏng vấn (Pending -> In Progress -> Passed / Failed / Skipped) |

##### 📄 Tệp kiểm thử: `test_criteria_scores.py` (4 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestCriteriaScores::test_get_empty_criteria` | L49 | Kiểm thử chấm điểm ứng viên theo khung tiêu chí năng lực (kỹ thuật, giao tiếp, ngoại ngữ, thái độ) |
| 2 | `TestCriteriaScores::test_bulk_replace_and_syncs_average` | L64 | Kiểm thử chấm điểm ứng viên theo khung tiêu chí năng lực (kỹ thuật, giao tiếp, ngoại ngữ, thái độ) |
| 3 | `TestCriteriaScores::test_bulk_replace_overwrites_old` | L97 | Kiểm thử chấm điểm ứng viên theo khung tiêu chí năng lực (kỹ thuật, giao tiếp, ngoại ngữ, thái độ) |
| 4 | `TestCriteriaScores::test_bulk_replace_empty_resets_round_score_to_none` | L139 | Kiểm thử chấm điểm ứng viên theo khung tiêu chí năng lực (kỹ thuật, giao tiếp, ngoại ngữ, thái độ) |

##### 📄 Tệp kiểm thử: `test_assessments.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestAssessmentQuestionnaires::test_get_mbti_questions` | L32 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |
| 2 | `TestAssessmentQuestionnaires::test_get_mi_questions` | L42 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |
| 3 | `TestAssessmentScoring::test_score_mbti_deterministic` | L53 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |
| 4 | `TestAssessmentScoring::test_score_mi_deterministic` | L72 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |
| 5 | `TestAssessmentScoring::test_invalid_version_or_missing_answers` | L87 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |
| 6 | `TestAssessmentPersistence::test_candidate_save_and_retrieve_attempt` | L98 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |
| 7 | `TestAssessmentPersistence::test_non_candidate_cannot_save_attempt` | L128 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |
| 8 | `TestAssessmentPersistence::test_cannot_delete_other_user_attempt` | L140 | Kiểm thử giao bài kiểm tra đánh giá năng lực đầu vào và tự động thu hồi/chấm điểm |

##### 📄 Tệp kiểm thử: `test_calendar_service.py` (4 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_escape_ics_text` | L66 | Kiểm thử dịch vụ lịch: Kiểm tra lịch rảnh của người phỏng vấn và phát hiện xung đột thời gian |
| 2 | `test_format_ics_datetime` | L80 | Kiểm thử dịch vụ lịch: Kiểm tra lịch rảnh của người phỏng vấn và phát hiện xung đột thời gian |
| 3 | `test_calendar_service_unit` | L86 | Kiểm thử dịch vụ lịch: Kiểm tra lịch rảnh của người phỏng vấn và phát hiện xung đột thời gian |
| 4 | `test_calendar_endpoints_api` | L161 | Kiểm thử dịch vụ lịch: Kiểm tra lịch rảnh của người phỏng vấn và phát hiện xung đột thời gian |

##### 📄 Tệp kiểm thử: `test_feedback.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestUserFeedbackSystem::test_submit_public_guest_feedback` | L54 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |
| 2 | `TestUserFeedbackSystem::test_submit_authenticated_candidate_feedback` | L79 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |
| 3 | `TestUserFeedbackSystem::test_admin_list_feedbacks_with_filtering` | L99 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |
| 4 | `TestUserFeedbackSystem::test_admin_update_feedback_resolution` | L121 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |
| 5 | `TestUserFeedbackSystem::test_admin_feedback_stats_and_dashboard_alerts` | L154 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |
| 6 | `TestUserFeedbackSystem::test_stored_xss_prevention_on_submit` | L207 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |
| 7 | `TestUserFeedbackSystem::test_oversized_content_rejected_with_422` | L226 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |
| 8 | `TestUserFeedbackSystem::test_admin_response_stored_xss_prevention` | L238 | Kiểm thử thu thập và lưu trữ đánh giá/nhận xét của hội đồng tuyển dụng sau vòng phỏng vấn |

#### 5. Bộ phận Trí tuệ Nhân tạo AI, RAG & pgvector (AI Matching, Prompts & Vector Search) (Tổng cộng: 96 Tests)

##### 📄 Tệp kiểm thử: `test_ai.py` (21 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestAIEndpoints::test_match_requires_auth` | L111 | Kiểm thử các dịch vụ phân tích trí tuệ nhân tạo cốt lõi (AI Core Services) |
| 2 | `TestAIEndpoints::test_evaluate_requires_auth` | L115 | Kiểm thử các dịch vụ phân tích trí tuệ nhân tạo cốt lõi (AI Core Services) |
| 3 | `TestAIEndpoints::test_roadmap_requires_auth` | L119 | AI tư vấn lộ trình phát triển nghề nghiệp 3 giai đoạn (Ngắn hạn, Trung hạn, Dài hạn) cho ứng viên |
| 4 | `TestAIEndpoints::test_roadmap_passes_parsed_skills_from_resume` | L125 | AI tư vấn lộ trình phát triển nghề nghiệp 3 giai đoạn (Ngắn hạn, Trung hạn, Dài hạn) cho ứng viên |
| 5 | `TestAIMatchingIntegration::test_full_matching_flow` | L181 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 6 | `TestAIMatchingIntegration::test_match_resume_without_embedding` | L251 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 7 | `TestAIMatchingIntegration::test_match_job_without_embedding` | L290 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 8 | `TestAIMatchingIntegration::test_match_unvalidated_resume_rejected` | L325 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 9 | `TestAIMatchingRealEmbeddings::test_python_dev_matches_python_job_better_than_marketing` | L362 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 10 | `TestAIRealDeepseekCalls::test_evaluate_cv_with_real_deepseek` | L582 | Kiểm thử các dịch vụ phân tích trí tuệ nhân tạo cốt lõi (AI Core Services) |
| 11 | `TestAIRealDeepseekCalls::test_roadmap_with_real_deepseek` | L683 | AI tư vấn lộ trình phát triển nghề nghiệp 3 giai đoạn (Ngắn hạn, Trung hạn, Dài hạn) cho ứng viên |
| 12 | `TestAIRealDeepseekCalls::test_summarize_cv_with_real_deepseek` | L793 | Kiểm thử các dịch vụ phân tích trí tuệ nhân tạo cốt lõi (AI Core Services) |
| 13 | `TestAIRealDeepseekCalls::test_interview_questions_with_real_deepseek` | L907 | Kiểm thử các dịch vụ phân tích trí tuệ nhân tạo cốt lõi (AI Core Services) |
| 14 | `TestAIRealDeepseekCalls::test_generate_email_all_types_with_real_deepseek` | L1033 | Kiểm thử các dịch vụ phân tích trí tuệ nhân tạo cốt lõi (AI Core Services) |
| 15 | `TestAssistantSecurity::test_reject_system_role_injection` | L1227 | Kiểm thử các dịch vụ phân tích trí tuệ nhân tạo cốt lõi (AI Core Services) |
| 16 | `TestAICoverLetterAndCvDocMatching::test_cover_letter_with_resume` | L1246 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 17 | `TestAICoverLetterAndCvDocMatching::test_cover_letter_with_cv_document` | L1298 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 18 | `TestAICoverLetterAndCvDocMatching::test_cover_letter_validation_error_when_no_cv_provided` | L1353 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 19 | `TestAICoverLetterAndCvDocMatching::test_cover_letter_forbidden_access_to_other_candidate_cv` | L1366 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 20 | `TestAICoverLetterAndCvDocMatching::test_match_with_cv_document` | L1397 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |
| 21 | `TestAICoverLetterAndCvDocMatching::test_match_with_cv_document_forbidden_for_another_candidate` | L1447 | Tính toán AI Matching Score (0-100) và sinh ma trận SWOT (Điểm mạnh, Điểm yếu, Khoảng trống kỹ năng) |

##### 📄 Tệp kiểm thử: `test_ai_authorization.py` (7 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_candidate_success` | L53 | Kiểm thử phân quyền truy cập kết quả phân tích AI: Chỉ chủ sở hữu CV hoặc HR của Job mới được xem |
| 2 | `test_candidate_unauthorized` | L63 | Kiểm thử phân quyền truy cập kết quả phân tích AI: Chỉ chủ sở hữu CV hoặc HR của Job mới được xem |
| 3 | `test_hr_success` | L79 | Kiểm thử phân quyền truy cập kết quả phân tích AI: Chỉ chủ sở hữu CV hoặc HR của Job mới được xem |
| 4 | `test_hr_missing_permission` | L109 | Kiểm thử phân quyền truy cập kết quả phân tích AI: Chỉ chủ sở hữu CV hoặc HR của Job mới được xem |
| 5 | `test_hr_tenant_violation` | L132 | Kiểm thử phân quyền truy cập kết quả phân tích AI: Chỉ chủ sở hữu CV hoặc HR của Job mới được xem |
| 6 | `test_hr_department_violation` | L156 | Kiểm thử phân quyền truy cập kết quả phân tích AI: Chỉ chủ sở hữu CV hoặc HR của Job mới được xem |
| 7 | `test_hr_target_job_violation` | L192 | Kiểm thử phân quyền truy cập kết quả phân tích AI: Chỉ chủ sở hữu CV hoặc HR của Job mới được xem |

##### 📄 Tệp kiểm thử: `test_ai_gateway_security.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_mask_secrets_redacts_api_keys_and_tokens` | L21 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |
| 2 | `test_ai_http_exception_redacts_leaked_secrets` | L49 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |
| 3 | `test_ai_audit_masks_secrets_in_logs` | L64 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |
| 4 | `test_clamp_text_prevents_bloated_contexts` | L87 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |
| 5 | `test_defensive_json_parsing_code_fences_and_smart_quotes` | L105 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |
| 6 | `test_defensive_json_parsing_chatter_wrapping` | L125 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |
| 7 | `test_defensive_json_parsing_fallback_on_corrupt_data` | L140 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |
| 8 | `test_embedding_service_clamps_giant_inputs` | L156 | Bảo mật AI Gateway: Cơ chế Prompt Armor chống Prompt Injection, Jailbreak và khử thông tin cá nhân PII |

##### 📄 Tệp kiểm thử: `test_ai_matching_cache.py` (3 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_extract_cv_document_text` | L22 | Kiểm thử bộ nhớ đệm SHA-256 Hash: Trả kết quả tức thì không gọi lại LLM khi nội dung CV và JD không đổi |
| 2 | `test_lazy_embedding_generation_on_resume` | L77 | Kiểm thử bộ nhớ đệm SHA-256 Hash: Trả kết quả tức thì không gọi lại LLM khi nội dung CV và JD không đổi |
| 3 | `test_compute_match_for_cv_document` | L118 | Kiểm thử bộ nhớ đệm SHA-256 Hash: Trả kết quả tức thì không gọi lại LLM khi nội dung CV và JD không đổi |

##### 📄 Tệp kiểm thử: `test_ai_rate_limit.py` (5 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_sliding_window_basic_flow` | L27 | Kiểm thử giới hạn tần suất gọi AI (Rate Limiting) nhằm bảo vệ hạn mức token và chống tấn công DoS |
| 2 | `test_sliding_window_expiration` | L56 | Kiểm thử giới hạn tần suất gọi AI (Rate Limiting) nhằm bảo vệ hạn mức token và chống tấn công DoS |
| 3 | `test_rate_limit_endpoint_integration` | L81 | Kiểm thử giới hạn tần suất gọi AI (Rate Limiting) nhằm bảo vệ hạn mức token và chống tấn công DoS |
| 4 | `test_rate_limit_user_isolation` | L110 | Kiểm thử giới hạn tần suất gọi AI (Rate Limiting) nhằm bảo vệ hạn mức token và chống tấn công DoS |
| 5 | `test_rate_limit_bypass_when_disabled` | L140 | Kiểm thử giới hạn tần suất gọi AI (Rate Limiting) nhằm bảo vệ hạn mức token và chống tấn công DoS |

##### 📄 Tệp kiểm thử: `test_ai_issue8.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_generate_email_schema_tone_and_prompt` | L35 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 2 | `test_cv_evaluation_schema_cv_document_id` | L46 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 3 | `test_roadmap_schema_cv_document_id` | L55 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 4 | `test_job_recommendation_response_schema` | L64 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 5 | `test_email_generator_service_tone_and_custom_prompt` | L88 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 6 | `test_evaluate_cv_document_endpoint` | L134 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 7 | `test_roadmap_cv_document_endpoint` | L184 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 8 | `test_recommend_jobs_cv_document_endpoint` | L234 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |

##### 📄 Tệp kiểm thử: `test_ai_kt3_suite.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_ai_cache_hit_saves_tokens_and_cost` | L28 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 2 | `test_ai_exponential_backoff_retry_on_network_error` | L60 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 3 | `test_prompt_armor_blocks_vietnamese_jailbreak` | L95 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 4 | `test_prompt_armor_allows_legitimate_vietnamese_input` | L110 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 5 | `test_rbac_unauthorized_candidate_cv_access_blocked` | L124 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 6 | `test_circuit_breaker_fails_fast_on_repeated_outages` | L143 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 7 | `test_sliding_window_rate_limiter_boundary` | L163 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |
| 8 | `test_input_truncation_prevents_context_overflow` | L185 | Kiểm thử chuyên sâu các trường hợp biên của dịch vụ AI: Xử lý timeout, phản hồi lỗi và hồi phục dữ liệu |

##### 📄 Tệp kiểm thử: `test_jd_generator.py` (5 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestJDGenerator::test_generate_jd_requires_auth` | L40 | Kiểm thử tính năng AI tự động soạn thảo bản mô tả công việc (JD Generator) từ tiêu đề và từ khóa kỹ năng |
| 2 | `TestJDGenerator::test_generate_jd_candidate_forbidden` | L44 | Kiểm thử tính năng AI tự động soạn thảo bản mô tả công việc (JD Generator) từ tiêu đề và từ khóa kỹ năng |
| 3 | `TestJDGenerator::test_generate_jd_validation_error` | L68 | Kiểm thử tính năng AI tự động soạn thảo bản mô tả công việc (JD Generator) từ tiêu đề và từ khóa kỹ năng |
| 4 | `TestJDGenerator::test_generate_jd_success_fallback` | L77 | Kiểm thử tính năng AI tự động soạn thảo bản mô tả công việc (JD Generator) từ tiêu đề và từ khóa kỹ năng |
| 5 | `TestJDGenerator::test_generate_jd_with_mocked_llm` | L116 | Kiểm thử tính năng AI tự động soạn thảo bản mô tả công việc (JD Generator) từ tiêu đề và từ khóa kỹ năng |

##### 📄 Tệp kiểm thử: `test_email_generator.py` (4 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestEmailGeneratorService::test_fallback_invite_email` | L16 | Kiểm thử tính năng AI soạn thảo thư tự động: Thư mời phỏng vấn, thư cảm ơn từ chối và thư mời nhận việc (Offer) |
| 2 | `TestEmailGeneratorService::test_fallback_reject_email` | L29 | Kiểm thử tính năng AI soạn thảo thư tự động: Thư mời phỏng vấn, thư cảm ơn từ chối và thư mời nhận việc (Offer) |
| 3 | `TestEmailGeneratorService::test_fallback_offer_email` | L41 | Kiểm thử tính năng AI soạn thảo thư tự động: Thư mời phỏng vấn, thư cảm ơn từ chối và thư mời nhận việc (Offer) |
| 4 | `TestEmailGeneratorService::test_invalid_email_type_raises` | L53 | Kiểm thử tính năng AI soạn thảo thư tự động: Thư mời phỏng vấn, thư cảm ơn từ chối và thư mời nhận việc (Offer) |

##### 📄 Tệp kiểm thử: `test_assistant.py` (12 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_assistant_suggestions` | L8 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 2 | `test_assistant_chat_validation` | L25 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 3 | `test_assistant_chat_security_limits` | L31 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 4 | `test_assistant_chat_success` | L49 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 5 | `test_assistant_chat_fallback_guest_lead_conversion` | L78 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 6 | `test_assistant_chat_banana_pivot_and_guest_cta` | L99 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 7 | `test_contextual_knowledge_slicing` | L124 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 8 | `test_employer_solutions_engineer_cards` | L156 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 9 | `test_agentic_tools_live_execution` | L182 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 10 | `test_assistant_chat_agentic_two_turn_tool_calling` | L312 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 11 | `test_assistant_chat_security_role_spoofing_defense` | L399 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |
| 12 | `test_agentic_tool_multi_tenant_data_isolation` | L428 | Kiểm thử trợ lý ảo thông minh: Trả lời giải đáp thắc mắc tuyển dụng cho ứng viên và gợi ý thông tin cho HR |

##### 📄 Tệp kiểm thử: `test_rag_pipeline.py` (15 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_pii_sanitizer_masks_sensitive_data` | L33 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 2 | `test_chunk_cv_document_sections` | L54 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 3 | `test_chunk_job_sections` | L110 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 4 | `test_recursive_split_for_oversized_text` | L134 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 5 | `test_crud_document_chunks` | L145 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 6 | `test_generate_grounded_interview_questions` | L197 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 7 | `test_rag_search_api_endpoint` | L282 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 8 | `test_rag_index_api_endpoint` | L303 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 9 | `test_cv_document_create_and_delete_cleans_chunks` | L338 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 10 | `test_cv_copilot_chat_endpoint` | L374 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 11 | `test_cv_copilot_chat_rejects_unauthorized_employer_on_draft_cv` | L438 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 12 | `test_cv_copilot_chat_role_spoofing_prevented` | L475 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 13 | `test_candidate_search_cannot_see_other_candidates_cv` | L493 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 14 | `test_batch_ingest_all_forbidden_for_employer` | L536 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |
| 15 | `test_employer_talent_search_isolates_company_applicants` | L543 | Kiểm thử đường ống RAG & pgvector: Phân đoạn văn bản 500 ký tự, embedding 384 chiều, tìm kiếm Cosine Similarity |

#### 6. Bộ phận Quản trị Hệ thống, Giám sát AI & Báo cáo (Admin Governance & Analytics) (Tổng cộng: 47 Tests)

##### 📄 Tệp kiểm thử: `test_admin_ai.py` (21 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestListPrompts::test_admin_can_list_prompts` | L57 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 2 | `TestListPrompts::test_candidate_gets_403` | L70 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 3 | `TestListPrompts::test_employer_gets_403` | L76 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 4 | `TestListPrompts::test_unauthenticated_gets_401` | L82 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 5 | `TestUpdatePrompt::test_admin_can_update_prompt` | L88 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 6 | `TestUpdatePrompt::test_update_creates_record_if_missing` | L117 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 7 | `TestUpdatePrompt::test_non_admin_cannot_update` | L128 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 8 | `TestUpdatePrompt::test_invalid_feature_returns_422` | L138 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 9 | `TestUpdatePrompt::test_oversized_system_prompt_returns_422` | L148 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 10 | `TestTestPrompt::test_mocked_test_call_returns_result` | L161 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 11 | `TestTestPrompt::test_non_admin_cannot_test` | L186 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 12 | `TestTestPrompt::test_email_test_composes_different_system_prompt_per_type` | L198 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 13 | `TestCallLogs::test_admin_can_list_logs` | L308 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 14 | `TestCallLogs::test_filter_by_feature` | L318 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 15 | `TestCallLogs::test_filter_by_status` | L330 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 16 | `TestCallLogs::test_pagination_works` | L342 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 17 | `TestCallLogs::test_non_admin_gets_403` | L354 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 18 | `TestCallLogs::test_filter_by_invalid_status_returns_400` | L360 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 19 | `TestStats::test_empty_stats_returns_zeros` | L372 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 20 | `TestStats::test_stats_error_rate` | L384 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |
| 21 | `TestStats::test_non_admin_gets_403` | L411 | Kiểm thử quản trị Prompt động: Chỉnh sửa System Prompt, Temperature, Max Tokens trực tiếp trên CSDL không cần restart |

##### 📄 Tệp kiểm thử: `test_admin_core.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_admin_user_search_status_guard_and_audit` | L63 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |
| 2 | `test_company_approval_and_search_are_audited` | L108 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |
| 3 | `test_job_moderation_preserves_application_and_is_audited` | L141 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |
| 4 | `test_audit_logs_are_admin_only` | L204 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |
| 5 | `test_company_verify_toggle_and_audit` | L217 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |
| 6 | `test_non_super_admin_cannot_deactivate_super_admin` | L261 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |
| 7 | `test_deactivating_company_suspends_jobs_and_invalidates_tokens` | L293 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |
| 8 | `test_deleting_job_cleans_up_document_chunks` | L331 | Kiểm thử quản trị hệ thống: Quản lý danh sách người dùng, kích hoạt/khóa tài khoản, xem thống kê KPI toàn sàn |

##### 📄 Tệp kiểm thử: `test_admin_rag.py` (7 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_admin_rag_stats_unauthorized` | L49 | Kiểm thử quản trị kho tri thức RAG: Tái lập chỉ mục vector (Re-index) và giám sát dung lượng vector chunks |
| 2 | `test_admin_rag_stats_authorized` | L55 | Kiểm thử quản trị kho tri thức RAG: Tái lập chỉ mục vector (Re-index) và giám sát dung lượng vector chunks |
| 3 | `test_admin_rag_config_read_and_update` | L67 | Kiểm thử quản trị kho tri thức RAG: Tái lập chỉ mục vector (Re-index) và giám sát dung lượng vector chunks |
| 4 | `test_admin_rag_search_logs` | L99 | Kiểm thử quản trị kho tri thức RAG: Tái lập chỉ mục vector (Re-index) và giám sát dung lượng vector chunks |
| 5 | `test_admin_rag_batch_reindex` | L109 | Kiểm thử quản trị kho tri thức RAG: Tái lập chỉ mục vector (Re-index) và giám sát dung lượng vector chunks |
| 6 | `test_admin_rag_maintenance_message_max_length_bound` | L119 | Kiểm thử quản trị kho tri thức RAG: Tái lập chỉ mục vector (Re-index) và giám sát dung lượng vector chunks |
| 7 | `test_admin_rag_batch_reindex_concurrency_lock` | L127 | Kiểm thử quản trị kho tri thức RAG: Tái lập chỉ mục vector (Re-index) và giám sát dung lượng vector chunks |

##### 📄 Tệp kiểm thử: `test_admin_interviews.py` (5 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestAdminInterviewOversight::test_admin_list_interview_rounds` | L91 | Kiểm thử góc nhìn giám sát Admin: Theo dõi tiến độ phỏng vấn và tỷ lệ chuyển đổi của toàn bộ doanh nghiệp |
| 2 | `TestAdminInterviewOversight::test_filter_interview_rounds` | L107 | Kiểm thử góc nhìn giám sát Admin: Theo dõi tiến độ phỏng vấn và tỷ lệ chuyển đổi của toàn bộ doanh nghiệp |
| 3 | `TestAdminInterviewOversight::test_mark_and_clear_review_with_audit_log` | L125 | Kiểm thử góc nhìn giám sát Admin: Theo dõi tiến độ phỏng vấn và tỷ lệ chuyển đổi của toàn bộ doanh nghiệp |
| 4 | `TestAdminInterviewOversight::test_non_admin_forbidden` | L174 | Kiểm thử góc nhìn giám sát Admin: Theo dõi tiến độ phỏng vấn và tỷ lệ chuyển đổi của toàn bộ doanh nghiệp |
| 5 | `TestAdminInterviewOversight::test_admin_alerts_endpoint` | L200 | Kiểm thử góc nhìn giám sát Admin: Theo dõi tiến độ phỏng vấn và tỷ lệ chuyển đổi của toàn bộ doanh nghiệp |

##### 📄 Tệp kiểm thử: `test_exports.py` (3 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_export_candidates_csv_flow` | L44 | Kiểm thử trích xuất báo cáo dữ liệu tuyển dụng ra định dạng tệp tin Excel (.xlsx) và CSV |
| 2 | `test_export_pipeline_metrics_csv` | L119 | Kiểm thử trích xuất báo cáo dữ liệu tuyển dụng ra định dạng tệp tin Excel (.xlsx) và CSV |
| 3 | `test_export_authorization_and_security` | L141 | Kiểm thử trích xuất báo cáo dữ liệu tuyển dụng ra định dạng tệp tin Excel (.xlsx) và CSV |

##### 📄 Tệp kiểm thử: `test_contact_leads.py` (3 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_submit_contact_lead_success` | L9 | Kiểm thử tiếp nhận và lưu vết khách hàng doanh nghiệp đăng ký tư vấn B2B từ trang chủ Landing Page |
| 2 | `test_list_contact_leads` | L38 | Kiểm thử tiếp nhận và lưu vết khách hàng doanh nghiệp đăng ký tư vấn B2B từ trang chủ Landing Page |
| 3 | `test_submit_contact_lead_validation_error` | L70 | Kiểm thử tiếp nhận và lưu vết khách hàng doanh nghiệp đăng ký tư vấn B2B từ trang chủ Landing Page |

#### 7. Bộ phận Tương tác Thời gian thực & Tác vụ Nền (Chat, Notifications & Background Tasks) (Tổng cộng: 16 Tests)

##### 📄 Tệp kiểm thử: `test_direct_chat.py` (2 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_direct_chat_flow_and_authorization` | L61 | Kiểm thử nhắn tin trực tiếp thời gian thực: Trao đổi tin nhắn hai chiều an toàn giữa HR và Ứng viên |
| 2 | `test_chat_security_privacy_and_admin_governance` | L164 | Kiểm thử nhắn tin trực tiếp thời gian thực: Trao đổi tin nhắn hai chiều an toàn giữa HR và Ứng viên |

##### 📄 Tệp kiểm thử: `test_notifications.py` (8 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestGetNotifications::test_list_notifications_empty` | L46 | Lấy danh sách thông báo khi người dùng chưa có thông báo nào (trả về mảng rỗng) |
| 2 | `TestGetNotifications::test_list_notifications_with_data` | L53 | Lấy danh sách thông báo đã nhận kèm phân trang và nội dung chi tiết |
| 3 | `TestGetNotifications::test_unauthenticated_cannot_list` | L66 | Chặn người dùng chưa đăng nhập truy cập hòm thư thông báo với mã HTTP 401 |
| 4 | `TestUnreadCount::test_unread_count_zero` | L73 | Đếm chính xác số lượng thông báo chưa đọc hiển thị lên biểu tượng chuông thông báo |
| 5 | `TestUnreadCount::test_unread_count_after_creation` | L80 | Đếm chính xác số lượng thông báo chưa đọc hiển thị lên biểu tượng chuông thông báo |
| 6 | `TestMarkRead::test_mark_single_read` | L94 | Đánh dấu một thông báo cụ thể là đã đọc |
| 7 | `TestMarkRead::test_mark_nonexistent_returns_404` | L109 | Báo lỗi HTTP 404 khi cố gắng đánh dấu đọc một thông báo không tồn tại |
| 8 | `TestMarkRead::test_mark_all_read` | L115 | Đánh dấu tất cả thông báo trong hộp thư là đã đọc chỉ với 1 thao tác |

##### 📄 Tệp kiểm thử: `test_websocket_notifications.py` (4 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_websocket_unauthorized` | L43 | Từ chối kết nối WebSocket khi thiếu token hoặc token không hợp lệ |
| 2 | `test_websocket_connection_and_ping_pong` | L61 | Thiết lập bắt tay kết nối WebSocket và phản hồi gói tin kiểm tra nhịp tim Ping/Pong định kỳ |
| 3 | `test_websocket_realtime_notification_dispatch` | L84 | Bắn thông báo đẩy theo thời gian thực tới trình duyệt người dùng ngay khi có sự kiện nộp đơn/đổi lịch |
| 4 | `test_websocket_token_version_invalidation` | L119 | Ngắt ngay lập tức kết nối WebSocket đang mở nếu tài khoản bị tăng token_version (đăng xuất hoặc đổi mật khẩu) |

##### 📄 Tệp kiểm thử: `test_background_tasks.py` (2 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `test_send_application_notification_task` | L13 | Kiểm thử tác vụ nền không đồng bộ: Xử lý gửi email thông báo và kích hoạt AI chấm điểm chạy ngầm |
| 2 | `test_application_notification_queues_background_task` | L35 | Kiểm thử tác vụ nền không đồng bộ: Xử lý gửi email thông báo và kích hoạt AI chấm điểm chạy ngầm |

#### 8. Bộ phận Kiểm thử Luồng Tổng thể Backend (Backend End-to-End Flows) (Tổng cộng: 6 Tests)

##### 📄 Tệp kiểm thử: `test_e2e_flows.py` (6 tests)
| STT | Tên Hàm Test | Dòng | Ghi chú Giải thích Nghiệp vụ Chi tiết (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `TestFlow1CandidateApply::test_full_candidate_apply_flow` | L129 | Kiểm thử luồng nghiệp vụ khép kín end-to-end: Đăng tuyển -> Nộp đơn -> Chấm điểm AI -> Phỏng vấn -> Tuyển dụng |
| 2 | `TestFlow2HRRecruitment::test_full_hr_recruitment_pipeline` | L178 | Kiểm thử luồng nghiệp vụ khép kín end-to-end: Đăng tuyển -> Nộp đơn -> Chấm điểm AI -> Phỏng vấn -> Tuyển dụng |
| 3 | `TestFlow3AdminOversight::test_admin_can_view_stats_and_manage` | L265 | Kiểm thử luồng nghiệp vụ khép kín end-to-end: Đăng tuyển -> Nộp đơn -> Chấm điểm AI -> Phỏng vấn -> Tuyển dụng |
| 4 | `TestFlow4TeamCollaboration::test_department_head_recommendation_flow` | L302 | Kiểm thử luồng nghiệp vụ khép kín end-to-end: Đăng tuyển -> Nộp đơn -> Chấm điểm AI -> Phỏng vấn -> Tuyển dụng |
| 5 | `TestFlow5CVBuilderTools::test_cv_builder_create_and_apply` | L389 | Kiểm thử luồng nghiệp vụ khép kín end-to-end: Đăng tuyển -> Nộp đơn -> Chấm điểm AI -> Phỏng vấn -> Tuyển dụng |
| 6 | `TestFlow6RecruitmentRequest::test_recruitment_request_lifecycle` | L457 | Kiểm thử luồng nghiệp vụ khép kín end-to-end: Đăng tuyển -> Nộp đơn -> Chấm điểm AI -> Phỏng vấn -> Tuyển dụng |

---

### 3. CHI TIẾT TEST CASES FRONTEND E2E PLAYWRIGHT (57 TESTS)

##### 🖥️ Tệp kiểm thử E2E: `admin-ai-logs.spec.ts` (1 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `smoke test - should load the ai logs page and display main elements` | L7 | Kiểm thử giao diện Admin: Tra cứu danh sách nhật ký gọi AI, bộ lọc thời gian và xem chi tiết token: 'smoke test - should load the ai logs page and display main elements' |

##### 🖥️ Tệp kiểm thử E2E: `admin-ai-prompts.spec.ts` (1 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `smoke test - should load the ai prompts page and display main elements` | L7 | Kiểm thử giao diện Admin: Quản lý cấu hình Prompt AI, chỉnh sửa và lưu thành công kịch bản: 'smoke test - should load the ai prompts page and display main elements' |

##### 🖥️ Tệp kiểm thử E2E: `cv-builder-ai-flow.spec.ts` (1 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `Candidate dùng AI theo từng section và duyệt trước khi chèn` | L3 | Kiểm thử công cụ CV Builder tích hợp AI: Tự động gợi ý kỹ năng, tối ưu mô tả kinh nghiệm: 'Candidate dùng AI theo từng section và duyệt trước khi chèn' |

##### 🖥️ Tệp kiểm thử E2E: `cv-builder-flow.spec.ts` (1 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `Candidate tạo CV Builder, ứng tuyển và Employer xem đúng CV` | L5 | Kiểm thử luồng ứng viên tự tạo CV trực tuyến trên giao diện (nhập thông tin, xem trước, xuất PDF): 'Candidate tạo CV Builder, ứng tuyển và Employer xem đúng CV' |

##### 🖥️ Tệp kiểm thử E2E: `employer-rbac-flow.spec.ts` (4 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `owner bootstraps company, department, and invitation` | L37 | Kiểm thử phân quyền Nhà tuyển dụng trên giao diện: Bảng Kanban kéo thả hồ sơ, chỉ thao tác trên tin của công ty: 'owner bootstraps company, department, and invitation' |
| 2 | `department head is scoped and cannot perform HR operations` | L88 | Kiểm thử phân quyền Nhà tuyển dụng trên giao diện: Bảng Kanban kéo thả hồ sơ, chỉ thao tác trên tin của công ty: 'department head is scoped and cannot perform HR operations' |
| 3 | `department head submits a recruitment request and HR converts it once` | L161 | Kiểm thử phân quyền Nhà tuyển dụng trên giao diện: Bảng Kanban kéo thả hồ sơ, chỉ thao tác trên tin của công ty: 'department head submits a recruitment request and HR converts it once' |
| 4 | `UI shows owner and department-head permissions` | L229 | Kiểm thử phân quyền Nhà tuyển dụng trên giao diện: Bảng Kanban kéo thả hồ sơ, chỉ thao tác trên tin của công ty: 'UI shows owner and department-head permissions' |

##### 🖥️ Tệp kiểm thử E2E: `phase1-flow.spec.ts` (18 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `1.1 — Đăng ký tài khoản Employer (có Admin duyệt)` | L126 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '1.1 — Đăng ký tài khoản Employer (có Admin duyệt)' |
| 2 | `1.2 — Employer đăng tin tuyển dụng mới` | L142 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '1.2 — Employer đăng tin tuyển dụng mới' |
| 3 | `1.3 — Employer thấy tin đã đăng trong danh sách GET /jobs` | L164 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '1.3 — Employer thấy tin đã đăng trong danh sách GET /jobs' |
| 4 | `1.4 — Job Detail trả về đầy đủ thông tin` | L185 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '1.4 — Job Detail trả về đầy đủ thông tin' |
| 5 | `2.1 — Đăng ký tài khoản Candidate` | L208 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '2.1 — Đăng ký tài khoản Candidate' |
| 6 | `2.2 — Candidate ứng tuyển vào tin tuyển dụng` | L222 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '2.2 — Candidate ứng tuyển vào tin tuyển dụng' |
| 7 | `2.3 — Candidate Dashboard hiển thị đơn đã ứng tuyển` | L247 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '2.3 — Candidate Dashboard hiển thị đơn đã ứng tuyển' |
| 8 | `2.4 — Employer thấy ứng viên đã ứng tuyển` | L278 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '2.4 — Employer thấy ứng viên đã ứng tuyển' |
| 9 | `2.5 — Employer cập nhật trạng thái ứng viên sang ` | L298 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '2.5 — Employer cập nhật trạng thái ứng viên sang ' |
| 10 | `2.6 — Candidate thấy trạng thái cập nhật ` | L320 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '2.6 — Candidate thấy trạng thái cập nhật ' |
| 11 | `3.1 — [UI] Trang danh sách việc làm render thành công` | L340 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '3.1 — [UI] Trang danh sách việc làm render thành công' |
| 12 | `3.2 — [UI] Job Detail page render với tin vừa tạo` | L348 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '3.2 — [UI] Job Detail page render với tin vừa tạo' |
| 13 | `3.3 — [UI] Login page render thành công` | L362 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '3.3 — [UI] Login page render thành công' |
| 14 | `3.4 — [UI] Register page render thành công` | L370 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '3.4 — [UI] Register page render thành công' |
| 15 | `3.5 — [UI] LoginPage có nút Đăng nhập với Google` | L380 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '3.5 — [UI] LoginPage có nút Đăng nhập với Google' |
| 16 | `3.6 — [API] GET /auth/google/login redirects đến Google` | L387 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '3.6 — [API] GET /auth/google/login redirects đến Google' |
| 17 | `3.7 — [API] GET /auth/google/callback với code giả trả lỗi 502` | L401 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: '3.7 — [API] GET /auth/google/callback với code giả trả lỗi 502' |
| 18 | `Employer đăng tin → Candidate ứng tuyển → Dashboard (qua UI)` | L419 | Kiểm thử luồng cơ bản (Phase 1): Đăng ký tài khoản, đăng nhập, tìm kiếm việc làm và nộp hồ sơ trực tuyến: 'Employer đăng tin → Candidate ứng tuyển → Dashboard (qua UI)' |

##### 🖥️ Tệp kiểm thử E2E: `phase2-ai-flow.spec.ts` (15 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `1.1 — Đăng ký tài khoản Candidate` | L180 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.1 — Đăng ký tài khoản Candidate' |
| 2 | `1.2 — Candidate upload CV PDF, xác nhận embedding được lưu` | L194 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.2 — Candidate upload CV PDF, xác nhận embedding được lưu' |
| 3 | `1.3 — Đăng ký tài khoản Employer (có Admin duyệt)` | L227 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.3 — Đăng ký tài khoản Employer (có Admin duyệt)' |
| 4 | `1.4 — Employer đăng tin, xác nhận JD embedding được lưu` | L242 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.4 — Employer đăng tin, xác nhận JD embedding được lưu' |
| 5 | `1.5 — Candidate ứng tuyển vào tin vừa đăng` | L269 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.5 — Candidate ứng tuyển vào tin vừa đăng' |
| 6 | `1.6 — POST /ai/match: xác nhận điểm số hợp lệ (0-100, không NaN)` | L296 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.6 — POST /ai/match: xác nhận điểm số hợp lệ (0-100, không NaN)' |
| 7 | `1.7 — POST /ai/roadmap: xác nhận cấu trúc hợp lệ` | L339 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.7 — POST /ai/roadmap: xác nhận cấu trúc hợp lệ' |
| 8 | `1.8 — GET /applications/employer/jobs/{job_id}: xếp hạng theo điểm AI` | L407 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.8 — GET /applications/employer/jobs/{job_id}: xếp hạng theo điểm AI' |
| 9 | `1.9 — POST /ai/evaluate: xác nhận đánh giá CV hợp lệ` | L467 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.9 — POST /ai/evaluate: xác nhận đánh giá CV hợp lệ' |
| 10 | `1.10 — POST /ai/summarize-cv: xác nhận tóm tắt CV hợp lệ` | L513 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '1.10 — POST /ai/summarize-cv: xác nhận tóm tắt CV hợp lệ' |
| 11 | `2.1 — [UI] AIMatchingPage render thành công (có auth)` | L555 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '2.1 — [UI] AIMatchingPage render thành công (có auth)' |
| 12 | `2.2 — [UI] RoadmapPage render thành công (có auth)` | L594 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '2.2 — [UI] RoadmapPage render thành công (có auth)' |
| 13 | `2.3 — [UI] EmployerDashboard render thành công (có auth)` | L630 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '2.3 — [UI] EmployerDashboard render thành công (có auth)' |
| 14 | `Candidate AIMatching → Roadmap / Employer Dashboard đánh giá (qua UI)` | L680 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: 'Candidate AIMatching → Roadmap / Employer Dashboard đánh giá (qua UI)' |
| 15 | `4.5.6 — [UI] Candidate Dashboard hiển thị banner lịch phỏng vấn` | L1211 | Kiểm thử luồng trí tuệ nhân tạo (Phase 2): Hiển thị Radar Chart điểm AI, mở ngăn kéo CV Copilot chat hỏi đáp: '4.5.6 — [UI] Candidate Dashboard hiển thị banner lịch phỏng vấn' |

##### 🖥️ Tệp kiểm thử E2E: `phase4-admin-flow.spec.ts` (16 tests)
| STT | Tên Kịch bản Test E2E | Dòng | Ghi chú Luồng Kiểm thử Người dùng trên Trình duyệt (Tiếng Việt) |
| :---: | :--- | :---: | :--- |
| 1 | `1.1 — Admin đăng nhập thành công` | L47 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.1 — Admin đăng nhập thành công' |
| 2 | `1.2 — GET /admin/stats: cấu trúc hợp lệ` | L55 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.2 — GET /admin/stats: cấu trúc hợp lệ' |
| 3 | `1.3 — GET /admin/stats: non-admin bị 403` | L76 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.3 — GET /admin/stats: non-admin bị 403' |
| 4 | `1.4 — GET /admin/companies: danh sách nhà tuyển dụng` | L96 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.4 — GET /admin/companies: danh sách nhà tuyển dụng' |
| 5 | `1.5 — PATCH /admin/companies: approve & reject employer` | L116 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.5 — PATCH /admin/companies: approve & reject employer' |
| 6 | `1.6 — GET /admin/jobs: danh sách tin + filter` | L142 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.6 — GET /admin/jobs: danh sách tin + filter' |
| 7 | `1.7 — DELETE /admin/jobs/{id}: gỡ tin tuyển dụng` | L163 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.7 — DELETE /admin/jobs/{id}: gỡ tin tuyển dụng' |
| 8 | `1.8 — GET /admin/users + PATCH toggle status` | L214 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '1.8 — GET /admin/users + PATCH toggle status' |
| 9 | `1.9 — Employer chưa active bị chặn login, admin duyệt xong mới login được` | L257 | Kiểm thử giao diện Admin: Tra cứu danh sách nhật ký gọi AI, bộ lọc thời gian và xem chi tiết token: '1.9 — Employer chưa active bị chặn login, admin duyệt xong mới login được' |
| 10 | `1.10 — Audit log ghi nhận thao tác Admin và non-admin bị chặn` | L318 | Kiểm thử giao diện Admin: Tra cứu danh sách nhật ký gọi AI, bộ lọc thời gian và xem chi tiết token: '1.10 — Audit log ghi nhận thao tác Admin và non-admin bị chặn' |
| 11 | `2.1 — [UI] AdminDashboard render thành công` | L336 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '2.1 — [UI] AdminDashboard render thành công' |
| 12 | `2.2 — [UI] AdminCompanies render thành công` | L346 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '2.2 — [UI] AdminCompanies render thành công' |
| 13 | `2.3 — [UI] AdminJobs render thành công` | L355 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '2.3 — [UI] AdminJobs render thành công' |
| 14 | `2.4 — [UI] AdminUsers render thành công` | L364 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: '2.4 — [UI] AdminUsers render thành công' |
| 15 | `2.5 — [UI] AdminAuditLogs render thành công` | L373 | Kiểm thử giao diện Admin: Tra cứu danh sách nhật ký gọi AI, bộ lọc thời gian và xem chi tiết token: '2.5 — [UI] AdminAuditLogs render thành công' |
| 16 | `Admin đăng nhập → Dashboard → Companies → Users → Jobs (qua UI)` | L387 | Kiểm thử luồng quản trị viên Admin trên trình duyệt: 'Admin đăng nhập → Dashboard → Companies → Users → Jobs (qua UI)' |

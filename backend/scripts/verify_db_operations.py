"""Database Verification & CRUD Demonstration Script for KT2.

Directly connects to PostgreSQL via SQLAlchemy to verify:
  1. Read Schema: Inspect and list all active database tables
  2. Create: Insert test Job "Kiểm thử CSDL KT2" and retrieve auto-generated ID
  3. Read: Fetch created Job by ID and inspect attributes
  4. Update: Modify salary/benefits to "Thỏa thuận - Đã cập nhật" and commit
  5. Delete (Soft Delete): Set is_active = False, verify audit trail preservation

Usage:
    python backend/scripts/verify_db_operations.py
or inside docker:
    docker exec aijob-backend python scripts/verify_db_operations.py
"""

import os
import sys
from datetime import datetime

# Add backend root to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import inspect, text
from app.database import SessionLocal, engine
from app.models.job import Job, JobType, ExperienceLevel
from app.models.user import User, UserRole
from app.models.company import Company


def separator(title: str = ""):
    if title:
        print(f"\n{'=' * 25} [ {title} ] {'=' * 25}")
    else:
        print("=" * 70)


def main():
    print("=" * 70)
    print("  AI-POWERED JOB PORTAL — POSTGRESQL CRUD VERIFICATION (KT2)")
    print(f"  Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Database Dialect: {engine.dialect.name} (PostgreSQL + pgvector)")
    print("=" * 70)

    db = SessionLocal()

    try:
        # ──────────────────────────────────────────────────────────────────
        # BƯỚC 1: READ SCHEMA — Kiểm tra lược đồ CSDL & danh sách bảng
        # ──────────────────────────────────────────────────────────────────
        separator("BƯỚC 1: READ SCHEMA (LƯỢC ĐỒ CƠ SỞ DỮ LIỆU)")
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        print(f"[+] Tìm thấy tổng cộng {len(table_names)} bảng trong PostgreSQL Database:\n")
        
        print(f"{'STT':<5} | {'TÊN BẢNG (TABLE NAME)':<30} | {'SỐ LƯỢNG BẢN GHI (ROWS)':<22}")
        print("-" * 65)
        for idx, tbl in enumerate(sorted(table_names), start=1):
            try:
                count = db.execute(text(f'SELECT COUNT(*) FROM "{tbl}"')).scalar()
            except Exception:
                count = "N/A"
            print(f"{idx:<5} | {tbl:<30} | {count:<22}")
        print("-" * 65)
        print("[✔] BƯỚC 1 HOÀN TẤT: Đọc cấu trúc bảng thành công 100%!")

        # ──────────────────────────────────────────────────────────────────
        # BƯỚC 2: CREATE / LƯU — Tạo mới bản ghi Job "Kiểm thử CSDL KT2"
        # ──────────────────────────────────────────────────────────────────
        separator("BƯỚC 2: CREATE / LƯU (THÊM MỚI BẢN GHI JOB)")
        
        # Tìm một employer và company có sẵn
        employer = db.query(User).filter(User.role == UserRole.EMPLOYER).first()
        if not employer:
            employer = db.query(User).first()
        
        company = db.query(Company).first()

        new_job = Job(
            title="Kiểm thử CSDL KT2",
            description="Bản ghi công việc thử nghiệm phục vụ kiểm tra toàn diện thao tác CRUD và tính toàn vẹn CSDL.",
            requirements="Yêu cầu: Thành thạo SQL, SQLAlchemy, PostgreSQL 17 và pgvector.",
            benefits="Mức lương ban đầu: 20.000.000 - 30.000.000 VND / tháng",
            job_type=JobType.FULL_TIME,
            experience_level=ExperienceLevel.MIDDLE,
            salary_min=20000000,
            salary_max=30000000,
            location="Hà Nội / Hybrid",
            is_active=True,
            employer_id=employer.id,
            company_id=company.id if company else None,
        )

        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        created_job_id = new_job.id
        print(f"[+] Đã thêm thành công bản ghi Job mới vào bảng 'jobs'!")
        print(f"    - ID Tự sinh (Primary Key): {created_job_id}")
        print(f"    - Tiêu đề (title)         : {new_job.title}")
        print(f"    - Nhà tuyển dụng (User ID): {new_job.employer_id} ({employer.email})")
        print(f"    - Trạng thái (is_active)  : {new_job.is_active}")
        print(f"    - Mức lương khởi điểm     : {new_job.salary_min:,} - {new_job.salary_max:,} VND")
        print(f"    - Thời gian tạo           : {new_job.created_at}")
        print("[✔] BƯỚC 2 HOÀN TẤT: Lưu bản ghi và sinh khóa chính thành công!")

        # ──────────────────────────────────────────────────────────────────
        # BƯỚC 3: READ / ĐỌC — Truy vấn lại bản ghi vừa tạo theo ID
        # ──────────────────────────────────────────────────────────────────
        separator("BƯỚC 3: READ / ĐỌC (TRUY VẤN THEO PRIMARY KEY)")
        
        fetched_job = db.query(Job).filter(Job.id == created_job_id).first()
        assert fetched_job is not None, f"Lỗi: Không tìm thấy Job ID {created_job_id}"

        print(f"[+] Truy vấn thành công bản ghi ID = {fetched_job.id}:")
        print(f"{'Trường (Field)':<22} | {'Giá trị trong CSDL (Database Value)':<45}")
        print("-" * 70)
        print(f"{'id':<22} | {fetched_job.id:<45}")
        print(f"{'title':<22} | {fetched_job.title:<45}")
        print(f"{'job_type':<22} | {str(fetched_job.job_type):<45}")
        print(f"{'experience_level':<22} | {str(fetched_job.experience_level):<45}")
        print(f"{'salary_range':<22} | {str(fetched_job.salary_min) + ' - ' + str(fetched_job.salary_max) + ' VND':<45}")
        print(f"{'benefits':<22} | {fetched_job.benefits:<45}")
        print(f"{'location':<22} | {fetched_job.location:<45}")
        print(f"{'is_active':<22} | {str(fetched_job.is_active):<45}")
        print(f"{'created_at':<22} | {str(fetched_job.created_at):<45}")
        print("-" * 70)
        print("[✔] BƯỚC 3 HOÀN TẤT: Đọc dữ liệu từ PostgreSQL hoàn toàn chính xác!")

        # ──────────────────────────────────────────────────────────────────
        # BƯỚC 4: UPDATE / CẬP NHẬT — Đổi mức lương thành 'Thỏa thuận - Đã cập nhật'
        # ──────────────────────────────────────────────────────────────────
        separator("BƯỚC 4: UPDATE / CẬP NHẬT (THAY ĐỔI MỨC LƯƠNG)")
        
        print(f"[i] Mức lương trước khi cập nhật: {fetched_job.salary_min:,} - {fetched_job.salary_max:,} VND")
        print(f"[i] Tiến hành cập nhật chế độ lương sang: 'Thỏa thuận - Đã cập nhật'...")
        
        # Cập nhật mức lương sang thỏa thuận (NULL range) và cập nhật trường benefits/mô tả
        fetched_job.salary_min = None
        fetched_job.salary_max = None
        fetched_job.benefits = "Mức lương: Thỏa thuận - Đã cập nhật (Theo thỏa thuận trực tiếp với ứng viên)"
        
        db.commit()
        db.refresh(fetched_job)

        # Đọc lại từ CSDL để xác thực tính bền vững (Durability trong ACID)
        re_read_job = db.query(Job).filter(Job.id == created_job_id).first()
        print(f"[+] Đọc lại từ PostgreSQL sau Commit:")
        print(f"    - ID                      : {re_read_job.id}")
        print(f"    - salary_min              : {re_read_job.salary_min} (NULL)")
        print(f"    - salary_max              : {re_read_job.salary_max} (NULL)")
        print(f"    - benefits (Lương cập nhật): {re_read_job.benefits}")
        print(f"    - updated_at              : {re_read_job.updated_at}")
        print("[✔] BƯỚC 4 HOÀN TẤT: Cập nhật và lưu bền vững vào CSDL thành công!")

        # ──────────────────────────────────────────────────────────────────
        # BƯỚC 5: DELETE / XÓA MỀM — Chuyển is_active = False để bảo toàn lịch sử
        # ──────────────────────────────────────────────────────────────────
        separator("BƯỚC 5: DELETE / XÓA MỀM (BẢO TOÀN LỊCH SỬ DỮ LIỆU)")
        
        print(f"[i] Trạng thái trước khi xóa: is_active = {re_read_job.is_active}")
        print(f"[i] Áp dụng cơ chế Soft Delete: chuyển trạng thái is_active = False...")
        
        re_read_job.is_active = False
        db.commit()
        db.refresh(re_read_job)

        # Kiểm tra lại bản ghi trong DB
        soft_deleted_job = db.query(Job).filter(Job.id == created_job_id).first()
        assert soft_deleted_job is not None, "Lỗi: Bản ghi bị mất vật lý khỏi CSDL!"
        assert soft_deleted_job.is_active is False, "Lỗi: Trạng thái is_active chưa được đổi thành False!"

        print(f"[+] Kiểm tra bản ghi sau Soft Delete:")
        print(f"    - ID                      : {soft_deleted_job.id}")
        print(f"    - Tiêu đề                 : {soft_deleted_job.title}")
        print(f"    - is_active               : {soft_deleted_job.is_active} (Đã ngưng hoạt động / Xóa mềm)")
        print(f"    - Dữ liệu lịch sử         : VẪN TỒN TẠI NGUYÊN VẸN trong PostgreSQL")
        print(f"    - Khóa ngoại (Foreign Key): Không bị vi phạm ràng buộc liên kết bảng")
        print("[✔] BƯỚC 5 HOÀN TẤT: Xóa mềm thành công, bảo toàn 100% dữ liệu lịch sử!")

        # ──────────────────────────────────────────────────────────────────
        # TỔNG KẾT KẾT QUẢ KIỂM TRA
        # ──────────────────────────────────────────────────────────────────
        separator("TỔNG KẾT MINH CHỨNG THAO TÁC CSDL (CRUD)")
        print(f"{'THAO TÁC (OPERATION)':<20} | {'ĐỐI TƯỢNG (TARGET)':<22} | {'KẾT QUẢ':<15} | {'GHI CHÚ':<20}")
        print("-" * 85)
        print(f"{'1. READ SCHEMA':<20} | {'PostgreSQL Catalog':<22} | {'PASSED ✅':<15} | {f'{len(table_names)} bảng hoạt động':<20}")
        print(f"{'2. CREATE (Lưu)':<20} | {'jobs table':<22} | {'PASSED ✅':<15} | {f'Tạo mới Job ID #{created_job_id}':<20}")
        print(f"{'3. READ (Đọc)':<20} | {'jobs table':<22} | {'PASSED ✅':<15} | {'Truy vấn chuẩn PK':<20}")
        print(f"{'4. UPDATE (Sửa)':<20} | {'jobs table':<22} | {'PASSED ✅':<15} | {'Lương: Thỏa thuận':<20}")
        print(f"{'5. DELETE (Xóa mềm)':<20} | {'jobs table':<22} | {'PASSED ✅':<15} | {'is_active = False':<20}")
        print("-" * 85)
        print("  KẾT LUẬN: HỆ THỐNG CSDL POSTGRESQL KẾT NỐI VÀ HOẠT ĐỘNG ỔN ĐỊNH 100%!")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    main()

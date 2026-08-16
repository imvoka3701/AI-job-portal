"""Seed standard demo accounts (Admin, Employer, Candidate) with exact known credentials."""

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.job import Job  # noqa: F401
from app.models.application import Application  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.company import Company

DEMO_ACCOUNTS = [
    {
        "email": "admin@jobportal.vn",
        "password": "Admin@123456",
        "full_name": "Quản Trị Viên Hệ Thống",
        "role": UserRole.ADMIN,
        "is_active": True,
    },
    {
        "email": "admin@jobportal.com",
        "password": "Admin@123",
        "full_name": "System Administrator",
        "role": UserRole.ADMIN,
        "is_active": True,
    },
    {
        "email": "employer@techcorp.vn",
        "password": "Employer@123456",
        "full_name": "Trần Thị Mai HR",
        "role": UserRole.EMPLOYER,
        "is_active": True,
        "company_name": "TechCorp VN",
        "company_description": "Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam.",
    },
    {
        "email": "candidate@jobportal.vn",
        "password": "Candidate@123456",
        "full_name": "Nguyễn Văn An",
        "role": UserRole.CANDIDATE,
        "is_active": True,
        "phone": "0987654321",
    },
]


def seed_standard_accounts():
    db = SessionLocal()
    try:
        print("[SEED] Ensuring standard demo accounts exist...")
        for acc in DEMO_ACCOUNTS:
            user = db.query(User).filter(User.email == acc["email"]).first()
            if user:
                user.hashed_password = hash_password(acc["password"])
                user.is_active = True
                user.role = acc["role"]
                user.full_name = acc["full_name"]
                if "company_name" in acc:
                    user.company_name = acc["company_name"]
                    user.company_description = acc.get("company_description")
                print(f"[UPDATED] {acc['email']} -> {acc['password']}")
            else:
                user = User(
                    email=acc["email"],
                    hashed_password=hash_password(acc["password"]),
                    full_name=acc["full_name"],
                    role=acc["role"],
                    is_active=True,
                    company_name=acc.get("company_name"),
                    company_description=acc.get("company_description"),
                    phone=acc.get("phone"),
                )
                db.add(user)
                print(f"[CREATED] {acc['email']} -> {acc['password']}")

        db.commit()

        # Link employer to a company workspace if needed
        employer_user = db.query(User).filter(User.email == "employer@techcorp.vn").first()
        if employer_user:
            company = db.query(Company).filter(Company.created_by_user_id == employer_user.id).first()
            if not company:
                company = Company(
                    name="TechCorp VN",
                    description="Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam.",
                    created_by_user_id=employer_user.id,
                )
                db.add(company)
                db.commit()

        print("[SUCCESS] All demo accounts are active and ready to log in!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_standard_accounts()

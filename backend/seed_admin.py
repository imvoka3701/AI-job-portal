"""Seed script — create a default admin account if one does not exist.

Usage:
    python seed_admin.py               # Create admin@jobportal.local / Admin@123
    python seed_admin.py email pass    # Custom credentials

The script exits cleanly if an admin account already exists.
"""

import sys

from app.config import settings
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User, UserRole

# Import related models so SQLAlchemy can resolve User's relationships
from app.models.job import Job  # noqa: F401
from app.models.application import Application  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.notification import Notification  # noqa: F401

ADMIN_EMAIL = sys.argv[1] if len(sys.argv) > 1 else "admin@jobportal.com"
ADMIN_PASSWORD = sys.argv[2] if len(sys.argv) > 2 else "Admin@123"


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing:
            print(f"[OK] Admin account already exists: {existing.email}")
            return

        admin = User(
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            full_name="System Admin",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[OK] Admin account created: {admin.email}")
        print(f"     Login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()

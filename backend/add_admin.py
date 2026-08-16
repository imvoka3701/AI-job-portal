from app.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

db = SessionLocal()
admin = db.query(User).filter_by(email='admin@jobportal.local').first()
if not admin:
    admin = User(
        email='admin@jobportal.local', 
        hashed_password=hash_password('Admin@123456'), 
        full_name='System Admin', 
        role=UserRole.ADMIN, 
        is_active=True
    )
    db.add(admin)
    db.commit()
    print("Created admin@jobportal.local")
else:
    print("admin@jobportal.local already exists")

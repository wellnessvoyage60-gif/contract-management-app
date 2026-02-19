from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User

def ensure_admin_exists(db):
    admin = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    if not admin:
        admin = User(
            username=settings.ADMIN_USERNAME,
            email='admin@system.local',
            full_name='System Administrator',
            role='admin',
            is_active=True,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            ad_synced=False
        )
        db.add(admin)
        db.commit()
        print('[ADMIN] Default admin account created.')

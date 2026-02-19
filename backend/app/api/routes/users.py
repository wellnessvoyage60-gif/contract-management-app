from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.services.ad_service import get_ad_users

router = APIRouter()


@router.get('/')
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{'id': u.id, 'username': u.username, 'full_name': u.full_name,
             'email': u.email, 'department': u.department, 'role': u.role,
             'is_active': u.is_active} for u in users]


@router.post('/sync-ad')
def sync_ad_users(db: Session = Depends(get_db)):
    ad_users = get_ad_users()
    synced = 0
    for u in ad_users:
        existing = db.query(User).filter(User.username == u['username']).first()
        if not existing:
            new_user = User(
                username=u['username'], email=u['email'],
                full_name=u['full_name'], department=u['department'],
                designation=u['designation'], employee_id=u['employee_id'],
                role='user', ad_synced=True
            )
            db.add(new_user)
            synced += 1
    db.commit()
    return {'message': f'Synced {synced} new users', 'total_ad_users': len(ad_users)}

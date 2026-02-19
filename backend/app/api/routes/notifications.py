from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification

router = APIRouter()


@router.get('/')
def list_notifications(db: Session = Depends(get_db)):
    notifs = db.query(Notification).order_by(
        Notification.created_at.desc()).limit(50).all()
    return [{'id': n.id, 'contract_id': n.contract_id,
             'type': n.notification_type, 'message': n.message,
             'created_at': n.created_at.isoformat() if n.created_at else None
            } for n in notifs]

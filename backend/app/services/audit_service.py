from app.models.audit_log import AuditLog
from datetime import datetime


def log_event(db, contract_id: int, user_id: int, action: str,
              details: str = None, ip: str = None):
    log = AuditLog(
        contract_id=contract_id,
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()

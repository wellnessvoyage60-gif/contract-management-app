"""
SLA Reminder Scheduler
- Reminder 1: After 3 working days unattended
- Reminder 2: After 6 working days unattended
- Reminder 3: After 9 working days -> escalate to line manager
All reminders CC the uploader.
"""
 
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.contract import Contract
from app.models.contract_reviewer import ContractReviewer
from app.models.notification import Notification
from app.models.user import User
from app.services.notification_service import (
    send_reminder_email, send_escalation_email
)
from app.utils.date_utils import calculate_working_days_since
 
 
def check_sla_reminders():
    """Main scheduler function. Called periodically."""
    print(f'[SLA SCHEDULER] Running check at '
          f'{datetime.utcnow().isoformat()}')
    db: Session = SessionLocal()
    try:
        active_contracts = db.query(Contract).filter(
            Contract.status.in_([
                'draft', 'in_review', 'vendor_feedback']),
            Contract.current_handler_id.isnot(None)
        ).all()
        for contract in active_contracts:
            _check_contract_reminders(db, contract)
        db.commit()
        print(f'[SLA SCHEDULER] Checked '
              f'{len(active_contracts)} active contracts')
    except Exception as e:
        print(f'[SLA SCHEDULER ERROR] {e}')
        db.rollback()
    finally:
        db.close()
 
 
def _check_contract_reminders(db, contract):
    current_review = db.query(ContractReviewer).filter(
        ContractReviewer.contract_id == contract.id,
        ContractReviewer.reviewer_id ==
            contract.current_handler_id,
        ContractReviewer.status.in_([
            'pending', 'in_progress'])
    ).order_by(
        ContractReviewer.assigned_at.desc()).first()
 
    if not current_review or not current_review.assigned_at:
        return
 
    working_days = calculate_working_days_since(
        current_review.assigned_at)
 
    existing = db.query(Notification).filter(
        Notification.contract_id == contract.id,
        Notification.recipient_id ==
            contract.current_handler_id,
        Notification.notification_type.in_([
            'reminder_1', 'reminder_2', 'escalation'])
    ).all()
    sent = {n.notification_type for n in existing}
 
    if working_days >= 3 and 'reminder_1' not in sent:
        _send_and_log(db, contract, 'reminder_1', 1)
    if working_days >= 6 and 'reminder_2' not in sent:
        _send_and_log(db, contract, 'reminder_2', 2)
    if working_days >= 9 and 'escalation' not in sent:
        _send_escalation(db, contract)
 
 
def _send_and_log(db, contract, notif_type, num):
    send_reminder_email(contract, num, db)
    db.add(Notification(
        contract_id=contract.id,
        recipient_id=contract.current_handler_id,
        notification_type=notif_type,
        email_sent=True,
        email_sent_at=datetime.utcnow(),
        message=f'Reminder #{num}: Contract '
            f'{contract.contract_number} unattended '
            f'for {num * 3}+ working days.'
    ))
 
 
def _send_escalation(db, contract):
    handler = db.query(User).get(
        contract.current_handler_id)
    if not handler: return
    manager = (db.query(User).get(handler.manager_id)
        if handler.manager_id else None)
    target = manager or db.query(User).get(
        contract.uploader_id)
    if target:
        send_escalation_email(
            contract, target, handler, db)
    db.add(Notification(
        contract_id=contract.id,
        recipient_id=contract.current_handler_id,
        notification_type='escalation',
        email_sent=True,
        email_sent_at=datetime.utcnow(),
        message=f'ESCALATION: Contract '
            f'{contract.contract_number} unattended '
            f'for 9+ working days.'
    ))

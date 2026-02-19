from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta
import shutil, os, traceback

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.contract import Contract
from app.models.contract_document import ContractDocument
from app.models.contract_reviewer import ContractReviewer
from app.models.user import User
from app.services.audit_service import log_event

router = APIRouter()


@router.get('/')
def list_contracts(db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    contracts = db.query(Contract).all()
    return [{'id': c.id, 'title': c.title, 'contract_number': c.contract_number,
             'category': c.category, 'status': c.status, 'vendor_name': c.vendor_name,
             'created_at': c.created_at.isoformat() if c.created_at else None
            } for c in contracts]


@router.get('/{contract_id}')
def get_contract(contract_id: int, db: Session = Depends(get_db),
                 current_user=Depends(get_current_user)):
    contract = db.query(Contract).get(contract_id)
    if not contract:
        raise HTTPException(404, 'Contract not found')

    handler_name = None
    if contract.current_handler_id:
        handler = db.query(User).get(contract.current_handler_id)
        handler_name = handler.full_name if handler else None

    uploader = db.query(User).get(contract.uploader_id)
    uploader_name = uploader.full_name if uploader else None

    return {
        'id': contract.id,
        'title': contract.title,
        'contract_number': contract.contract_number,
        'status': contract.status,
        'category': contract.category,
        'vendor_name': contract.vendor_name,
        'contract_value': str(contract.contract_value) if contract.contract_value else None,
        'sla_days': contract.sla_days,
        'sla_deadline': contract.sla_deadline.isoformat() if contract.sla_deadline else None,
        'current_handler_id': contract.current_handler_id,
        'current_handler_name': handler_name,
        'uploader_id': contract.uploader_id,
        'uploader_name': uploader_name,
        'current_version': contract.current_version,
        'created_at': contract.created_at.isoformat() if contract.created_at else None,
    }


@router.post('/upload')
async def upload_contract(
    background_tasks: BackgroundTasks,
    title:          str           = Form(...),
    category:       str           = Form(...),
    vendor_name:    Optional[str] = Form(None),
    contract_value: Optional[str] = Form(None),
    sla_days:       Optional[str] = Form('7'),
    reviewer_id:    Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Safe type conversion - avoids crash when browser sends empty string
    def to_float(v):
        try:    return float(v) if v else None
        except: return None

    def to_int(v):
        try:    return int(v) if v else None
        except: return None

    cv  = to_float(contract_value)
    sd  = to_int(sla_days) or 7
    rid = to_int(reviewer_id)

    if not rid:
        raise HTTPException(400, 'reviewer_id is required')

    count = db.query(Contract).count() + 1
    contract_number = f'CTR-{date.today().year}-{count:04d}'
    sla_deadline = date.today() + timedelta(days=sd)

    contract = Contract(
        title=title,
        contract_number=contract_number,
        category=category,
        vendor_name=vendor_name,
        contract_value=cv,
        sla_days=sd,
        sla_deadline=sla_deadline,
        uploader_id=current_user.id,
        current_handler_id=rid,
        status='draft'
    )
    db.add(contract)
    db.flush()

    file_dir = os.path.join(settings.UPLOAD_DIR, str(contract.id))
    os.makedirs(file_dir, exist_ok=True)
    file_path = os.path.join(file_dir, f'v1_{file.filename}')
    with open(file_path, 'wb') as f:
        shutil.copyfileobj(file.file, f)

    doc = ContractDocument(
        contract_id=contract.id,
        version=1,
        file_path=file_path,
        file_name=file.filename,
        file_size=os.path.getsize(file_path),
        uploaded_by=current_user.id
    )
    db.add(doc)

    reviewer = ContractReviewer(
        contract_id=contract.id,
        reviewer_id=rid,
        review_order=1,
        status='pending',
        assigned_at=datetime.utcnow()
    )
    db.add(reviewer)
    db.commit()

    # Store values for background tasks before they go out of scope
    contract_id_bg   = contract.id
    uploader_id_bg   = current_user.id
    reviewer_id_bg   = rid

    def post_upload_tasks():
        try:
            from app.services.notification_service import send_assignment_email
            send_assignment_email(contract, reviewer_id_bg, db)
        except Exception as e:
            print(f"[WARN] Email notification failed: {e}")
        try:
            log_event(db, contract_id_bg, uploader_id_bg, 'uploaded',
                      'Contract uploaded and assigned to reviewer.')
        except Exception as e:
            print(f"[WARN] Audit log failed: {e}")

    background_tasks.add_task(post_upload_tasks)

    return {'message': 'Contract uploaded', 'contract_number': contract_number}


@router.post('/{contract_id}/submit-review')
def submit_review(
    contract_id: int, action: str = Form(...),
    next_reviewer_id: int = Form(None), comments: str = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        contract = db.query(Contract).get(contract_id)
        if not contract:
            raise HTTPException(404, 'Contract not found')

        # Find current reviewer record (match both pending and in_progress)
        current_review = db.query(ContractReviewer).filter(
            ContractReviewer.contract_id == contract_id,
            ContractReviewer.reviewer_id == current_user.id,
            ContractReviewer.status.in_(['pending', 'in_progress'])
        ).first()

        if current_review:
            current_review.status = 'completed'
            current_review.completed_at = datetime.utcnow()
            current_review.action_taken = action
            current_review.comments = comments
            if not current_review.started_at:
                current_review.started_at = current_review.assigned_at or datetime.utcnow()

        if action == 'approve':
            contract.status = 'approved'
            contract.current_handler_id = None
            log_event(db, contract_id, current_user.id, 'approved',
                      comments or 'Contract approved')
            try:
                from app.services.notification_service import send_approval_email
                send_approval_email(contract, db)
            except Exception as e:
                print(f"[WARN] Approval email failed: {e}")

        elif action == 'send_to_next':
            if not next_reviewer_id:
                raise HTTPException(400, 'next_reviewer_id is required')
            contract.status = 'in_review'
            contract.current_handler_id = next_reviewer_id

            max_order = db.query(func.max(ContractReviewer.review_order)).filter(
                ContractReviewer.contract_id == contract_id).scalar() or 0

            new_reviewer = ContractReviewer(
                contract_id=contract_id,
                reviewer_id=next_reviewer_id,
                review_order=max_order + 1,
                status='pending',
                assigned_at=datetime.utcnow()
            )
            db.add(new_reviewer)
            log_event(db, contract_id, current_user.id, 'sent_to_next',
                      f'Sent to next reviewer. Comments: {comments}')
            try:
                from app.services.notification_service import send_assignment_email
                send_assignment_email(contract, next_reviewer_id, db)
            except Exception as e:
                print(f"[WARN] Assignment email failed: {e}")

        elif action == 'vendor_feedback':
            contract.status = 'vendor_feedback'
            log_event(db, contract_id, current_user.id, 'vendor_feedback',
                      comments or 'Sent to vendor')

        db.commit()
        return {'message': f'Review submitted: {action}'}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(500, f'Review submission failed: {str(e)}')


@router.get('/{contract_id}/activities')
def get_contract_activities(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    contract_result = db.execute(
        text("SELECT * FROM contracts WHERE id = :id"),
        {'id': contract_id}
    )
    contract = contract_result.mappings().first()

    if not contract:
        raise HTTPException(status_code=404, detail='Contract not found')

    activities_result = db.execute(
        text("""
            SELECT
                ca.*,
                u.full_name as user_full_name,
                u.username as user_username
            FROM contract_activities ca
            LEFT JOIN users u ON ca.user_id = u.id
            WHERE ca.contract_id = :contract_id
            ORDER BY ca.created_at DESC
        """),
        {'contract_id': contract_id}
    )

    rows = activities_result.mappings().all()

    activities = []
    for r in rows:
        activity = dict(r)
        if activity.get('created_at') and not isinstance(activity['created_at'], str):
            activity['created_at'] = str(activity['created_at'])

        activity['user'] = activity.get('user_full_name') or activity.get('user_username') or 'System'

        if activity['activity_type'] == 'uploaded':
            activity['action'] = 'Created contract'
        elif activity['activity_type'] == 'status_changed':
            activity['action'] = f"Changed status to {activity.get('description', '')}"
        elif activity['activity_type'] == 'handler_assigned':
            activity['action'] = f"Assigned to {activity.get('description', 'handler')}"
        elif activity['activity_type'] == 'document_updated':
            activity['action'] = f"Updated document"
        else:
            activity['action'] = activity.get('description') or activity['activity_type']

        activities.append(activity)

    return activities


class StatusUpdate(BaseModel):
    status: str


@router.patch('/{contract_id}/status')
def update_contract_status(
    contract_id: int,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    valid_statuses = ['draft', 'in_review', 'vendor_feedback', 'approved', 'signed']
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    contract_result = db.execute(
        text("SELECT * FROM contracts WHERE id = :id"),
        {'id': contract_id}
    )
    contract = contract_result.mappings().first()

    if not contract:
        raise HTTPException(status_code=404, detail='Contract not found')

    old_status = contract['status']
    new_status = status_update.status

    db.execute(
        text("UPDATE contracts SET status = :status, updated_at = NOW() WHERE id = :id"),
        {'status': new_status, 'id': contract_id}
    )

    db.execute(
        text("""
            INSERT INTO contract_activities (
                contract_id, user_id, activity_type, description, created_at
            ) VALUES (
                :contract_id, :user_id, 'status_changed', :description, NOW()
            )
        """),
        {
            'contract_id': contract_id,
            'user_id': current_user.id,
            'description': new_status,
        }
    )

    db.commit()

    return {
        'message': f'Status updated from {old_status} to {new_status}',
        'old_status': old_status,
        'new_status': new_status,
    }


@router.delete('/{contract_id}')
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    contract = db.query(Contract).get(contract_id)
    if not contract:
        raise HTTPException(404, 'Contract not found')
    if current_user.role != 'admin' and contract.uploader_id != current_user.id:
        raise HTTPException(403, 'Not authorized to delete this contract')
    if contract.status != 'draft':
        raise HTTPException(400, 'Only draft contracts can be deleted')
    # Delete related records first to avoid FK constraint errors
    db.execute(text('DELETE FROM audit_logs WHERE contract_id = :id'), {'id': contract_id})
    db.execute(text('DELETE FROM contract_activities WHERE contract_id = :id'), {'id': contract_id})
    db.execute(text('DELETE FROM contract_reviewers WHERE contract_id = :id'), {'id': contract_id})
    db.execute(text('DELETE FROM contract_documents WHERE contract_id = :id'), {'id': contract_id})
    db.delete(contract)
    db.commit()
    return {'message': 'Contract deleted successfully'}
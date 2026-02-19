from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, hash_password, verify_password
from app.models.contract import Contract
from app.models.user import User
from app.services.audit_service import log_event
from app.services.notification_service import send_vendor_response_email


router = APIRouter()


def get_current_vendor(current_user=Depends(get_current_user)):
    if current_user.role != 'vendor':
        raise HTTPException(403, 'Vendor access only')
    return current_user

@router.post('/create')
def create_vendor_account(
    username: str = Form(...),
    email: str = Form(...),
    full_name: str = Form(...),
    company: str = Form(None),
    password: str = Form(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(403,
            'Only admins can create vendor accounts')
 
    existing = db.query(User).filter(
        (User.username == username) |
        (User.email == email)
    ).first()
    if existing:
        raise HTTPException(400,
            'Username or email already exists')
    if len(password) < 8:
        raise HTTPException(400,
            'Password must be at least 8 characters')
 
    vendor = User(
        username=username, email=email,
        full_name=full_name, department=company,
        role='vendor', is_active=True,
        password_hash=hash_password(password),
        ad_synced=False
    )
    db.add(vendor)
    db.commit()
    return {'message': f'Vendor account created: '
            f'{username}', 'vendor_id': vendor.id}

@router.get('/my-contracts')
def get_vendor_contracts(db: Session = Depends(get_db),
                          current_user=Depends(get_current_vendor)):
    contracts = db.query(Contract).filter(
        Contract.current_handler_id == current_user.id,
        Contract.status == 'vendor_feedback').all()
    return [{'id': c.id, 'title': c.title,
             'contract_number': c.contract_number} for c in contracts]


@router.post('/submit-feedback/{contract_id}')
def submit_vendor_feedback(contract_id: int, comments: str = Form(None),
                            db: Session = Depends(get_db),
                            current_user=Depends(get_current_vendor)):
    contract = db.query(Contract).get(contract_id)
    if not contract or contract.current_handler_id != current_user.id:
        raise HTTPException(403, 'Not assigned to this contract')
    contract.status = 'in_review'
    contract.current_handler_id = contract.uploader_id
    db.commit()
    log_event(db, contract_id, current_user.id, 'vendor_feedback_submitted', comments)
    send_vendor_response_email(contract, db)
    return {'message': 'Feedback submitted'}


@router.get('/profile')
def get_vendor_profile(current_user=Depends(get_current_vendor)):
    return {'id': current_user.id, 'full_name': current_user.full_name,
            'email': current_user.email, 'company': current_user.department}


@router.put('/profile')
def update_vendor_profile(full_name: str = Form(None), company: str = Form(None),
                           db: Session = Depends(get_db),
                           current_user=Depends(get_current_vendor)):
    if full_name: current_user.full_name = full_name
    if company: current_user.department = company
    db.commit()
    return {'message': 'Profile updated'}


@router.put('/change-password')
def change_vendor_password(old_password: str = Form(...),
                            new_password: str = Form(...),
                            db: Session = Depends(get_db),
                            current_user=Depends(get_current_vendor)):
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(400, 'Current password is incorrect')
    if len(new_password) < 8:
        raise HTTPException(400, 'Password must be at least 8 characters')
    current_user.password_hash = hash_password(new_password)
    db.commit()
    return {'message': 'Password changed'}

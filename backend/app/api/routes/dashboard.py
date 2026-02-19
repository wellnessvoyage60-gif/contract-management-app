from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.contract import Contract

router = APIRouter()


@router.get('/stats')
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Contract.id)).scalar()
    drafts = db.query(func.count(Contract.id)).filter(Contract.status == 'draft').scalar()
    in_review = db.query(func.count(Contract.id)).filter(
        Contract.status == 'in_review').scalar()
    approved = db.query(func.count(Contract.id)).filter(
        Contract.status == 'approved').scalar()
    signed = db.query(func.count(Contract.id)).filter(
        Contract.status == 'signed').scalar()
    vendor_fb = db.query(func.count(Contract.id)).filter(
        Contract.status == 'vendor_feedback').scalar()

    return {
        'total_contracts': total, 'drafts': drafts,
        'in_review': in_review, 'vendor_feedback': vendor_fb,
        'approved': approved, 'signed': signed
    }
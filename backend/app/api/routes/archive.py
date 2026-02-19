# backend/app/api/routes/archive.py
# Paste this ENTIRE file into: backend/app/api/routes/archive.py
# Matches repository_documents table from Flask schema

import os
import shutil
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter()

# ── Upload directory ──────────────────────────────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'uploads', 'repository')
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Pydantic response schema ──────────────────────────────────────────────────
class ArchiveDocOut(BaseModel):
    id:                      int
    contract_title:          Optional[str]
    vendor_name:             Optional[str]
    contract_value:          Optional[float]
    currency:                Optional[str]
    start_date:              Optional[str]
    end_date:                Optional[str]
    termination_period_days: Optional[int]
    original_filename:       str
    signing_status:          Optional[str]
    created_at:              Optional[str]

    class Config:
        from_attributes = True


# ── List all archived documents ───────────────────────────────────────────────
@router.get('', response_model=List[ArchiveDocOut])
def list_archive(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return all archived (signed) documents"""
    from sqlalchemy import text, or_

    query = "SELECT * FROM repository_documents WHERE 1=1"
    params = {}

    if search:
        query += """ AND (
            contract_title  LIKE :search OR
            vendor_name     LIKE :search OR
            original_filename LIKE :search
        )"""
        params['search'] = f'%{search}%'

    query += " ORDER BY created_at DESC"

    result = db.execute(text(query), params)
    rows   = result.mappings().all()

    # Serialize dates to strings for JSON
    docs = []
    for r in rows:
        d = dict(r)
        for date_field in ('start_date', 'end_date', 'created_at', 'updated_at'):
            if d.get(date_field) and not isinstance(d[date_field], str):
                d[date_field] = str(d[date_field])
        docs.append(d)
    return docs


# ── Upload a signed PDF ───────────────────────────────────────────────────────
@router.post('/upload', status_code=201)
async def upload_archive(
    contract_title:          str            = Form(...),
    vendor_name:             str            = Form(...),
    contract_value:          Optional[str]  = Form(None),
    currency:                Optional[str]  = Form('BDT'),
    start_date:              Optional[str]  = Form(None),
    end_date:                Optional[str]  = Form(None),
    termination_period_days: Optional[str]  = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upload a signed/scanned PDF to the archive"""
    from sqlalchemy import text

    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail='Only PDF files are accepted.')

    # Save to disk
    timestamp   = datetime.now().strftime('%Y%m%d_%H%M%S')
    stored_name = f"{timestamp}_{file.filename}"
    file_path   = os.path.join(UPLOAD_DIR, stored_name)

    with open(file_path, 'wb') as f:
        shutil.copyfileobj(file.file, f)

    file_size = os.path.getsize(file_path)

    # Helper converters
    def _date(s):
        try:    return datetime.strptime(s, '%Y-%m-%d').date() if s else None
        except: return None

    def _num(s):
        try:    return float(s) if s else None
        except: return None

    def _int(s):
        try:    return int(s) if s else None
        except: return None

    insert_sql = text("""
        INSERT INTO repository_documents (
            user_id, contract_title, original_filename, stored_filename,
            file_path, file_size, mime_type,
            vendor_name, contract_value, currency,
            start_date, end_date, termination_period_days,
            signing_status, extraction_status
        ) VALUES (
            :user_id, :contract_title, :original_filename, :stored_filename,
            :file_path, :file_size, :mime_type,
            :vendor_name, :contract_value, :currency,
            :start_date, :end_date, :termination_period_days,
            'signed', 'pending'
        )
    """)

    db.execute(insert_sql, {
        'user_id':                 current_user.id,
        'contract_title':          contract_title,
        'original_filename':       file.filename,
        'stored_filename':         stored_name,
        'file_path':               file_path,
        'file_size':               file_size,
        'mime_type':               'application/pdf',
        'vendor_name':             vendor_name,
        'contract_value':          _num(contract_value),
        'currency':                currency or 'BDT',
        'start_date':              _date(start_date),
        'end_date':                _date(end_date),
        'termination_period_days': _int(termination_period_days),
    })
    db.commit()

    return {'message': 'Document archived successfully.', 'filename': file.filename}


# ── Download a document ───────────────────────────────────────────────────────
@router.get('/{doc_id}/download')
def download_archive(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Download an archived PDF by ID"""
    from sqlalchemy import text

    result = db.execute(
        text("SELECT * FROM repository_documents WHERE id = :id"),
        {'id': doc_id}
    )
    doc = result.mappings().first()

    if not doc:
        raise HTTPException(status_code=404, detail='Document not found.')
    if not os.path.exists(doc['file_path']):
        raise HTTPException(status_code=404, detail='File not found on server.')

    return FileResponse(
        path=doc['file_path'],
        media_type='application/pdf',
        filename=doc['original_filename'],
    )


# ── Delete a document ─────────────────────────────────────────────────────────
@router.delete('/{doc_id}')
def delete_archive(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete an archived document (admin only)"""
    from sqlalchemy import text

    result = db.execute(
        text("SELECT * FROM repository_documents WHERE id = :id"),
        {'id': doc_id}
    )
    doc = result.mappings().first()

    if not doc:
        raise HTTPException(status_code=404, detail='Document not found.')

    # Remove physical file
    if os.path.exists(doc['file_path']):
        os.remove(doc['file_path'])

    db.execute(text("DELETE FROM repository_documents WHERE id = :id"), {'id': doc_id})
    db.commit()

    return {'message': 'Document deleted successfully.'}
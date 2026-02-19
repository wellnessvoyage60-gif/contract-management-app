from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import httpx, os
 
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.contract import Contract
from app.models.contract_document import ContractDocument
from app.services.audit_service import log_event
 
router = APIRouter()
 
 
def sign_onlyoffice_token(payload: dict) -> str:
    """Sign the config payload as JWT for OnlyOffice.
    Uses PyJWT which is compatible with OnlyOffice's jsonwebtoken.
    Install: pip install PyJWT
    """
    import jwt
    return jwt.encode(payload, settings.ONLYOFFICE_JWT_SECRET, algorithm="HS256")
 
 
@router.get('/config/{contract_id}')
def get_editor_config(contract_id: int, db: Session = Depends(get_db),
                       current_user=Depends(get_current_user)):
    contract = db.query(Contract).get(contract_id)
    if not contract:
        raise HTTPException(404, 'Contract not found')
 
    doc = db.query(ContractDocument).filter(
        ContractDocument.contract_id == contract_id,
        ContractDocument.is_current == True).first()
 
    if not doc:
        raise HTTPException(404, 'No document found for this contract')
 
    log_event(db, contract_id, current_user.id, 'opened',
              f'{current_user.full_name} opened for editing.')
 
    # ---- Build the document URL ----
    # OnlyOffice runs inside Docker and needs to reach your backend.
    # Use host.docker.internal so Docker container can reach the host.
    doc_url = f'{settings.APP_URL}/api/editor/files/{doc.id}/download'
    callback_url = f'{settings.APP_URL}/api/editor/callback'
 
    # Build the config payload
    config = {
        'document': {
            'fileType': 'docx',
            'key': f'{contract_id}_v{contract.current_version}_{int(datetime.utcnow().timestamp())}',
            'title': doc.file_name,
            'url': doc_url,
            'permissions': {
                'edit': True,
                'review': True,
                'comment': True,
                'download': True,
                'print': True
            }
        },
        'documentType': 'word',
        'editorConfig': {
            'mode': 'edit',
            'callbackUrl': callback_url,
            'user': {
                'id': str(current_user.id),
                'name': current_user.full_name
            },
            'customization': {
                'review': {
                    'reviewDisplay': 'markup',
                    'trackChanges': True
                },
                'forcesave': True
            }
        }
    }
 
    # Sign the ENTIRE config as JWT and attach it
    config['token'] = sign_onlyoffice_token(config)
 
    return config
 
 
@router.post('/callback')
async def editor_callback(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    status = body.get('status')
    contract_key = body.get('key', '')
 
    try:
        contract_id = int(contract_key.split('_')[0]) if '_' in contract_key else None
    except (ValueError, IndexError):
        contract_id = None
 
    # status 2 = ready for saving, status 6 = force save
    if status in (2, 6) and contract_id:
        download_url = body.get('url')
        user_id = body.get('users', [None])[0]
 
        async with httpx.AsyncClient() as client:
            response = await client.get(download_url)
            edited_content = response.content
 
        contract = db.query(Contract).get(contract_id)
        if not contract:
            return {'error': 0}
 
        new_version = contract.current_version + 1
 
        old_doc = db.query(ContractDocument).filter(
            ContractDocument.contract_id == contract_id,
            ContractDocument.is_current == True).first()
 
        if old_doc:
            old_doc.is_current = False
 
            file_dir = os.path.join(settings.UPLOAD_DIR, str(contract_id))
            os.makedirs(file_dir, exist_ok=True)
            new_path = os.path.join(file_dir, f'v{new_version}_{old_doc.file_name}')
            with open(new_path, 'wb') as f:
                f.write(edited_content)
 
            new_doc = ContractDocument(
                contract_id=contract_id, version=new_version,
                file_path=new_path, file_name=old_doc.file_name,
                file_size=len(edited_content),
                uploaded_by=int(user_id) if user_id else contract.current_handler_id,
                is_current=True)
            db.add(new_doc)
            contract.current_version = new_version
            db.commit()
            log_event(db, contract_id, new_doc.uploaded_by, 'edited',
                      f'Version updated to v{new_version}.')
 
    return {'error': 0}
 
 
@router.get('/files/{document_id}/download')
def download_document(document_id: int, db: Session = Depends(get_db)):
    """Download endpoint - NO authentication required.
    OnlyOffice server calls this URL directly and cannot pass auth tokens.
    """
    doc = db.query(ContractDocument).get(document_id)
    if not doc:
        raise HTTPException(404, 'Document not found')
    if not os.path.exists(doc.file_path):
        raise HTTPException(404, f'File not found on disk: {doc.file_path}')
    return FileResponse(doc.file_path, filename=doc.file_name,
                        media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

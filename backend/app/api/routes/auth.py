from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.services.ad_service import authenticate_ad_user

router = APIRouter()


@router.post('/login')
def login(username: str = Form(...), password: str = Form(...),
          db: Session = Depends(get_db)):
    from app.core.config import settings

    # 1. Check hardcoded admin
    if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
        user = db.query(User).filter(User.username == username).first()
        if user:
            token = create_access_token({'sub': str(user.id), 'role': user.role})
            return {'access_token': token, 'token_type': 'bearer', 'role': user.role}

    # 2. Check AD / mock users
    if authenticate_ad_user(username, password):
        user = db.query(User).filter(User.username == username).first()
        if user:
            token = create_access_token({'sub': str(user.id), 'role': user.role})
            return {'access_token': token, 'token_type': 'bearer', 'role': user.role}

    # 3. Check vendor (password hash in DB)
    user = db.query(User).filter(
        User.username == username, User.role == 'vendor'
    ).first()
    if user and user.password_hash and verify_password(password, user.password_hash):
        token = create_access_token({'sub': str(user.id), 'role': user.role})
        return {'access_token': token, 'token_type': 'bearer', 'role': user.role}

    raise HTTPException(status_code=401, detail='Invalid username or password')

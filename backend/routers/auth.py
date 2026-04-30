from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import create_access_token, verify_password
from database import get_db
from models.user import User
from schemas.user import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, username=user.username, email=user.email)

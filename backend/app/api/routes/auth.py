from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserCreate, LoginRequest, TokenResponse, UserOut, RefreshRequest
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.api.deps import get_current_user
import random

router = APIRouter()

AVATAR_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
    "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6"
]

@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # First user becomes admin
    is_first = db.query(User).count() == 0

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.ADMIN if is_first else UserRole.MEMBER,
        avatar_color=random.choice(AVATAR_COLORS),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    data = verify_token(payload.refresh_token, "refresh")
    user = db.query(User).filter(User.id == data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh, user=user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

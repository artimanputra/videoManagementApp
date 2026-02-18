from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .db import get_db
from .models import User
from .schemas import UserCreate, UserLogin, UserOut, SignupResponse
from .auth_utils import hash_password, verify_password
from .jwt_utils import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=SignupResponse)
async def signup(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})

    return {
        "id": user.id,
        "email": user.email,
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/login")
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = res.scalars().first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}

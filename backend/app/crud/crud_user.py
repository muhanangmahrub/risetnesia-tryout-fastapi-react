from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def get_by_email(db: Session, *, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get(db: Session, id: Any) -> Optional[User]:
    return db.query(User).filter(User.id == id).first()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100):
    return db.query(User).order_by(User.id.asc()).offset(skip).limit(limit).all()

def authenticate(db: Session, *, email: str, password: str) -> Optional[User]:
    user = get_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def create(db: Session, *, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        name=obj_in.name,
        role=obj_in.role,
        password_hash=get_password_hash(obj_in.password),
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
    update_data = obj_in.model_dump(exclude_unset=True) if not isinstance(obj_in, dict) else obj_in
    if "password" in update_data:
        password_hash = get_password_hash(update_data["password"])
        db_obj.password_hash = password_hash
        # Use pop instead of del to be safer and potentially avoid lint confusion
        update_data.pop("password", None)
    
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, *, id: int) -> User:
    obj = db.query(User).get(id)
    db.delete(obj)
    db.commit()
    return obj

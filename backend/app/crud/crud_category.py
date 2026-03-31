from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.category import QuestionCategory
from app.schemas.category import CategoryCreate, CategoryUpdate


def get(db: Session, category_id: int) -> Optional[QuestionCategory]:
    return db.query(QuestionCategory).filter(QuestionCategory.id == category_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 200) -> List[QuestionCategory]:
    return db.query(QuestionCategory).order_by(QuestionCategory.name.asc()).offset(skip).limit(limit).all()


def create(db: Session, *, obj_in: CategoryCreate) -> QuestionCategory:
    db_obj = QuestionCategory(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, *, db_obj: QuestionCategory, obj_in: CategoryUpdate) -> QuestionCategory:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, category_id: int) -> Optional[QuestionCategory]:
    obj = db.query(QuestionCategory).get(category_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

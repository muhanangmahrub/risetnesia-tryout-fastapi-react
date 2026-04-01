from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.tryout import Question
from app.schemas.question import QuestionCreate, QuestionUpdate
from app.models.category import QuestionCategory

def get(db: Session, id: int) -> Optional[Question]:
    return db.query(Question).filter(Question.id == id).first()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> List[Question]:
    return db.query(Question).order_by(Question.id.asc()).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: QuestionCreate, user_id: int) -> Question:
    obj_data = obj_in.model_dump()
    category_ids = obj_data.pop("category_ids", [])
    db_obj = Question(**obj_data, created_by=user_id)
    
    if category_ids:
        categories = db.query(QuestionCategory).filter(QuestionCategory.id.in_(category_ids)).all()
        db_obj.categories = categories
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Question, obj_in: QuestionUpdate) -> Question:
    update_data = obj_in.model_dump(exclude_unset=True)
    if "category_ids" in update_data:
        category_ids = update_data.pop("category_ids")
        categories = db.query(QuestionCategory).filter(QuestionCategory.id.in_(category_ids)).all()
        db_obj.categories = categories
        
    for field in update_data:
        setattr(db_obj, field, update_data[field])
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, *, id: int) -> Question:
    obj = db.query(Question).get(id)
    db.delete(obj)
    db.commit()
    return obj

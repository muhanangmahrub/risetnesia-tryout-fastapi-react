from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import timedelta
from app.models.tryout import Tryout, Question
from app.models.result import StudentAnswer, Result
from app.schemas.tryout import TryoutCreate, TryoutUpdate

def get(db: Session, id: int) -> Optional[Tryout]:
    return db.query(Tryout).filter(Tryout.id == id).first()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> List[Tryout]:
    return db.query(Tryout).order_by(Tryout.id.asc()).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: TryoutCreate) -> Tryout:
    db_obj = Tryout(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Tryout, obj_in: TryoutUpdate) -> Tryout:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def add_question(db: Session, *, tryout: Tryout, question: Question) -> Tryout:
    if question not in tryout.questions:
        tryout.questions.append(question)
        db.commit()
    return tryout

def remove_question(db: Session, *, tryout: Tryout, question: Question) -> Tryout:
    if question in tryout.questions:
        tryout.questions.remove(question)
        db.commit()
    return tryout

def bulk_assign_questions(db: Session, *, tryout: Tryout, question_ids: List[int], action: str) -> Tryout:
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
    if action == 'add':
        existent_ids = {q.id for q in tryout.questions}
        for q in questions:
            if q.id not in existent_ids:
                tryout.questions.append(q)
    elif action == 'remove':
        q_map = {q.id: q for q in questions}
        tryout.questions = [q for q in tryout.questions if q.id not in q_map]
    
    db.commit()
    db.refresh(tryout)
    return tryout

def delete(db: Session, *, id: int) -> Tryout:
    obj = db.query(Tryout).get(id)
    if obj:
        # 1. Clear many-to-many relationship rows in tryout_questions
        obj.questions.clear()
        
        # 2. Delete related student answers and results to satisfy FK constraints
        db.query(StudentAnswer).filter(StudentAnswer.tryout_id == id).delete(synchronize_session=False)
        db.query(Result).filter(Result.tryout_id == id).delete(synchronize_session=False)
        
        # 3. Delete the actual Tryout
        db.delete(obj)
        db.commit()
    return obj

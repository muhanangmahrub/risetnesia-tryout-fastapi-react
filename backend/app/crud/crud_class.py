from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import Class, User
from app.schemas.class_schema import ClassCreate, ClassUpdate

def get(db: Session, id: int) -> Optional[Class]:
    return db.query(Class).filter(Class.id == id).first()

def get_by_enrollment_code(db: Session, code: str) -> Optional[Class]:
    return db.query(Class).filter(Class.enrollment_code == code).first()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> List[Class]:
    return db.query(Class).order_by(Class.id.asc()).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: ClassCreate, tutor_id: Optional[int] = None) -> Class:
    db_obj = Class(name=obj_in.name, tutor_id=tutor_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Class, obj_in: ClassUpdate) -> Class:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def enroll_student(db: Session, *, db_class: Class, student: User):
    if student not in db_class.students:
        db_class.students.append(student)
        db.commit()
    return db_class

def unenroll_student(db: Session, *, db_class: Class, student: User):
    if student in db_class.students:
        db_class.students.remove(student)
        db.commit()
    return db_class

def delete(db: Session, *, id: int) -> Class:
    obj = db.query(Class).get(id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

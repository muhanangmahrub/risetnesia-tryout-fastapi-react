from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_class, crud_user
from app.schemas.class_schema import ClassResponse, ClassCreate, ClassUpdate
from app.schemas.user import User as UserSchema
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/", response_model=List[ClassResponse])
def read_classes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve classes.
    """
    classes = crud_class.get_multi(db, skip=skip, limit=limit)
    return classes

@router.post("/", response_model=ClassResponse)
def create_class(
    *,
    db: Session = Depends(deps.get_db),
    class_in: ClassCreate,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Create new class.
    """
    # Just assign None or admin as tutor for now, can be updated later
    new_class = crud_class.create(db, obj_in=class_in)
    return new_class

@router.post("/{class_id}/enroll/{student_id}")
def enroll_student(
    class_id: int,
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    """
    Enroll student in a class.
    """
    db_class = crud_class.get(db, id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    student = crud_user.get(db, id=student_id)
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found")
    
    crud_class.enroll_student(db, db_class=db_class, student=student)
    return {"message": "Student enrolled successfully"}

@router.delete("/{class_id}/unenroll/{student_id}")
def unenroll_student(
    class_id: int,
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    """
    Unenroll student from a class.
    """
    db_class = crud_class.get(db, id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    student = crud_user.get(db, id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    crud_class.unenroll_student(db, db_class=db_class, student=student)
    return {"message": "Student unenrolled successfully"}

@router.get("/{class_id}/students", response_model=List[UserSchema])
def get_class_students(
    class_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Get all students enrolled in a class.
    """
    db_class = crud_class.get(db, id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return db_class.students

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    *,
    db: Session = Depends(deps.get_db),
    class_id: int,
    class_in: ClassUpdate,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a class.
    """
    db_class = crud_class.get(db, id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    db_class = crud_class.update(db, db_obj=db_class, obj_in=class_in)
    return db_class

@router.delete("/{class_id}", response_model=ClassResponse)
def delete_class(
    *,
    db: Session = Depends(deps.get_db),
    class_id: int,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a class.
    """
    db_class = crud_class.get(db, id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    db_class = crud_class.delete(db, id=class_id)
    return db_class

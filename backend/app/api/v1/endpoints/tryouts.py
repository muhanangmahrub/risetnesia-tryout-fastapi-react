from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_tryout, crud_question
from app.schemas.tryout import TryoutResponse, TryoutCreate, TryoutUpdate, BulkQuestionAssignment
from app.models.user import User as UserModel
from app.models.tryout import Tryout as TryoutModel

router = APIRouter()

@router.get("", response_model=List[TryoutResponse])
def read_tryouts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve tryouts. Students only see tryouts assigned to their enrolled classes.
    """
    if current_user.role == 'student':
        # Get class IDs the student is enrolled in
        student_class_ids = [c.id for c in current_user.enrolled_classes]
        # Return tryouts where class_id matches one of the student's classes
        tryouts = db.query(TryoutModel).filter(
            TryoutModel.class_id.in_(student_class_ids)
        ).order_by(TryoutModel.id.asc()).offset(skip).limit(limit).all()
        return tryouts
    else:
        # Admin/tutor see all tryouts
        tryouts = crud_tryout.get_multi(db, skip=skip, limit=limit)
        return tryouts


@router.post("", response_model=TryoutResponse)
def create_tryout(
    *,
    db: Session = Depends(deps.get_db),
    tryout_in: TryoutCreate,
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Create new tryout.
    """
    tryout = crud_tryout.create(db, obj_in=tryout_in)
    return tryout

@router.post("/{tryout_id}/questions/bulk", response_model=TryoutResponse)
def bulk_assign_questions_to_tryout(
    *,
    db: Session = Depends(deps.get_db),
    tryout_id: int,
    assignment: BulkQuestionAssignment,
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Add or remove multiple questions from a tryout.
    """
    tryout = crud_tryout.get(db, id=tryout_id)
    if not tryout:
        raise HTTPException(status_code=404, detail="Tryout not found")
    
    tryout = crud_tryout.bulk_assign_questions(
        db, 
        tryout=tryout, 
        question_ids=assignment.question_ids, 
        action=assignment.action
    )
    return tryout

@router.post("/{tryout_id}/questions/{question_id}", response_model=TryoutResponse)
def add_question_to_tryout(
    *,
    db: Session = Depends(deps.get_db),
    tryout_id: int,
    question_id: int,
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Add a question to a tryout.
    """
    tryout = crud_tryout.get(db, id=tryout_id)
    if not tryout:
        raise HTTPException(status_code=404, detail="Tryout not found")
    question = crud_question.get(db, id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    tryout = crud_tryout.add_question(db, tryout=tryout, question=question)
    return tryout

@router.delete("/{tryout_id}/questions/{question_id}", response_model=TryoutResponse)
def remove_question_from_tryout(
    *,
    db: Session = Depends(deps.get_db),
    tryout_id: int,
    question_id: int,
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Remove a question from a tryout.
    """
    tryout = crud_tryout.get(db, id=tryout_id)
    if not tryout:
        raise HTTPException(status_code=404, detail="Tryout not found")
    question = crud_question.get(db, id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    tryout = crud_tryout.remove_question(db, tryout=tryout, question=question)
    return tryout

@router.get("/{tryout_id}", response_model=TryoutResponse)
def get_tryout(
    *,
    db: Session = Depends(deps.get_db),
    tryout_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific tryout.
    """
    tryout = crud_tryout.get(db, id=tryout_id)
    if not tryout:
        raise HTTPException(status_code=404, detail="Tryout not found")
        
    tryout_data = TryoutResponse.model_validate(tryout)
    
    if current_user.role == 'student':
        import random
        rng = random.Random(f"{current_user.id}_{tryout.id}")
        rng.shuffle(tryout_data.questions)
        
    return tryout_data

@router.put("/{tryout_id}", response_model=TryoutResponse)
def update_tryout(
    *,
    db: Session = Depends(deps.get_db),
    tryout_id: int,
    tryout_in: TryoutUpdate,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a tryout (e.g., schedule start_time and end_time).
    """
    tryout = crud_tryout.get(db, id=tryout_id)
    if not tryout:
        raise HTTPException(status_code=404, detail="Tryout not found")
    
    tryout = crud_tryout.update(db, db_obj=tryout, obj_in=tryout_in)
    return tryout

@router.delete("/{tryout_id}", response_model=TryoutResponse)
def delete_tryout(
    *,
    db: Session = Depends(deps.get_db),
    tryout_id: int,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a tryout.
    """
    tryout = crud_tryout.get(db, id=tryout_id)
    if not tryout:
        raise HTTPException(status_code=404, detail="Tryout not found")
    tryout = crud_tryout.delete(db, id=tryout_id)
    return tryout


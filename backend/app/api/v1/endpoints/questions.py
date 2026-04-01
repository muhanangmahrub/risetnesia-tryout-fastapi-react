from typing import Any, List, Optional
import uuid
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_question
from app.schemas.question import QuestionResponse, QuestionCreate, QuestionUpdate
from app.models.user import User as UserModel
from app.models.tryout import Question as QuestionModel

router = APIRouter()

@router.get("/", response_model=List[QuestionResponse])
def read_questions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 500,
    category_id: Optional[int] = None,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve questions. Optionally filter by category_id.
    """
    query = db.query(QuestionModel)
    if category_id is not None:
        query = query.filter(QuestionModel.categories.any(id=category_id))
    return query.order_by(QuestionModel.id.asc()).offset(skip).limit(limit).all()

@router.post("/", response_model=QuestionResponse)
def create_question(
    *,
    db: Session = Depends(deps.get_db),
    question_in: QuestionCreate,
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Create new question. Only for tutors and admins.
    """
    question = crud_question.create(db, obj_in=question_in, user_id=current_user.id)
    return question

@router.post("/upload-image")
async def upload_question_image(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Upload an image for a question. Returns the URL of the uploaded image.
    """
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid image extension")
        
    filename = f"{uuid.uuid4().hex}{ext.lower()}"
    file_path = os.path.join("static", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/static/{filename}"}

@router.put("/{id}", response_model=QuestionResponse)
def update_question(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    question_in: QuestionUpdate,
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Update a question.
    """
    question = crud_question.get(db, id=id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    # Tutors might only be able to update their own questions, but skipping fine-grained check for now
    question = crud_question.update(db, db_obj=question, obj_in=question_in)
    return question

@router.delete("/{id}", response_model=QuestionResponse)
def delete_question(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: UserModel = Depends(deps.get_current_active_tutor),
) -> Any:
    """
    Delete a question.
    """
    question = crud_question.get(db, id=id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question = crud_question.delete(db, id=id)
    return question

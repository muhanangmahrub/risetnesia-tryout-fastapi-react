from typing import Any, List, Optional
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_question
from app.schemas.question import QuestionResponse, QuestionCreate, QuestionUpdate
from app.models.user import User as UserModel
from app.models.tryout import Question as QuestionModel
from app.core.config import settings

router = APIRouter()

# Configure Cloudinary once on module load
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

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
    Upload an image for a question to Cloudinary. Returns the secure URL.
    """
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    import os
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid image extension. Allowed: jpg, jpeg, png, gif, webp")

    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(status_code=500, detail="Cloud storage is not configured on this server.")

    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            folder="tryout-risetnesia/questions",
            resource_type="image",
        )
        return {"url": result["secure_url"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

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

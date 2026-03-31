from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from .category import CategoryResponse

class QuestionBase(BaseModel):
    question_type: str = 'MULTIPLE_CHOICE'
    question_text: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    subject: Optional[str] = None
    difficulty: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(QuestionBase):
    pass

class QuestionInDBBase(QuestionBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionResponse(QuestionInDBBase):
    category: Optional[CategoryResponse] = None

from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class AnswerBase(BaseModel):
    tryout_id: int
    question_id: int
    answer: Optional[str] = None

class AnswerCreate(AnswerBase):
    pass

class AnswerInDBBase(AnswerBase):
    id: int
    student_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AnswerResponse(AnswerInDBBase):
    pass

class SubmissionCreate(BaseModel):
    tryout_id: int
    answers: List[dict] # list of {"question_id": int, "answer": str}
    warnings_count: int = 0

# Minimal user info embedded in result responses
class StudentBasic(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class TryoutBasic(BaseModel):
    id: int
    title: str

    class Config:
        from_attributes = True

class ResultBase(BaseModel):
    tryout_id: int
    score: float
    correct_count: int
    wrong_count: int
    warnings_count: int = 0

class ResultInDBBase(ResultBase):
    id: int
    student_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ResultResponse(ResultInDBBase):
    student: Optional[StudentBasic] = None
    tryout: Optional[TryoutBasic] = None

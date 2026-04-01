from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.schemas.question import QuestionResponse

class TryoutBase(BaseModel):
    title: str
    duration_minutes: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    class_id: Optional[int] = None

class TryoutCreate(TryoutBase):
    pass

class TryoutUpdate(TryoutBase):
    title: Optional[str] = None
    duration_minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    class_id: Optional[int] = None

class TryoutInDBBase(TryoutBase):
    id: int

    class Config:
        from_attributes = True

class TryoutResponse(TryoutInDBBase):
    questions: List[QuestionResponse] = []
    class_id: Optional[int] = None

class BulkQuestionAssignment(BaseModel):
    question_ids: List[int]
    action: str  # 'add' or 'remove'

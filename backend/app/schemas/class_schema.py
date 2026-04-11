from typing import Optional
from pydantic import BaseModel

# Shared properties
class ClassBase(BaseModel):
    name: str

# Properties to receive on item creation
class ClassCreate(ClassBase):
    tutor_id: Optional[int] = None

# Properties to receive on item update
class ClassUpdate(ClassBase):
    name: Optional[str] = None
    tutor_id: Optional[int] = None

# Properties shared by models stored in DB
class ClassInDBBase(ClassBase):
    id: int
    tutor_id: Optional[int] = None
    enrollment_code: Optional[str] = None

    class Config:
        from_attributes = True

# Properties to return to client
class ClassResponse(ClassInDBBase):
    pass

class ClassJoinRequest(BaseModel):
    code: str

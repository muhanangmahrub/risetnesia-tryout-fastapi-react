from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    name: str
    school: Optional[str] = None
    role: str = "student"

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role: str

# Properties to receive via API on registration
class UserRegister(BaseModel):
    name: str
    school: str
    email: EmailStr
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    password_hash: str

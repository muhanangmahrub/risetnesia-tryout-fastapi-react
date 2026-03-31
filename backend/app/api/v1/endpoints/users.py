from typing import Any, List
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_user
from app.schemas.user import User, UserCreate, UserUpdate
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve users. Only for admin.
    """
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Create new user. Only for admin.
    """
    user = crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = crud_user.create(db, obj_in=user_in)
    return user

@router.post("/import")
async def import_users(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Import students from CSV or Excel file. Only for admin.
    Expected columns: email, name, password (optional)
    """
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file.")
    
    try:
        content = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
            
        required_cols = {'email', 'name'}
        if not required_cols.issubset(set(df.columns)):
            raise HTTPException(status_code=400, detail=f"Missing required columns. Expected at least: email, name. Found: {list(df.columns)}")
            
        created = 0
        skipped = 0
        
        for _, row in df.iterrows():
            email = str(row['email']).strip()
            name = str(row['name']).strip()
            
            if pd.isna(row['email']) or email == 'nan' or email == '':
                continue
                
            password = str(row['password']).strip() if 'password' in df.columns and pd.notna(row['password']) else "Student123!"
            
            existing = crud_user.get_by_email(db, email=email)
            if existing:
                skipped += 1
                continue
                
            user_in = UserCreate(
                email=email,
                name=name,
                password=password,
                role="student"
            )
            crud_user.create(db, obj_in=user_in)
            created += 1
            
        return {"message": "Import processing finished successfully.", "created": created, "skipped": skipped}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.put("/{id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    user_in: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a user. Only for admin.
    """
    user = crud_user.get(db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = crud_user.update(db, db_obj=user, obj_in=user_in)
    return user

@router.delete("/{id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a user. Only for admin.
    """
    user = crud_user.get(db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = crud_user.delete(db, id=id)
    return user

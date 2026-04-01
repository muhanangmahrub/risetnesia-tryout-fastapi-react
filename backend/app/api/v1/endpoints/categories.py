from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.models.user import User as UserModel

router = APIRouter()


@router.get("", response_model=List[CategoryResponse])
def read_categories(
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """Get all question categories."""
    return crud_category.get_multi(db)


@router.post("", response_model=CategoryResponse)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: CategoryCreate,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """Create a new question category."""
    return crud_category.create(db, obj_in=category_in)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: int,
    category_in: CategoryUpdate,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """Update a category."""
    cat = crud_category.get(db, category_id=category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return crud_category.update(db, db_obj=cat, obj_in=category_in)


@router.delete("/{category_id}")
def delete_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: int,
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """Delete a category. Questions in this category become uncategorized."""
    cat = crud_category.get(db, category_id=category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    crud_category.delete(db, category_id=category_id)
    return {"detail": "Category deleted"}

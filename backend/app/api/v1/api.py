from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, classes, questions, tryouts, results, categories


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])
api_router.include_router(tryouts.router, prefix="/tryouts", tags=["tryouts"])
api_router.include_router(results.router, prefix="/results", tags=["results"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])

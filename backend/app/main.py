from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.database.session import engine
from app.database import base

# Create tables
base.Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def create_initial_admin():
    from app.database.session import SessionLocal
    from app.crud import crud_user
    from app.schemas.user import UserCreate
    
    db = SessionLocal()
    email = "muhanangmahrub@gmail.com"
    user = crud_user.get_by_email(db, email=email)
    if not user:
        user_in = UserCreate(
            email=email,
            password="AdminPassword123!",
            name="Muhamad Anang Mahrub",
            role="admin"
        )
        crud_user.create(db, obj_in=user_in)
        print(f"✅ Admin user {email} created during startup.")
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Online Tryout System API"}

# Create static dir if not exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

from app.api.v1.api import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import engine
from app.database import base
from app.api.v1.api import api_router
from app.database.session import SessionLocal
from app.crud import crud_user
from app.schemas.user import UserCreate

# Create tables
base.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    redirect_slashes=False
)

@app.on_event("startup")
def create_initial_admin():
    db = SessionLocal()
    user = crud_user.get_by_email(db, email=settings.ADMIN_EMAIL)
    if not user:
        user_in = UserCreate(
            email=settings.ADMIN_EMAIL,
            password=settings.ADMIN_PASSWORD,
            name=settings.ADMIN_NAME,
            role="admin"
        )
        crud_user.create(db, obj_in=user_in)
        print(f"✅ Admin user {settings.ADMIN_EMAIL} created during startup.")
    db.close()

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
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
app.include_router(api_router, prefix=settings.API_V1_STR)

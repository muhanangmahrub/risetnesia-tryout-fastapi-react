from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models import user, tryout, result
from app.crud import crud_user
from app.schemas.user import UserCreate

def create_admin():
    Base.metadata.create_all(bind=engine)
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
        user = crud_user.create(db, obj_in=user_in)
        print(f"✅ Admin user created successfully:\nEmail: {email}\nPassword: AdminPassword123!")
    else:
        print(f"✅ User with email {email} already exists. You can log in with your existing password.")
    db.close()

if __name__ == "__main__":
    create_admin()

from sqlalchemy import text
from app.database.session import SessionLocal

db = SessionLocal()
try:
    db.execute(text("ALTER TABLE users ADD COLUMN school VARCHAR(200);"))
    db.commit()
    print("SUCCESS: `school` column added to users table")
except Exception as e:
    print(f"NOTE: {e}")
finally:
    db.close()

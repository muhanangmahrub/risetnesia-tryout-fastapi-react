from sqlalchemy import text
from app.database.session import SessionLocal

db = SessionLocal()
try:
    db.execute(text("ALTER TABLE classes ADD COLUMN enrollment_code VARCHAR(50) UNIQUE;"))
    db.commit()
    print("SUCCESS: `enrollment_code` column added to classes table")
except Exception as e:
    print(f"NOTE: {e}")
finally:
    db.close()

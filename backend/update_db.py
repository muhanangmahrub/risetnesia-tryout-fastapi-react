from sqlalchemy import text
from app.database.session import SessionLocal

db = SessionLocal()
try:
    db.execute(text("ALTER TABLE tryouts ADD class_id INT NULL;"))
    db.commit()
    print("SUCCESS: class_id column added to tryouts table")
except Exception as e:
    print(f"NOTE: {e}")
finally:
    db.close()

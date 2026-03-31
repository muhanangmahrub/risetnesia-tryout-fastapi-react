from sqlalchemy import text
from app.database.session import SessionLocal

db = SessionLocal()

try:
    db.execute(text("""
        IF NOT EXISTS (
            SELECT * FROM information_schema.columns
            WHERE table_name='results' AND column_name='warnings_count'
        )
        ALTER TABLE results ADD warnings_count INT NOT NULL DEFAULT 0
    """))
    db.commit()
    print("OK: warnings_count column added to results")
except Exception as e:
    print(f"ERROR: {e}")
    db.rollback()
finally:
    db.close()

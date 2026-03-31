"""
Migration: Add question_categories table and category_id to questions.
Run inside the backend container: docker exec fastapi_backend python /app/migrate_categories.py
"""
from sqlalchemy import text
from app.database.session import SessionLocal

db = SessionLocal()

try:
    # Create question_categories table if not exists
    db.execute(text("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='question_categories' AND xtype='U')
        CREATE TABLE question_categories (
            id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            description NVARCHAR(500) NULL
        )
    """))
    db.commit()
    print("OK: question_categories table ready")

    # Add category_id to questions if not exists
    db.execute(text("""
        IF NOT EXISTS (
            SELECT * FROM information_schema.columns
            WHERE table_name='questions' AND column_name='category_id'
        )
        ALTER TABLE questions ADD category_id INT NULL REFERENCES question_categories(id)
    """))
    db.commit()
    print("OK: category_id column added to questions")

except Exception as e:
    print(f"ERROR: {e}")
    db.rollback()
finally:
    db.close()

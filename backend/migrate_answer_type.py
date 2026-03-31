from app.database.session import SessionLocal
from sqlalchemy import text

def alter_answer_column():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE student_answers ALTER COLUMN answer VARCHAR(MAX) NULL;"))
        print("Successfully altered student_answers.answer to VARCHAR(MAX).")
        db.commit()
    except Exception as e:
        print(f"Error executing migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    alter_answer_column()

from app.database.session import SessionLocal
from app.database.base_class import Base
from sqlalchemy import text

def add_question_type_and_make_options_nullable():
    db = SessionLocal()
    try:
        # Add question_type column
        db.execute(text("ALTER TABLE questions ADD question_type VARCHAR(50) DEFAULT 'MULTIPLE_CHOICE' NOT NULL;"))
        print("Successfully added question_type column.")
        
        # Alter correct_answer to be VARCHAR(MAX) to handle long essays
        # First check if there's any constraint to drop (usually not for string(1) unless unique)
        db.execute(text("ALTER TABLE questions ALTER COLUMN correct_answer VARCHAR(MAX) NULL;"))
        print("Successfully altered correct_answer.")

        # Make options nullable
        db.execute(text("ALTER TABLE questions ALTER COLUMN option_a VARCHAR(255) NULL;"))
        db.execute(text("ALTER TABLE questions ALTER COLUMN option_b VARCHAR(255) NULL;"))
        db.execute(text("ALTER TABLE questions ALTER COLUMN option_c VARCHAR(255) NULL;"))
        db.execute(text("ALTER TABLE questions ALTER COLUMN option_d VARCHAR(255) NULL;"))
        print("Successfully made options nullable.")
        
        db.commit()
    except Exception as e:
        print(f"Error executing migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_question_type_and_make_options_nullable()

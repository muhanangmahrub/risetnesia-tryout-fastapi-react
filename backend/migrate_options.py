import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.session import SessionLocal

def migrate_options():
    db = SessionLocal()
    queries = [
        "ALTER TABLE questions ALTER COLUMN option_a VARCHAR(MAX) NULL;",
        "ALTER TABLE questions ALTER COLUMN option_b VARCHAR(MAX) NULL;",
        "ALTER TABLE questions ALTER COLUMN option_c VARCHAR(MAX) NULL;",
        "ALTER TABLE questions ALTER COLUMN option_d VARCHAR(MAX) NULL;",
        "ALTER TABLE questions ADD option_a_image VARCHAR(500) NULL;",
        "ALTER TABLE questions ADD option_b_image VARCHAR(500) NULL;",
        "ALTER TABLE questions ADD option_c_image VARCHAR(500) NULL;",
        "ALTER TABLE questions ADD option_d_image VARCHAR(500) NULL;",
        "ALTER TABLE questions ADD option_e VARCHAR(MAX) NULL;",
        "ALTER TABLE questions ADD option_e_image VARCHAR(500) NULL;",
    ]

    for q in queries:
        try:
            db.execute(text(q))
            db.commit()
            print(f"SUCCESS: {q}")
        except Exception as e:
            # If the column already exists or other non-fatal error, print and continue
            db.rollback()
            print(f"NOTE (might already exist or be updated): {e}")

    db.close()

if __name__ == "__main__":
    print("Starting migration to expand option sizes and add option E...")
    migrate_options()
    print("Migration complete.")

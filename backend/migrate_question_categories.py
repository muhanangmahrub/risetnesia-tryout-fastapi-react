import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_all, Table, Column, Integer, ForeignKey, MetaData, select, insert
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import engine
from app.models.tryout import Question, question_category_association

def migrate():
    print("Starting migration: Question category_id to many-to-many association...")
    metadata = MetaData()
    # Reflected table to access the old category_id column if it still exists
    questions_table = Table("questions", metadata, autoload_with=engine)
    
    with Session(engine) as session:
        # 1. Ensure the new association table exists
        # In a real environment, this should be handled by Alembic
        # Base.metadata.create_all(bind=engine)
        
        # 2. Fetch all questions that have a category_id
        if "category_id" not in questions_table.columns:
            print("Error: category_id column not found. Migration may have already run or schema is inconsistent.")
            return

        stmt = select(questions_table.c.id, questions_table.c.category_id).where(questions_table.c.category_id != None)
        results = session.execute(stmt).all()
        
        print(f"Found {len(results)} questions with existing category_id.")
        
        count = 0
        for q_id, cat_id in results:
            # Check if association already exists to avoid duplicates
            check_stmt = select(question_category_association).where(
                question_category_association.c.question_id == q_id,
                question_category_association.c.category_id == cat_id
            )
            exists = session.execute(check_stmt).first()
            
            if not exists:
                session.execute(
                    insert(question_category_association).values(question_id=q_id, category_id=cat_id)
                )
                count += 1
        
        session.commit()
        print(f"Successfully migrated {count} records to question_category_association.")
        print("Note: The 'category_id' column still exists in the 'questions' table. You should remove it manually after verifying data.")

if __name__ == "__main__":
    migrate()

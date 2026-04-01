from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base_class import Base


class QuestionCategory(Base):
    __tablename__ = "question_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)

    # Relationships
    questions = relationship("Question", secondary="question_category_association", back_populates="categories")

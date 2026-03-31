from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base_class import Base
from app.models.category import QuestionCategory  # noqa: F401 - registers model

# Association table for tryouts to questions
tryout_questions = Table(
    "tryout_questions",
    Base.metadata,
    Column("tryout_id", Integer, ForeignKey("tryouts.id")),
    Column("question_id", Integer, ForeignKey("questions.id")),
)

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_type = Column(String(50), default='MULTIPLE_CHOICE', nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=True)
    option_b = Column(String(255), nullable=True)
    option_c = Column(String(255), nullable=True)
    option_d = Column(String(255), nullable=True)
    correct_answer = Column(Text, nullable=True)  # For essay match or A/B/C/D
    explanation = Column(Text, nullable=True)
    subject = Column(String(100), nullable=True)
    difficulty = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("question_categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_questions")
    category = relationship("QuestionCategory", back_populates="questions")
    tryouts = relationship("Tryout", secondary=tryout_questions, back_populates="questions")
    answers = relationship("StudentAnswer", back_populates="question")

class Tryout(Base):
    __tablename__ = "tryouts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)

    # Relationships
    questions = relationship("Question", secondary=tryout_questions, back_populates="tryouts")
    answers = relationship("StudentAnswer", back_populates="tryout")
    results = relationship("Result", back_populates="tryout")
    assigned_class = relationship("Class", back_populates="tryouts")

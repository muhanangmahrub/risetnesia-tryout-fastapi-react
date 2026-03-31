from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base_class import Base

class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True) # Adding ID for primary key convention
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tryout_id = Column(Integer, ForeignKey("tryouts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="answers")
    tryout = relationship("Tryout", back_populates="answers")
    question = relationship("Question", back_populates="answers")

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True) # Adding ID for primary key convention
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tryout_id = Column(Integer, ForeignKey("tryouts.id"), nullable=False)
    score = Column(Float, nullable=False)
    correct_count = Column(Integer, nullable=False)
    wrong_count = Column(Integer, nullable=False)
    warnings_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="results")
    tryout = relationship("Tryout", back_populates="results")

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base_class import Base

# Association table for student to class
students_classes = Table(
    "students_classes",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("users.id")),
    Column("class_id", Integer, ForeignKey("classes.id")),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # e.g., 'admin', 'tutor', 'student'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    classes = relationship("Class", back_populates="tutor")
    enrolled_classes = relationship("Class", secondary=students_classes, back_populates="students")
    created_questions = relationship("Question", back_populates="creator")
    answers = relationship("StudentAnswer", back_populates="student")
    results = relationship("Result", back_populates="student")

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    tutor = relationship("User", back_populates="classes")
    students = relationship("User", secondary=students_classes, back_populates="enrolled_classes")
    tryouts = relationship("Tryout", back_populates="assigned_class")

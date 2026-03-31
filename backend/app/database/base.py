# Import all the models, so that Base has them before being
# imported by Alembic or Base.metadata.create_all()

from app.database.base_class import Base
from app.models.user import User, Class, students_classes
from app.models.tryout import Question, Tryout, tryout_questions
from app.models.result import StudentAnswer, Result

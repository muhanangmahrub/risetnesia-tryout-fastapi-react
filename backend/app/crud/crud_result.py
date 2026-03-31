from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.result import StudentAnswer, Result
from app.models.tryout import Tryout, Question
from app.schemas.result import AnswerCreate, ResultBase
from app.models.user import User as UserModel

def create_answer(db: Session, *, obj_in: AnswerCreate, student_id: int) -> StudentAnswer:
    db_obj = StudentAnswer(**obj_in.model_dump(), student_id=student_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_student_answers(db: Session, *, tryout_id: int, student_id: int) -> List[StudentAnswer]:
    return db.query(StudentAnswer).filter(
        StudentAnswer.tryout_id == tryout_id,
        StudentAnswer.student_id == student_id
    ).all()

def calculate_and_save_result(db: Session, *, tryout_id: int, student_id: int, warnings_count: int = 0) -> Result:
    answers = get_student_answers(db, tryout_id=tryout_id, student_id=student_id)
    correct_count = 0
    wrong_count = 0
    
    for answer in answers:
        question = db.query(Question).get(answer.question_id)
        if question:
            q_type = getattr(question, 'question_type', 'MULTIPLE_CHOICE') or 'MULTIPLE_CHOICE'
            
            if q_type == 'ESSAY':
                # Case-insensitive, whitespace-trimmed match
                is_correct = str(question.correct_answer or "").strip().lower() == str(answer.answer or "").strip().lower()
            elif q_type == 'MULTIPLE_ANSWERS':
                # Both stored as comma-separated sorted sets: "A,C" == "C,A"
                correct_set = set(x.strip().upper() for x in str(question.correct_answer or "").split(',') if x.strip())
                student_set = set(x.strip().upper() for x in str(answer.answer or "").split(',') if x.strip())
                is_correct = correct_set == student_set
            elif q_type == 'TRUE_FALSE':
                # Both stored as comma-separated T/F per statement: "T,F,T"
                correct_tf = [x.strip().upper() for x in str(question.correct_answer or "").split(',') if x.strip()]
                student_tf = [x.strip().upper() for x in str(answer.answer or "").split(',') if x.strip()]
                is_correct = correct_tf == student_tf
            else:
                # MULTIPLE_CHOICE: direct match
                is_correct = question.correct_answer == answer.answer
                
            if is_correct:
                correct_count += 1
            else:
                wrong_count += 1
            
    total_questions = correct_count + wrong_count
    score = (correct_count / total_questions * 100) if total_questions > 0 else 0
    
    # Check if result already exists
    existing_result = db.query(Result).filter(
        Result.tryout_id == tryout_id,
        Result.student_id == student_id
    ).first()
    
    if existing_result:
        existing_result.score = score
        existing_result.correct_count = correct_count
        existing_result.wrong_count = wrong_count
        existing_result.warnings_count = warnings_count
        db.add(existing_result)
        db_obj = existing_result
    else:
        db_obj = Result(
            student_id=student_id,
            tryout_id=tryout_id,
            score=score,
            correct_count=correct_count,
            wrong_count=wrong_count,
            warnings_count=warnings_count
        )
        db.add(db_obj)
        
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_results_by_tryout(db: Session, tryout_id: int) -> List[Result]:
    return (
        db.query(Result)
        .options(joinedload(Result.student))
        .filter(Result.tryout_id == tryout_id)
        .order_by(Result.score.desc())
        .all()
    )

def get_student_results(db: Session, student_id: int) -> List[Result]:
    return (
        db.query(Result)
        .options(joinedload(Result.student))
        .filter(Result.student_id == student_id)
        .all()
    )

def has_submitted(db: Session, *, tryout_id: int, student_id: int) -> bool:
    """Check if a student already has a result record for this tryout."""
    return db.query(Result).filter(
        Result.tryout_id == tryout_id,
        Result.student_id == student_id
    ).first() is not None


def get_exam_review(db: Session, *, tryout_id: int, student_id: int) -> list:
    """
    Return a per-question review for a student's submission on a tryout.
    Each entry contains: question data + student's answer + is_correct flag.
    """
    # Load all student answers indexed by question_id
    student_answers = get_student_answers(db, tryout_id=tryout_id, student_id=student_id)
    answer_map = {a.question_id: a.answer for a in student_answers}

    # Load all questions for this tryout (in order)
    tryout = db.query(Tryout).get(tryout_id)
    if not tryout:
        return []

    review = []
    for question in tryout.questions:
        q_type = getattr(question, 'question_type', 'MULTIPLE_CHOICE') or 'MULTIPLE_CHOICE'
        student_answer = answer_map.get(question.id, None)
        correct = question.correct_answer

        if q_type == 'ESSAY':
            is_correct = str(correct or '').strip().lower() == str(student_answer or '').strip().lower()
        elif q_type == 'MULTIPLE_ANSWERS':
            c_set = set(x.strip().upper() for x in str(correct or '').split(',') if x.strip())
            s_set = set(x.strip().upper() for x in str(student_answer or '').split(',') if x.strip())
            is_correct = c_set == s_set
        elif q_type == 'TRUE_FALSE':
            c_tf = [x.strip().upper() for x in str(correct or '').split(',') if x.strip()]
            s_tf = [x.strip().upper() for x in str(student_answer or '').split(',') if x.strip()]
            is_correct = c_tf == s_tf
        else:
            is_correct = correct == student_answer

        review.append({
            'question_id': question.id,
            'question_text': question.question_text,
            'question_type': q_type,
            'image_url': question.image_url,
            'option_a': question.option_a,
            'option_b': question.option_b,
            'option_c': question.option_c,
            'option_d': question.option_d,
            'correct_answer': correct,
            'student_answer': student_answer,
            'is_correct': is_correct,
            'explanation': question.explanation,
            'subject': question.subject,
        })
    return review

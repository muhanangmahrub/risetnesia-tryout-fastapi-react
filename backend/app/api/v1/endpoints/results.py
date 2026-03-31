import pandas as pd
import io
from typing import Any, List
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_result, crud_tryout
from app.schemas.result import AnswerCreate, AnswerResponse, SubmissionCreate, ResultResponse
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/submit", response_model=ResultResponse)
def submit_tryout(
    *,
    db: Session = Depends(deps.get_db),
    submission_in: SubmissionCreate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit a tryout. Saves answers and calculates score.
    Rejects if the student has already submitted this tryout.
    """
    tryout = crud_tryout.get(db, id=submission_in.tryout_id)
    if not tryout:
        raise HTTPException(status_code=404, detail="Tryout not found")

    # Block re-submission
    if crud_result.has_submitted(db, tryout_id=submission_in.tryout_id, student_id=current_user.id):
        raise HTTPException(status_code=400, detail="Ujian sudah dikerjakan dan tidak bisa disubmit ulang.")

    for ans in submission_in.answers:
        answer_data = AnswerCreate(
            tryout_id=submission_in.tryout_id,
            question_id=ans["question_id"],
            answer=ans["answer"]
        )
        crud_result.create_answer(db, obj_in=answer_data, student_id=current_user.id)
        
    result = crud_result.calculate_and_save_result(
        db, tryout_id=submission_in.tryout_id, student_id=current_user.id, warnings_count=submission_in.warnings_count
    )
    return result


@router.get("/my-results", response_model=List[ResultResponse])
def get_my_results(
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's results.
    """
    results = crud_result.get_student_results(db, student_id=current_user.id)
    return results

@router.get("/tryout/{tryout_id}/leaderboard", response_model=List[ResultResponse])
def get_tryout_leaderboard(
    tryout_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get leaderboard for a specific tryout.
    """
    results = crud_result.get_results_by_tryout(db, tryout_id=tryout_id)
    return results

@router.get("/export/{tryout_id}")
def export_results_excel(
    tryout_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Export results for a specific tryout to Excel.
    """
    results = crud_result.get_results_by_tryout(db, tryout_id=tryout_id)
    
    if not results:
        raise HTTPException(status_code=404, detail="No results found for this tryout")
        
    data = []
    for r in results:
        data.append({
            "Student Name": r.student.name if getattr(r, 'student', None) else "Unknown",
            "Student Email": r.student.email if getattr(r, 'student', None) else "Unknown",
            "Score": r.score,
            "Correct Answers": r.correct_count,
            "Wrong Answers": r.wrong_count,
            "Submitted At": r.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if r.submitted_at else ""
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Results')
    
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="tryout_{tryout_id}_results.xlsx"'
    }
    
    return StreamingResponse(
        output, 
        headers=headers,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

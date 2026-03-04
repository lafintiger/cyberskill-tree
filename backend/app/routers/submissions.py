from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.config import get_db
from app.models import models, schemas
from app.utils.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/submissions", tags=["submissions"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "text/plain", "text/csv",
    "application/pdf",
}

@router.post("/upload", response_model=schemas.SubmissionResponse)
async def upload_submission(
    skill_id: int = Form(...),
    note: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    if skill.completion_type == "token":
        raise HTTPException(status_code=400, detail="This skill only accepts token completion")

    already_completed = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == current_user.id,
        models.UserSkill.skill_id == skill_id
    ).first()
    if already_completed:
        raise HTTPException(status_code=400, detail="Skill already completed")

    existing_pending = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id,
        models.Submission.skill_id == skill_id,
        models.Submission.status == "pending"
    ).first()
    if existing_pending:
        raise HTTPException(status_code=400, detail="You already have a pending submission for this skill")

    dependencies = db.query(models.Dependency).filter(
        models.Dependency.skill_id == skill_id
    ).all()
    for dep in dependencies:
        user_has_dep = db.query(models.UserSkill).filter(
            models.UserSkill.user_id == current_user.id,
            models.UserSkill.skill_id == dep.depends_on_skill_id
        ).first()
        if not user_has_dep:
            dep_skill = db.query(models.Skill).filter(
                models.Skill.id == dep.depends_on_skill_id
            ).first()
            raise HTTPException(
                status_code=400,
                detail=f"Missing prerequisite: {dep_skill.name if dep_skill else 'Unknown'}"
            )

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Accepted: images, text, PDF"
        )

    file_data = await file.read()
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")

    submission = models.Submission(
        user_id=current_user.id,
        skill_id=skill_id,
        file_data=file_data,
        file_name=file.filename,
        file_type=file.content_type,
        note=note,
        status="pending"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return schemas.SubmissionResponse(
        id=submission.id,
        user_id=submission.user_id,
        skill_id=submission.skill_id,
        file_name=submission.file_name,
        file_type=submission.file_type,
        note=submission.note,
        status=submission.status,
        feedback=submission.feedback,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at,
        reviewed_by=submission.reviewed_by,
        user_name=current_user.name,
        skill_name=skill.name
    )

@router.get("/my", response_model=List[schemas.SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    submissions = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id
    ).order_by(models.Submission.submitted_at.desc()).all()

    result = []
    for s in submissions:
        skill = db.query(models.Skill).filter(models.Skill.id == s.skill_id).first()
        result.append(schemas.SubmissionResponse(
            id=s.id, user_id=s.user_id, skill_id=s.skill_id,
            file_name=s.file_name, file_type=s.file_type, note=s.note,
            status=s.status, feedback=s.feedback, submitted_at=s.submitted_at,
            reviewed_at=s.reviewed_at, reviewed_by=s.reviewed_by,
            user_name=current_user.name,
            skill_name=skill.name if skill else None
        ))
    return result

@router.get("/pending", response_model=List[schemas.SubmissionResponse])
def get_pending_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    submissions = db.query(models.Submission).filter(
        models.Submission.status == "pending"
    ).order_by(models.Submission.submitted_at.asc()).all()

    result = []
    for s in submissions:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        skill = db.query(models.Skill).filter(models.Skill.id == s.skill_id).first()
        result.append(schemas.SubmissionResponse(
            id=s.id, user_id=s.user_id, skill_id=s.skill_id,
            file_name=s.file_name, file_type=s.file_type, note=s.note,
            status=s.status, feedback=s.feedback, submitted_at=s.submitted_at,
            reviewed_at=s.reviewed_at, reviewed_by=s.reviewed_by,
            user_name=user.name if user else None,
            skill_name=skill.name if skill else None
        ))
    return result

@router.post("/{submission_id}/review", response_model=schemas.SubmissionResponse)
def review_submission(
    submission_id: int,
    review: schemas.SubmissionReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.status != "pending":
        raise HTTPException(status_code=400, detail="Submission already reviewed")

    if review.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")

    submission.status = review.status
    submission.feedback = review.feedback
    submission.reviewed_at = datetime.utcnow()
    submission.reviewed_by = current_user.id

    if review.status == "approved":
        skill = db.query(models.Skill).filter(
            models.Skill.id == submission.skill_id
        ).first()

        already_completed = db.query(models.UserSkill).filter(
            models.UserSkill.user_id == submission.user_id,
            models.UserSkill.skill_id == submission.skill_id
        ).first()

        if not already_completed and skill:
            user_skill = models.UserSkill(
                user_id=submission.user_id,
                skill_id=submission.skill_id,
                xp_awarded=skill.xp
            )
            db.add(user_skill)

    db.commit()
    db.refresh(submission)

    user = db.query(models.User).filter(models.User.id == submission.user_id).first()
    skill = db.query(models.Skill).filter(models.Skill.id == submission.skill_id).first()

    return schemas.SubmissionResponse(
        id=submission.id, user_id=submission.user_id, skill_id=submission.skill_id,
        file_name=submission.file_name, file_type=submission.file_type,
        note=submission.note, status=submission.status, feedback=submission.feedback,
        submitted_at=submission.submitted_at, reviewed_at=submission.reviewed_at,
        reviewed_by=submission.reviewed_by,
        user_name=user.name if user else None,
        skill_name=skill.name if skill else None
    )

@router.get("/{submission_id}/file")
def get_submission_file(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role != "admin" and current_user.id != submission.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this file")

    return Response(
        content=submission.file_data,
        media_type=submission.file_type,
        headers={"Content-Disposition": f'inline; filename="{submission.file_name}"'}
    )

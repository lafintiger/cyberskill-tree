from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database.config import get_db
from app.models import models, schemas
from app.utils.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/progress", response_model=schemas.UserProgressResponse)
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == current_user.id
    ).all()
    
    total_xp = db.query(func.sum(models.UserSkill.xp_awarded)).filter(
        models.UserSkill.user_id == current_user.id
    ).scalar() or 0
    
    return schemas.UserProgressResponse(
        user=current_user,
        total_xp=total_xp,
        completed_skills=user_skills
    )

@router.get("/", response_model=List[schemas.User])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    users = db.query(models.User).all()
    return users

@router.get("/{user_id}/progress", response_model=schemas.UserProgressResponse)
def get_user_progress_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == user_id
    ).all()
    
    total_xp = db.query(func.sum(models.UserSkill.xp_awarded)).filter(
        models.UserSkill.user_id == user_id
    ).scalar() or 0
    
    return schemas.UserProgressResponse(
        user=user,
        total_xp=total_xp,
        completed_skills=user_skills
    )

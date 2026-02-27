from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.database.config import get_db
from app.models import models, schemas
from app.utils.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/tokens", tags=["tokens"])

@router.post("/submit")
def submit_token(
    token_data: schemas.TokenSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    token = db.query(models.Token).filter(
        models.Token.token_string == token_data.token_string
    ).first()
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid token"
        )
    
    if token.redeemed_by:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token already redeemed"
        )
    
    skill = db.query(models.Skill).filter(models.Skill.id == token.skill_id).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    dependencies = db.query(models.Dependency).filter(
        models.Dependency.skill_id == skill.id
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
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing prerequisite: {dep_skill.name if dep_skill else 'Unknown'}"
            )
    
    already_completed = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == current_user.id,
        models.UserSkill.skill_id == skill.id
    ).first()
    
    if already_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skill already completed"
        )
    
    token.redeemed_by = current_user.id
    token.redeemed_at = datetime.utcnow()
    
    user_skill = models.UserSkill(
        user_id=current_user.id,
        skill_id=skill.id,
        xp_awarded=skill.xp
    )
    db.add(user_skill)
    db.commit()
    
    return {
        "message": "Token redeemed successfully",
        "skill": skill.name,
        "xp_awarded": skill.xp
    }

@router.post("/", response_model=schemas.TokenResponse)
def create_token(
    token: schemas.TokenCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    existing_token = db.query(models.Token).filter(
        models.Token.token_string == token.token_string
    ).first()
    if existing_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token already exists"
        )
    
    db_token = models.Token(**token.dict())
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

@router.get("/", response_model=List[schemas.TokenResponse])
def get_tokens(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    tokens = db.query(models.Token).all()
    return tokens

@router.get("/skill/{skill_id}", response_model=List[schemas.TokenResponse])
def get_tokens_by_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    tokens = db.query(models.Token).filter(models.Token.skill_id == skill_id).all()
    return tokens

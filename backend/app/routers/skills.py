from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.config import get_db
from app.models import models, schemas
from app.utils.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/skills", tags=["skills"])

@router.get("/tree/{tree_id}", response_model=List[schemas.SkillWithProgress])
def get_skills_by_tree(
    tree_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    skills = db.query(models.Skill).filter(
        models.Skill.tree_id == tree_id,
        models.Skill.active == True
    ).all()
    
    user_skill_ids = {
        us.skill_id for us in db.query(models.UserSkill).filter(
            models.UserSkill.user_id == current_user.id
        ).all()
    }
    
    user_submissions = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id
    ).all()
    latest_submission = {}
    for s in user_submissions:
        prev = latest_submission.get(s.skill_id)
        if prev is None or s.submitted_at > prev.submitted_at:
            latest_submission[s.skill_id] = s
    
    result = []
    for skill in skills:
        dependencies = [d.depends_on_skill_id for d in skill.dependencies]
        sub = latest_submission.get(skill.id)
        sub_status = sub.status if sub else None
        sub_feedback = sub.feedback if sub and sub.status == "rejected" else None
        result.append(schemas.SkillWithProgress(
            id=skill.id,
            tree_id=skill.tree_id,
            name=skill.name,
            description=skill.description,
            level=skill.level,
            xp=skill.xp,
            position_x=skill.position_x,
            position_y=skill.position_y,
            active=skill.active,
            completion_type=skill.completion_type or "token",
            completed=skill.id in user_skill_ids,
            dependencies=dependencies,
            submission_status=sub_status,
            submission_feedback=sub_feedback
        ))
    
    return result

@router.post("/", response_model=schemas.SkillResponse)
def create_skill(
    skill: schemas.SkillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_skill = models.Skill(**skill.dict())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.put("/{skill_id}", response_model=schemas.SkillResponse)
def update_skill(
    skill_id: int,
    skill: schemas.SkillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    for key, value in skill.dict().items():
        setattr(db_skill, key, value)
    
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.delete("/{skill_id}")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    skill.active = False
    db.commit()
    return {"message": "Skill deactivated successfully"}

@router.post("/dependencies", response_model=schemas.DependencyResponse)
def create_dependency(
    dependency: schemas.DependencyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_dependency = models.Dependency(**dependency.dict())
    db.add(db_dependency)
    db.commit()
    db.refresh(db_dependency)
    return db_dependency

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.config import get_db
from app.models import models, schemas
from app.utils.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/trees", tags=["trees"])

@router.get("/", response_model=List[schemas.TreeResponse])
def get_trees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    trees = db.query(models.Tree).all()
    return trees

@router.get("/{tree_id}", response_model=schemas.TreeResponse)
def get_tree(
    tree_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tree = db.query(models.Tree).filter(models.Tree.id == tree_id).first()
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree not found"
        )
    return tree

@router.post("/", response_model=schemas.TreeResponse)
def create_tree(
    tree: schemas.TreeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_tree = models.Tree(**tree.dict())
    db.add(db_tree)
    db.commit()
    db.refresh(db_tree)
    return db_tree

@router.delete("/{tree_id}")
def delete_tree(
    tree_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    tree = db.query(models.Tree).filter(models.Tree.id == tree_id).first()
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree not found"
        )
    db.delete(tree)
    db.commit()
    return {"message": "Tree deleted successfully"}

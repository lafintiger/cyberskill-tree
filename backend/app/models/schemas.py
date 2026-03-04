from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str = "student"

class UserCreate(UserBase):
    password: str
    class_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    class_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ClassBase(BaseModel):
    name: str
    term: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    
    class Config:
        from_attributes = True

class TreeBase(BaseModel):
    name: str
    description: Optional[str] = None

class TreeCreate(TreeBase):
    pass

class TreeResponse(TreeBase):
    id: int
    
    class Config:
        from_attributes = True

class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None
    level: int
    xp: int
    position_x: float
    position_y: float
    active: bool = True
    completion_type: str = "token"

class SkillCreate(SkillBase):
    tree_id: int

class SkillResponse(SkillBase):
    id: int
    tree_id: int
    
    class Config:
        from_attributes = True

class DependencyCreate(BaseModel):
    skill_id: int
    depends_on_skill_id: int

class DependencyResponse(BaseModel):
    id: int
    skill_id: int
    depends_on_skill_id: int
    
    class Config:
        from_attributes = True

class TokenCreate(BaseModel):
    skill_id: int
    token_string: str

class TokenSubmit(BaseModel):
    token_string: str

class TokenResponse(BaseModel):
    id: int
    skill_id: int
    token_string: str
    redeemed_by: Optional[int]
    redeemed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class UserSkillResponse(BaseModel):
    id: int
    skill_id: int
    xp_awarded: int
    completed_at: datetime
    
    class Config:
        from_attributes = True

class UserProgressResponse(BaseModel):
    user: User
    total_xp: int
    completed_skills: List[UserSkillResponse]
    
    class Config:
        from_attributes = True

class SkillWithProgress(SkillResponse):
    completed: bool = False
    dependencies: List[int] = []
    submission_status: Optional[str] = None
    submission_feedback: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: int
    user_id: int
    skill_id: int
    file_name: str
    file_type: str
    note: Optional[str]
    status: str
    feedback: Optional[str]
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[int]
    user_name: Optional[str] = None
    skill_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class SubmissionReview(BaseModel):
    status: str
    feedback: Optional[str] = None

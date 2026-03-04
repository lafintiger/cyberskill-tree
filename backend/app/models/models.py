from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, TIMESTAMP, CheckConstraint, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.config import Base

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    term = Column(String(50))
    
    users = relationship("User", back_populates="class_rel")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), default="student")
    class_id = Column(Integer, ForeignKey("classes.id"))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    class_rel = relationship("Class", back_populates="users")
    user_skills = relationship("UserSkill", back_populates="user")
    redeemed_tokens = relationship("Token", back_populates="redeemed_user")

class Tree(Base):
    __tablename__ = "trees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    skills = relationship("Skill", back_populates="tree")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id"))
    name = Column(String(150))
    description = Column(Text)
    level = Column(Integer, CheckConstraint("level BETWEEN 1 AND 3"))
    xp = Column(Integer)
    position_x = Column(Float)
    position_y = Column(Float)
    active = Column(Boolean, default=True)
    completion_type = Column(String(10), default="token")
    
    tree = relationship("Tree", back_populates="skills")
    submissions = relationship("Submission", back_populates="skill")
    dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.skill_id",
        back_populates="skill"
    )
    dependent_on = relationship(
        "Dependency",
        foreign_keys="Dependency.depends_on_skill_id",
        back_populates="depends_on_skill"
    )
    tokens = relationship("Token", back_populates="skill")
    user_skills = relationship("UserSkill", back_populates="skill")

class Dependency(Base):
    __tablename__ = "dependencies"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"))
    depends_on_skill_id = Column(Integer, ForeignKey("skills.id"))
    
    skill = relationship(
        "Skill",
        foreign_keys=[skill_id],
        back_populates="dependencies"
    )
    depends_on_skill = relationship(
        "Skill",
        foreign_keys=[depends_on_skill_id],
        back_populates="dependent_on"
    )

class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"))
    token_string = Column(String(255), unique=True, nullable=False, index=True)
    redeemed_by = Column(Integer, ForeignKey("users.id"))
    redeemed_at = Column(TIMESTAMP)
    
    skill = relationship("Skill", back_populates="tokens")
    redeemed_user = relationship("User", back_populates="redeemed_tokens")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    file_data = Column(LargeBinary, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    note = Column(Text)
    status = Column(String(20), default="pending")
    feedback = Column(Text)
    submitted_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    reviewed_at = Column(TIMESTAMP)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User", foreign_keys=[user_id], backref="submissions")
    skill = relationship("Skill", back_populates="submissions")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

class UserSkill(Base):
    __tablename__ = "user_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    xp_awarded = Column(Integer)
    completed_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    user = relationship("User", back_populates="user_skills")
    skill = relationship("Skill", back_populates="user_skills")

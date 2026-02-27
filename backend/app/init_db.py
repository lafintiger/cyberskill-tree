from sqlalchemy.orm import Session
from app.database.config import SessionLocal, engine, Base
from app.models import models
from app.utils.auth import get_password_hash
import random
import string

def generate_token():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        existing_admin = db.query(models.User).filter(models.User.email == "admin@cyber.edu").first()
        if existing_admin:
            print("Database already initialized")
            return
        
        cyber_class = models.Class(
            name="Cybersecurity 101",
            term="Spring 2026"
        )
        db.add(cyber_class)
        db.commit()
        db.refresh(cyber_class)
        
        admin_user = models.User(
            email="admin@cyber.edu",
            name="Admin User",
            password_hash=get_password_hash("admin123"),
            role="admin",
            class_id=cyber_class.id
        )
        db.add(admin_user)
        
        student_user = models.User(
            email="student@cyber.edu",
            name="Test Student",
            password_hash=get_password_hash("student123"),
            role="student",
            class_id=cyber_class.id
        )
        db.add(student_user)
        db.commit()
        
        web_tree = models.Tree(
            name="Web Exploitation",
            description="Master the art of web application security"
        )
        network_tree = models.Tree(
            name="Network & Infrastructure",
            description="Dominate network penetration testing"
        )
        db.add_all([web_tree, network_tree])
        db.commit()
        db.refresh(web_tree)
        db.refresh(network_tree)
        
        web_skills = [
            {
                "name": "HTTP Fundamentals",
                "description": "Understanding HTTP protocol basics",
                "level": 1,
                "xp": 100,
                "position_x": 100.0,
                "position_y": 200.0,
                "tree_id": web_tree.id
            },
            {
                "name": "SQL Injection Basics",
                "description": "Introduction to SQL injection techniques",
                "level": 1,
                "xp": 150,
                "position_x": 300.0,
                "position_y": 200.0,
                "tree_id": web_tree.id
            },
            {
                "name": "XSS Attacks",
                "description": "Cross-site scripting exploitation",
                "level": 2,
                "xp": 200,
                "position_x": 200.0,
                "position_y": 350.0,
                "tree_id": web_tree.id
            },
            {
                "name": "Advanced SQL Injection",
                "description": "Blind SQL injection and advanced techniques",
                "level": 2,
                "xp": 250,
                "position_x": 400.0,
                "position_y": 350.0,
                "tree_id": web_tree.id
            },
            {
                "name": "Web Application Firewall Bypass",
                "description": "Techniques to evade WAF protection",
                "level": 3,
                "xp": 300,
                "position_x": 300.0,
                "position_y": 500.0,
                "tree_id": web_tree.id
            }
        ]
        
        network_skills = [
            {
                "name": "Network Scanning",
                "description": "Port scanning and network discovery",
                "level": 1,
                "xp": 100,
                "position_x": 100.0,
                "position_y": 200.0,
                "tree_id": network_tree.id
            },
            {
                "name": "Service Enumeration",
                "description": "Identifying and fingerprinting services",
                "level": 1,
                "xp": 150,
                "position_x": 300.0,
                "position_y": 200.0,
                "tree_id": network_tree.id
            },
            {
                "name": "Vulnerability Assessment",
                "description": "Finding and analyzing vulnerabilities",
                "level": 2,
                "xp": 200,
                "position_x": 200.0,
                "position_y": 350.0,
                "tree_id": network_tree.id
            }
        ]
        
        for skill_data in web_skills + network_skills:
            skill = models.Skill(**skill_data)
            db.add(skill)
        
        db.commit()
        
        all_skills = db.query(models.Skill).all()
        
        dep1 = models.Dependency(skill_id=all_skills[2].id, depends_on_skill_id=all_skills[0].id)
        dep2 = models.Dependency(skill_id=all_skills[3].id, depends_on_skill_id=all_skills[1].id)
        dep3 = models.Dependency(skill_id=all_skills[4].id, depends_on_skill_id=all_skills[2].id)
        dep4 = models.Dependency(skill_id=all_skills[4].id, depends_on_skill_id=all_skills[3].id)
        
        dep5 = models.Dependency(skill_id=all_skills[7].id, depends_on_skill_id=all_skills[5].id)
        dep6 = models.Dependency(skill_id=all_skills[7].id, depends_on_skill_id=all_skills[6].id)
        
        db.add_all([dep1, dep2, dep3, dep4, dep5, dep6])
        db.commit()
        
        for skill in all_skills:
            for i in range(3):
                token = models.Token(
                    skill_id=skill.id,
                    token_string=f"{skill.name[:3].upper()}-{generate_token()}"
                )
                db.add(token)
        
        db.commit()
        
        print("Database initialized successfully!")
        print("\nCredentials:")
        print("Admin: admin@cyber.edu / admin123")
        print("Student: student@cyber.edu / student123")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

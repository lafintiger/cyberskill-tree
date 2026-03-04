
# CyberSkill Tree – Expanded Product Requirements Document (PRD)

---
## Executive Summary
CyberSkill Tree is a web-based, cyberpunk-themed mastery tracking system for penetration testing education.
Hosted locally in Docker, exposed on port 3366, supporting multiple classes.

---
## System Architecture Overview

### Frontend
- React
- D3.js
- TailwindCSS

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM

### Infrastructure
- Docker Compose
- Port 3366

---
## Full Database Schema (SQL)

```sql
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    term VARCHAR(50)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    class_id INTEGER REFERENCES classes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    tree_id INTEGER REFERENCES trees(id),
    name VARCHAR(150),
    description TEXT,
    level INTEGER CHECK (level BETWEEN 1 AND 3),
    xp INTEGER,
    position_x FLOAT,
    position_y FLOAT,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE dependencies (
    id SERIAL PRIMARY KEY,
    skill_id INTEGER REFERENCES skills(id),
    depends_on_skill_id INTEGER REFERENCES skills(id)
);

CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    skill_id INTEGER REFERENCES skills(id),
    token_string VARCHAR(255) UNIQUE NOT NULL,
    redeemed_by INTEGER REFERENCES users(id),
    redeemed_at TIMESTAMP
);

CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    skill_id INTEGER REFERENCES skills(id),
    xp_awarded INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---
## Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: cyber
      POSTGRES_PASSWORD: cyberpass
      POSTGRES_DB: cyberskill
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://cyber:cyberpass@db:5432/cyberskill
    ports:
      - "3366:8000"

volumes:
  postgres_data:
```

---
## UI Wireframe Overview

### Student View
- Header with XP
- Tree selector tabs
- Interactive constellation graph
- Side panel with token submission

### Admin View
- Tree manager
- Skill editor (drag + dependency linking)
- Token manager
- Student progress viewer

---
## Development Roadmap (10 Weeks)
1. Setup + Docker
2. Authentication
3. Database models
4. Token engine
5. Basic frontend
6. Graph rendering
7. Submission flow
8. Admin UI
9. XP dashboard + export
10. Polish + security review

---
## Refined Skill Taxonomy (~285 Nodes)

7 Domains:
- Physical & Hardware (45)
- Web Exploitation (45)
- Network & Infrastructure (45)
- AI Offensive Security (30)
- Reverse Engineering (30)
- OSINT & Social Engineering (30)
- Professional Operator (30)

Each skill has L1, L2, L3 progression.

---
## Minimal Working Prototype

Includes:
- Authentication
- Single tree
- Token validation
- XP awarding
- Basic D3 graph
- Admin CRUD

Core API:
POST /auth/login
GET /trees
GET /skills/{tree_id}
POST /token/submit
GET /user/progress
POST /admin/skill
POST /admin/token

---
End of Document

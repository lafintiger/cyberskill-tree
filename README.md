# CyberSkill Tree

> A cyberpunk-themed skill mastery tracking system for penetration testing courses.

Students unlock skills by submitting tokens earned in the lab. Instructors manage trees, generate tokens, and watch XP accumulate in real time — all through a neon-lit constellation interface.

---

## Table of Contents

- [Purpose](#purpose)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Default Credentials](#default-credentials)
- [Student Guide](#student-guide)
- [Admin Guide](#admin-guide)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Purpose

CyberSkill Tree turns a penetration testing curriculum into a progression system. Each skill in the course has one or more unlock tokens — short codes that the instructor generates and awards when a student demonstrates competency. Students submit their token through the app, earn XP, and watch their skill constellation light up.

**Why this matters:**
- Students get immediate, visual feedback on their progress
- Instructors get a real-time view of the class without grade books
- Skills can be gated behind prerequisites, enforcing a proper learning path
- XP leaderboards and per-student breakdowns make progress conversations easy
- It's built for the classroom, not the enterprise — simple to deploy, simple to use

---

## How It Works

### The Token Flow

```
Instructor                     System                          Student
─────────                      ──────                          ───────
1. Creates a skill in          →  Skill stored in DB
   the admin panel

2. Generates a token           →  Token stored (unredeemed)
   for that skill

3. Gives the token to          →
   the student (verbally,
   on paper, etc.)
                                                               4. Logs into the app

                                                               5. Submits the token
                               ←  System validates:
                                  - Token exists?
                                  - Not already redeemed?
                                  - Prerequisites met?
                               →  Marks token redeemed
                                  Awards XP to student
                                                               6. Skill lights up green
                                                                  XP added to total
```

### Skill Trees

Skills are organized into **Trees** (domains). Each tree is displayed as an interactive constellation graph where:

- **Gray nodes** = Locked (prerequisites not yet completed)
- **Cyan nodes** = Available to unlock (all prereqs met)
- **Green nodes** = Completed

Skills have three levels (L1 → L3), representing introductory, intermediate, and advanced competency. Dependencies between skills form edges in the graph — you cannot unlock an advanced skill without completing its prerequisites first.

### XP System

Each skill is assigned an XP value when created. XP is awarded automatically when a valid token is redeemed. Students see their running total in the header. Admins can view per-student breakdowns.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, D3.js, TailwindCSS, React Router |
| Backend | FastAPI (Python 3.11), SQLAlchemy ORM |
| Database | PostgreSQL 15 |
| Auth | JWT (python-jose), bcrypt via passlib |
| Container | Docker, Docker Compose |
| Port | **3366** (everything — frontend + API on one port) |

---

## Architecture

```
┌──────────────────────────── Port 3366 ─────────────────────────────┐
│                                                                      │
│   FastAPI (Python)                                                   │
│   ┌─────────────────────────────────────────────────────────┐       │
│   │  /api/*        →  REST API (auth, skills, tokens, etc.) │       │
│   │  /             →  Serves React SPA (static build)       │       │
│   │  /docs         →  Swagger UI                            │       │
│   └─────────────────────────────────────────────────────────┘       │
│           │                                                          │
│           ▼                                                          │
│   PostgreSQL (internal, port 5432)                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

Docker Compose Services:
  db        → postgres:15  (data volume: postgres_data)
  backend   → FastAPI app  (port 3366:8000)
  frontend  → Node build   (builds React → shared volume → backend)
```

The frontend container builds the React app into a shared Docker volume. FastAPI mounts that volume and serves the static files directly, so the entire application — UI and API — is accessible through a single port.

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Launch

```bash
# Clone or navigate to the project directory
cd /path/to/cyberskill-tree

# Start everything (builds images, starts containers)
docker compose up -d --build

# Initialize the database with sample data
docker compose exec backend python -m app.init_db
```

> The first build takes 3–5 minutes to pull images and install dependencies. Subsequent starts are instant.

### Access

| URL | Description |
|-----|-------------|
| http://localhost:3366 | Main application |
| http://localhost:3366/docs | Interactive API documentation (Swagger) |
| http://localhost:3366/api/health | Health check |

### Stop

```bash
docker compose down
```

### Full Reset (wipes all data)

```bash
docker compose down -v && docker compose up -d --build
docker compose exec backend python -m app.init_db
```

---

## Default Credentials

> Change these before deploying anywhere beyond your local machine.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cyber.edu` | `admin123` |
| Student | `student@cyber.edu` | `student123` |

---

## Student Guide

1. Open **http://localhost:3366** and log in
2. Your total **XP** is shown in the top-right header
3. Use the **tree selector tabs** to switch between skill domains
4. The constellation shows all skills:
   - Click any node to see its name, description, level, XP value, and prerequisites
   - Green = you've completed it. Cyan = you can unlock it now. Gray = prereqs not met yet.
5. When your instructor gives you a token, paste it into the **Token Submission** box and click **VALIDATE TOKEN**
6. If valid, the skill turns green and your XP updates immediately

---

## Admin Guide

Log in with the admin account and navigate to the admin dashboard. It has four tabs:

### Skills Tab

Create and view skills for each tree:
- **Name / Description** — displayed to students
- **Level** — 1 (intro), 2 (intermediate), 3 (advanced)
- **XP** — reward amount on completion
- **Position X/Y** — where the node appears in the constellation (tweak to avoid overlaps)
- **Tree** — which domain this skill belongs to

### Tokens Tab

Generate unlock codes for skills:
1. Select a skill from the dropdown
2. Click **GEN** to auto-generate a random token (or type your own)
3. Click **CREATE TOKEN**
4. Distribute the token string to students however you like (verbally, printed, in a CTF flag format, etc.)

Tokens are single-use. Once redeemed, they show as `REDEEMED` in the list.

### Users Tab

View all registered accounts — name, email, role, and class assignment.

### Classes Tab

Create class sections (e.g., "Cybersecurity 101 – Spring 2026") and assign students to them for future filtering/reporting.

---

## API Reference

All API endpoints are under `/api`. Full interactive docs available at `/docs`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user info |

### Trees

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trees/` | Any | List all skill trees |
| GET | `/api/trees/{id}` | Any | Get one tree |
| POST | `/api/trees/` | Admin | Create a tree |
| DELETE | `/api/trees/{id}` | Admin | Delete a tree |

### Skills

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/skills/tree/{tree_id}` | Any | Get skills for a tree (includes completion status) |
| POST | `/api/skills/` | Admin | Create a skill |
| PUT | `/api/skills/{id}` | Admin | Update a skill |
| DELETE | `/api/skills/{id}` | Admin | Deactivate a skill |
| POST | `/api/skills/dependencies` | Admin | Add a prerequisite dependency |

### Tokens

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/tokens/submit` | Student | Submit a token to unlock a skill |
| POST | `/api/tokens/` | Admin | Create a token |
| GET | `/api/tokens/` | Admin | List all tokens |
| GET | `/api/tokens/skill/{skill_id}` | Admin | List tokens for one skill |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/progress` | Any | Get current user's XP and completed skills |
| GET | `/api/users/` | Admin | List all users |
| GET | `/api/users/{id}/progress` | Admin | Get one student's progress |

### Classes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/classes/` | Any | List all classes |
| POST | `/api/classes/` | Admin | Create a class |
| DELETE | `/api/classes/{id}` | Admin | Delete a class |

---

## Database Schema

```sql
classes       -- Course sections (name, term)
users         -- Accounts (email, password_hash, role, class_id)
trees         -- Skill domains (name, description)
skills        -- Individual skills (name, level 1-3, xp, position_x/y, active)
dependencies  -- Prerequisite links between skills
tokens        -- Unlock codes (token_string, skill_id, redeemed_by, redeemed_at)
user_skills   -- Completion records (user_id, skill_id, xp_awarded, completed_at)
```

All foreign keys are enforced at the database level. Tokens are unique strings; the same token cannot be redeemed twice.

---

## Project Structure

```
cyberskill-tree/
│
├── docker-compose.yml          # Orchestrates db, backend, frontend
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app, static file serving, CORS
│       ├── init_db.py          # Seed script (sample trees, skills, tokens)
│       ├── database/
│       │   └── config.py       # SQLAlchemy engine + session + get_db
│       ├── models/
│       │   ├── models.py       # ORM table definitions
│       │   └── schemas.py      # Pydantic request/response schemas
│       ├── routers/
│       │   ├── auth.py         # /api/auth/*
│       │   ├── trees.py        # /api/trees/*
│       │   ├── skills.py       # /api/skills/*
│       │   ├── tokens.py       # /api/tokens/*
│       │   ├── users.py        # /api/users/*
│       │   └── classes.py      # /api/classes/*
│       └── utils/
│           └── auth.py         # JWT creation/validation, password hashing
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.js              # Router, protected routes
        ├── index.js
        ├── index.css           # Tailwind + cyberpunk globals
        ├── services/
        │   └── api.js          # Axios client, all API calls
        ├── components/
        │   ├── Login.jsx       # Login form
        │   ├── Header.jsx      # XP display, logout
        │   └── SkillTree.jsx   # D3.js constellation graph
        └── pages/
            ├── StudentDashboard.jsx   # Tree tabs, token submission, skill panel
            └── AdminDashboard.jsx     # Skills/Tokens/Users/Classes management
```

---

## Troubleshooting

**Port 3366 already in use**
```bash
lsof -i :3366        # find what's using it
# or change the port in docker-compose.yml: "YOURPORT:8000"
```

**Frontend showing blank page after restart**
The backend needs the frontend build volume. Rebuild:
```bash
docker compose up -d --build
```

**"Token already redeemed" error**
Each token is single-use. Generate a new token in the admin panel for the same skill.

**"Missing prerequisite" error**
The student must complete the prerequisite skill first before this token will be accepted.

**Database won't initialize**
```bash
docker compose logs db          # check postgres is healthy
docker compose restart backend  # retry after db is ready
docker compose exec backend python -m app.init_db
```

**Bcrypt warning on startup** (`error reading bcrypt version`)
This is a harmless passlib/bcrypt version mismatch warning. Authentication works correctly despite the warning.

---

## Environment Variables

Set in `docker-compose.yml`. Override in a `.env` file for production:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://cyber:cyberpass@db:5432/cyberskill` | PostgreSQL connection string |
| `SECRET_KEY` | `cyber-secret-key-change-in-production` | JWT signing secret — **change this** |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT lifetime |

---

## Skill Taxonomy

The system is designed to support up to ~285 skills across 7 domains:

| Domain | Target Skills |
|--------|--------------|
| Physical & Hardware | 45 |
| Web Exploitation | 45 |
| Network & Infrastructure | 45 |
| AI Offensive Security | 30 |
| Reverse Engineering | 30 |
| OSINT & Social Engineering | 30 |
| Professional Operator | 30 |

The seed data includes two starter trees (Web Exploitation and Network & Infrastructure) with 8 sample skills, which you can extend via the admin panel or by editing `init_db.py`.

---

## License

MIT — use it, fork it, teach with it.

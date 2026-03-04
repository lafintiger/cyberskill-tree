from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database.config import engine, Base
from app.routers import auth, trees, skills, tokens, users, classes, submissions
import os
from pathlib import Path

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CyberSkill Tree API",
    description="Cyberpunk-themed mastery tracking system for penetration testing education",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(trees.router, prefix="/api")
app.include_router(skills.router, prefix="/api")
app.include_router(tokens.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(classes.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")

possible_build_paths = [
    Path("/app/frontend_build"),
    Path(__file__).resolve().parent.parent.parent / "frontend" / "build",
    Path(__file__).resolve().parent.parent / "frontend_build",
]
frontend_build_path = next((p for p in possible_build_paths if p.exists() and (p / "index.html").exists()), None)

if frontend_build_path:
    app.mount("/static", StaticFiles(directory=str(frontend_build_path / "static")), name="static")
    
    @app.get("/api")
    def api_root():
        return {
            "message": "CyberSkill Tree API",
            "version": "1.0.0",
            "docs": "/docs"
        }

    @app.get("/api/health")
    def health_check():
        return {"status": "healthy"}
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path == "docs" or full_path == "openapi.json":
            return {"error": "Not found"}
        
        file_path = frontend_build_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        return FileResponse(frontend_build_path / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "CyberSkill Tree API",
            "version": "1.0.0",
            "docs": "/docs",
            "note": "Frontend not built yet. Build with: cd frontend && npm run build"
        }

    @app.get("/health")
    def health_check():
        return {"status": "healthy"}

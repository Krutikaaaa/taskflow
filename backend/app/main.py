from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.dashboard import dashboard_router, users_router
import app.models.models  # noqa: F401

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(projects_router, prefix="/api/projects", tags=["Projects"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])

@app.get("/")
@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.models import Task, Project, User, UserRole, TaskStatus
from app.schemas.schemas import DashboardStats, TaskOut, UserOut, UserUpdate
from app.api.deps import get_current_user, require_admin
from typing import List
from uuid import UUID
from fastapi import HTTPException

dashboard_router = APIRouter()
users_router = APIRouter()


def enrich_task(task):
    return {
        **{c.name: getattr(task, c.name) for c in task.__table__.columns},
        "assignee": task.assignee,
        "creator": task.creator,
        "project": task.project,
        "comment_count": len(task.comments),
    }


@dashboard_router.get("/", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)

    if current_user.role == UserRole.ADMIN:
        base_tasks = db.query(Task).options(
            selectinload(Task.assignee),
            selectinload(Task.creator),
            selectinload(Task.project),
            selectinload(Task.comments),
        ).all()
        total_projects = db.query(Project).filter(Project.is_archived == False).count()
    else:
        accessible = db.query(Project).filter(Project.members.any(User.id == current_user.id)).all()
        accessible_ids = [p.id for p in accessible]
        base_tasks = db.query(Task).options(
            selectinload(Task.assignee),
            selectinload(Task.creator),
            selectinload(Task.project),
            selectinload(Task.comments),
        ).filter(Task.project_id.in_(accessible_ids)).all()
        total_projects = len(accessible_ids)

    total = len(base_tasks)
    todo = sum(1 for t in base_tasks if t.status == TaskStatus.TODO)
    in_progress = sum(1 for t in base_tasks if t.status == TaskStatus.IN_PROGRESS)
    in_review = sum(1 for t in base_tasks if t.status == TaskStatus.IN_REVIEW)
    done = sum(1 for t in base_tasks if t.status == TaskStatus.DONE)
    overdue = sum(1 for t in base_tasks if t.due_date and t.due_date.replace(tzinfo=timezone.utc) < now and t.status != TaskStatus.DONE)
    my_tasks = sum(1 for t in base_tasks if t.assignee_id == current_user.id)
    completion_rate = round((done / total * 100) if total > 0 else 0, 1)

    recent = sorted(base_tasks, key=lambda t: t.created_at, reverse=True)[:5]
    overdue_tasks = [t for t in base_tasks if t.due_date and t.due_date.replace(tzinfo=timezone.utc) < now and t.status != TaskStatus.DONE][:5]

    return DashboardStats(
        total_tasks=total, todo=todo, in_progress=in_progress,
        in_review=in_review, done=done, overdue=overdue,
        total_projects=total_projects, my_tasks=my_tasks,
        completion_rate=completion_rate,
        recent_tasks=[enrich_task(t) for t in recent],
        overdue_tasks=[enrich_task(t) for t in overdue_tasks],
    )


# ─── Users routes ─────────────────────────────────────────────────────────

@users_router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).filter(User.is_active == True).all()


@users_router.patch("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@users_router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: UUID,
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user

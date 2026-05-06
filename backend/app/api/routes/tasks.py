from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.models import Task, Project, User, UserRole, TaskStatus
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskOut, CommentCreate, CommentOut
from app.api.deps import get_current_user
from app.models.models import Comment

router = APIRouter()


def enrich_task(task: Task, db: Session) -> dict:
    return {
        **{c.name: getattr(task, c.name) for c in task.__table__.columns},
        "assignee": task.assignee,
        "creator": task.creator,
        "project": task.project,
        "comment_count": len(task.comments),
    }


def get_task_or_404(task_id: UUID, db: Session) -> Task:
    task = db.query(Task).options(
        selectinload(Task.assignee),
        selectinload(Task.creator),
        selectinload(Task.project),
        selectinload(Task.comments),
    ).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def check_task_access(task: Task, user: User, db: Session):
    project = db.query(Project).options(selectinload(Project.members)).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    member_ids = [m.id for m in project.members]
    if user.id not in member_ids and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not a project member")


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    project_id: Optional[UUID] = Query(None),
    status: Optional[TaskStatus] = Query(None),
    assignee_id: Optional[UUID] = Query(None),
    my_tasks: Optional[bool] = Query(None),
    overdue: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Task).options(
        selectinload(Task.assignee),
        selectinload(Task.creator),
        selectinload(Task.project),
        selectinload(Task.comments),
    )

    if current_user.role != UserRole.ADMIN:
        # Only show tasks from accessible projects
        accessible = db.query(Project).filter(Project.members.any(User.id == current_user.id)).all()
        accessible_ids = [p.id for p in accessible]
        query = query.filter(Task.project_id.in_(accessible_ids))

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if my_tasks:
        query = query.filter(Task.assignee_id == current_user.id)
    if overdue:
        now = datetime.now(timezone.utc)
        query = query.filter(Task.due_date < now, Task.status != TaskStatus.DONE)

    tasks = query.order_by(Task.created_at.desc()).all()
    return [enrich_task(t, db) for t in tasks]


@router.post("/", response_model=TaskOut, status_code=201)
def create_task(
    payload: TaskCreate,
    project_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).options(selectinload(Project.members)).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member_ids = [m.id for m in project.members]
    if current_user.id not in member_ids and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not a project member")

    task = Task(**payload.model_dump(), project_id=project_id, creator_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return enrich_task(get_task_or_404(task.id, db), db)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = get_task_or_404(task_id, db)
    check_task_access(task, current_user, db)
    return enrich_task(task, db)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task_or_404(task_id, db)
    check_task_access(task, current_user, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    return enrich_task(get_task_or_404(task_id, db), db)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    check_task_access(task, current_user, db)
    db.delete(task)
    db.commit()


# ─── Comments ──────────────────────────────────────────────────────────────

@router.get("/{task_id}/comments", response_model=List[CommentOut])
def list_comments(task_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = get_task_or_404(task_id, db)
    check_task_access(task, current_user, db)
    comments = db.query(Comment).options(selectinload(Comment.author)).filter(Comment.task_id == task_id).order_by(Comment.created_at).all()
    return comments


@router.post("/{task_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    task_id: UUID,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task_or_404(task_id, db)
    check_task_access(task, current_user, db)
    comment = Comment(content=payload.content, task_id=task_id, author_id=current_user.id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return db.query(Comment).options(selectinload(Comment.author)).filter(Comment.id == comment.id).first()


@router.delete("/{task_id}/comments/{comment_id}", status_code=204)
def delete_comment(
    task_id: UUID,
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.task_id == task_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(comment)
    db.commit()

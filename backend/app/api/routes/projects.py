from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func
from typing import List
from uuid import UUID
from app.db.database import get_db
from app.models.models import Project, User, UserRole, project_members, Task, TaskStatus
from app.schemas.schemas import ProjectCreate, ProjectUpdate, ProjectOut, AddMemberRequest
from app.api.deps import get_current_user

router = APIRouter()


def enrich_project(project: Project, db: Session) -> dict:
    data = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "color": project.color,
        "icon": project.icon,
        "is_archived": project.is_archived,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "owner": project.owner,
        "members": project.members,
        "task_count": len(project.tasks),
        "completed_count": sum(1 for t in project.tasks if t.status == TaskStatus.DONE),
    }
    return data


def get_project_or_404(project_id: UUID, db: Session) -> Project:
    project = db.query(Project).options(
        selectinload(Project.owner),
        selectinload(Project.members),
        selectinload(Project.tasks),
    ).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def check_project_access(project: Project, user: User):
    member_ids = [m.id for m in project.members]
    if user.id != project.owner_id and user.id not in member_ids and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not a project member")


@router.get("/", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        projects = db.query(Project).options(
            selectinload(Project.owner),
            selectinload(Project.members),
            selectinload(Project.tasks),
        ).filter(Project.is_archived == False).all()
    else:
        projects = db.query(Project).options(
            selectinload(Project.owner),
            selectinload(Project.members),
            selectinload(Project.tasks),
        ).filter(
            Project.is_archived == False,
            Project.members.any(User.id == current_user.id)
        ).all()

    return [enrich_project(p, db) for p in projects]


@router.post("/", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(**payload.model_dump(), owner_id=current_user.id)
    project.members.append(current_user)
    db.add(project)
    db.commit()
    db.refresh(project)
    project = get_project_or_404(project.id, db)
    return enrich_project(project, db)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    return enrich_project(project, db)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = get_project_or_404(project_id, db)
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only project owner or admin can update")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    project = get_project_or_404(project_id, db)
    return enrich_project(project, db)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only project owner or admin can delete")
    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", response_model=ProjectOut)
def add_member(
    project_id: UUID,
    payload: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = get_project_or_404(project_id, db)
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only owner or admin can add members")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with that email")

    if user in project.members:
        raise HTTPException(status_code=400, detail="User already a member")

    project.members.append(user)
    db.commit()
    project = get_project_or_404(project_id, db)
    return enrich_project(project, db)


@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_member(
    project_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = get_project_or_404(project_id, db)
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only owner or admin can remove members")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user not in project.members:
        raise HTTPException(status_code=404, detail="Member not found")

    project.members.remove(user)
    db.commit()

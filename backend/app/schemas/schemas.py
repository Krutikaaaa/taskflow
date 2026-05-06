from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator
from app.models.models import UserRole, TaskStatus, TaskPriority


# ─── User Schemas ────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_color: Optional[str] = None

class UserOut(UserBase):
    id: UUID
    role: UserRole
    avatar_color: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class UserSummary(BaseModel):
    id: UUID
    full_name: str
    email: str
    avatar_color: str
    role: UserRole

    model_config = {"from_attributes": True}


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Project Schemas ──────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "🚀"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_archived: Optional[bool] = None

class ProjectOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    color: str
    icon: str
    is_archived: bool
    owner_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserSummary]
    members: List[UserSummary] = []
    task_count: Optional[int] = 0
    completed_count: Optional[int] = 0

    model_config = {"from_attributes": True}

class AddMemberRequest(BaseModel):
    email: str
    role: Optional[str] = "member"


# ─── Task Schemas ─────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    assignee_id: Optional[UUID] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    assignee_id: Optional[UUID] = None

class TaskOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime]
    estimated_hours: Optional[int]
    project_id: UUID
    assignee_id: Optional[UUID]
    creator_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserSummary]
    creator: Optional[UserSummary]
    project: Optional["ProjectMini"] = None
    comment_count: Optional[int] = 0

    model_config = {"from_attributes": True}

class ProjectMini(BaseModel):
    id: UUID
    name: str
    color: str
    icon: str

    model_config = {"from_attributes": True}


# ─── Comment Schemas ──────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: UUID
    content: str
    task_id: UUID
    author_id: UUID
    created_at: datetime
    author: UserSummary

    model_config = {"from_attributes": True}


# ─── Dashboard Schema ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_tasks: int
    todo: int
    in_progress: int
    in_review: int
    done: int
    overdue: int
    total_projects: int
    my_tasks: int
    completion_rate: float
    recent_tasks: List[TaskOut]
    overdue_tasks: List[TaskOut]

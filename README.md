# ⚡ TaskFlow — Team Task Manager

> A full-stack task management platform with role-based access, Kanban boards, and real-time dashboards.

![TaskFlow](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=flat-square)

## 🚀 Live Demo

**Frontend:** https://taskflow-frontend.up.railway.app  
**API Docs:** https://taskflow-backend.up.railway.app/api/docs

**Demo credentials:**
- Admin: `admin@taskflow.dev` / `password123`
- Member: `member@taskflow.dev` / `password123`

---

## ✨ Features

### Authentication
- JWT-based auth (access + refresh tokens)
- Signup / Login with email & password
- First registered user becomes Admin
- Token auto-refresh on expiry

### Role-Based Access Control
| Feature | Admin | Member |
|---|---|---|
| View all projects | ✅ | ✅ (own only) |
| Create projects | ✅ | ✅ |
| Delete any project | ✅ | Owner only |
| Manage team members | ✅ | ❌ |
| Promote/demote users | ✅ | ❌ |
| View all tasks | ✅ | Project members only |

### Projects
- Create projects with custom icon, color, name
- Invite/remove team members by email
- Track task progress per project
- Visual Kanban board (To Do → In Progress → In Review → Done)

### Tasks
- Full CRUD with title, description, priority, status, due date, estimated hours, assignee
- Status changes inline from task list
- Comment threads on tasks
- Overdue detection and highlighting

### Dashboard
- Greeting with user name and time of day
- Stats: Total tasks, In Progress, Done, Overdue, Projects
- Donut chart with completion rate
- Status breakdown bars
- Recent tasks feed
- Overdue task alerts

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11 + FastAPI |
| Database | PostgreSQL 15 + SQLAlchemy ORM |
| Auth | JWT (python-jose) + bcrypt |
| Frontend | React 18 + Vite |
| State | Zustand |
| HTTP | Axios with interceptors |
| Deployment | Railway |

---

## 🏃 Running Locally

### Option 1: Docker Compose (recommended)

```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL and SECRET_KEY
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🚂 Railway Deployment

### Backend
1. Create new Railway project → "Deploy from GitHub"
2. Select the repo, set root directory to `backend`
3. Add environment variables:
   ```
   DATABASE_URL=<your-postgres-url>
   SECRET_KEY=<random-64-char-string>
   ```
4. Railway auto-detects `Dockerfile` and deploys

### Frontend
1. Add a new service → "Deploy from GitHub"
2. Set root directory to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
4. Deploys via `frontend/Dockerfile` with nginx

### Database
1. In Railway, click "+ New" → "Database" → "PostgreSQL"
2. Copy `DATABASE_URL` and paste into backend service env vars

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          # Auth dependencies
│   │   │   └── routes/
│   │   │       ├── auth.py      # Signup, login, refresh
│   │   │       ├── projects.py  # Project CRUD + members
│   │   │       ├── tasks.py     # Task CRUD + comments
│   │   │       └── dashboard.py # Stats + user management
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic settings
│   │   │   └── security.py      # JWT + bcrypt
│   │   ├── db/database.py       # SQLAlchemy session
│   │   ├── models/models.py     # ORM models
│   │   ├── schemas/schemas.py   # Pydantic schemas
│   │   └── main.py              # FastAPI app + CORS
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # Login + Signup
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── projects/        # Projects list + detail + kanban
│   │   │   ├── tasks/           # Task list with filters
│   │   │   ├── users/           # Team management
│   │   │   ├── layout/          # Sidebar
│   │   │   └── ui/              # Shared components
│   │   ├── lib/
│   │   │   ├── api.js           # Axios + interceptors
│   │   │   └── utils.js         # Helpers
│   │   ├── store/authStore.js   # Zustand auth state
│   │   └── App.jsx              # Router + protected routes
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── railway.toml
```

---

## 🔒 Security

- Passwords hashed with bcrypt
- Access tokens expire in 24h, refresh tokens in 7 days
- All endpoints require JWT authentication
- Project access enforced at API level (not just frontend)
- Role checks on sensitive operations (admin-only routes)
- CORS configured for production domains

---

## 📡 API Reference

Interactive docs available at `/api/docs` (Swagger UI).

Key endpoints:
```
POST /api/auth/signup       Register new user
POST /api/auth/login        Login
GET  /api/auth/me           Current user

GET  /api/projects/         List projects
POST /api/projects/         Create project
GET  /api/projects/{id}     Get project
POST /api/projects/{id}/members  Add member

GET  /api/tasks/            List tasks (with filters)
POST /api/tasks/?project_id={id}  Create task
PATCH /api/tasks/{id}       Update task

GET  /api/dashboard/        Dashboard stats
GET  /api/users/            List users (team)
```

---

## 👤 Author

Built with ❤️ for a full-stack engineering assignment.

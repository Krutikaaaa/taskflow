import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, MessageSquare, Calendar, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { Btn, Modal, Input, Textarea, Select, Avatar, Badge, Spinner, EmptyState } from '../ui'
import { STATUS_META, PRIORITY_META, fmtDate, isOverdue } from '../../lib/utils'

const COLUMNS = [
  { key: 'todo',        label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review',   label: 'In Review' },
  { key: 'done',        label: 'Done' },
]

// ── Task create/edit modal ─────────────────────────────────────────────────
function TaskModal({ open, onClose, projectId, members, task, onSaved }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium',
    due_date: '', estimated_hours: '', assignee_id: '',
  })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours || '',
        assignee_id: task.assignee_id || '',
      })
    } else {
      setForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', estimated_hours: '', assignee_id: '' })
    }
  }, [task, open])

  const submit = async e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title required')
    setLoading(true)
    try {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours) : null,
        assignee_id: form.assignee_id || null,
      }
      let data
      if (isEdit) {
        const r = await api.patch(`/tasks/${task.id}`, payload)
        data = r.data
        toast.success('Task updated')
      } else {
        const r = await api.post(`/tasks/?project_id=${projectId}`, payload)
        data = r.data
        toast.success('Task created')
      }
      onSaved(data, isEdit)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save task')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'New Task'} width={520}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Title" placeholder="What needs to be done?" value={form.title} onChange={set('title')} />
        <Textarea label="Description" placeholder="Add details..." value={form.description} onChange={set('description')} rows={2} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Status" value={form.status} onChange={set('status')}>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Select label="Priority" value={form.priority} onChange={set('priority')}>
            {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Due Date" type="date" value={form.due_date} onChange={set('due_date')} />
          <Input label="Est. Hours" type="number" min={1} placeholder="4" value={form.estimated_hours} onChange={set('estimated_hours')} />
        </div>
        <Select label="Assignee" value={form.assignee_id} onChange={set('assignee_id')}>
          <option value="">Unassigned</option>
          {(members || []).map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </Select>
        <Btn type="submit" loading={loading} style={{ alignSelf: 'flex-end' }}>
          {isEdit ? 'Update Task' : 'Create Task'}
        </Btn>
      </form>
    </Modal>
  )
}

// ── Kanban card ────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const overdue = isOverdue(task.due_date, task.status)
  const [hover, setHover] = useState(false)

  const NEXT_STATUS = { todo: 'in_progress', in_progress: 'in_review', in_review: 'done' }
  const PREV_STATUS = { done: 'in_review', in_review: 'in_progress', in_progress: 'todo' }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--bg-4)',
        border: `1px solid ${overdue ? 'rgba(255,95,109,0.3)' : hover ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 8,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hover ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {/* Title row */}
      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 8, lineHeight: 1.4, color: task.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
        {task.title}
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        <Badge {...PRIORITY_META[task.priority]} />
        {task.due_date && (
          <span style={{ fontSize: '11px', color: overdue ? 'var(--red)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Calendar size={10} /> {fmtDate(task.due_date)}
          </span>
        )}
        {task.comment_count > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MessageSquare size={10} /> {task.comment_count}
          </span>
        )}
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {PREV_STATUS[task.status] && (
            <button
              onClick={() => onStatusChange(task, PREV_STATUS[task.status])}
              title="Move back"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '10px', color: 'var(--text-3)', cursor: 'pointer' }}
            >←</button>
          )}
          {NEXT_STATUS[task.status] && (
            <button
              onClick={() => onStatusChange(task, NEXT_STATUS[task.status])}
              title="Move forward"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '10px', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}
            >→</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.assignee && <Avatar user={task.assignee} size={20} />}
          {hover && (
            <>
              <button onClick={() => onEdit(task)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', padding: 2 }}>
                <Pencil size={12} />
              </button>
              <button onClick={() => onDelete(task)}
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', display: 'flex', padding: 2 }}>
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('todo')

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/?project_id=${id}`),
    ]).then(([p, t]) => {
      setProject(p.data)
      setTasks(t.data)
    }).catch(() => {
      toast.error('Could not load project')
      navigate('/projects')
    }).finally(() => setLoading(false))
  }, [id])

  const openCreate = (status = 'todo') => {
    setEditTask(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  const handleSaved = (task, isEdit) => {
    if (isEdit) setTasks(ts => ts.map(t => t.id === task.id ? task : t))
    else setTasks(ts => [task, ...ts])
    setEditTask(null)
  }

  const handleEdit = (task) => {
    setEditTask(task)
    setModalOpen(true)
  }

  const handleDelete = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await api.delete(`/tasks/${task.id}`)
      setTasks(ts => ts.filter(t => t.id !== task.id))
      toast.success('Task deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleStatusChange = async (task, newStatus) => {
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, { status: newStatus })
      setTasks(ts => ts.map(t => t.id === task.id ? data : t))
    } catch { toast.error('Failed to move task') }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={32} />
    </div>
  )
  if (!project) return null

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key)
    return acc
  }, {})

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div style={{ padding: '24px 28px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/projects')}
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-2)', cursor: 'pointer', display: 'flex', padding: 8 }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 28 }}>{project.icon}</span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>{project.name}</h1>
            {project.description && <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: 2 }}>{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Progress pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-3)', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ width: 60, height: 4, background: 'var(--bg-4)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: project.color || 'var(--accent)', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 600 }}>{pct}%</span>
          </div>
          {/* Members */}
          <div style={{ display: 'flex' }}>
            {(project.members || []).slice(0, 5).map((m, i) => (
              <div key={m.id} title={m.full_name} style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg)', borderRadius: '50%' }}>
                <Avatar user={m} size={28} />
              </div>
            ))}
          </div>
          <Btn icon={<Plus size={15} />} onClick={() => openCreate('todo')}>Add Task</Btn>
        </div>
      </div>

      {/* Kanban board */}
      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flex: 1, overflowX: 'auto', alignItems: 'start' }}>
        {COLUMNS.map(col => {
          const colTasks = tasksByStatus[col.key] || []
          const meta = STATUS_META[col.key]
          return (
            <div key={col.key}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.02em' }}>{col.label}</span>
                  <span style={{
                    fontSize: '11px', background: meta.bg, color: meta.color,
                    padding: '1px 7px', borderRadius: 20, fontWeight: 700,
                  }}>{colTasks.length}</span>
                </div>
                <button onClick={() => openCreate(col.key)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', padding: 3, borderRadius: 4 }}>
                  <Plus size={14} />
                </button>
              </div>

              {/* Column body */}
              <div style={{
                background: 'var(--bg-2)', borderRadius: 'var(--radius)', padding: 8,
                border: '1px solid var(--border)', minHeight: 120,
              }}>
                {colTasks.length === 0
                  ? (
                    <div
                      onClick={() => openCreate(col.key)}
                      style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: '12px', cursor: 'pointer', borderRadius: 6, border: '1px dashed var(--border)' }}
                    >
                      + Add task
                    </div>
                  )
                  : colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null) }}
        projectId={id}
        members={project.members || []}
        task={editTask}
        onSaved={handleSaved}
      />
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Calendar, Clock, MessageSquare, ChevronDown, Filter, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { Badge, Avatar, Spinner, EmptyState, Select } from '../ui'
import { STATUS_META, PRIORITY_META, fmtDate, fmtRelative, isOverdue } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

export default function Tasks() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', priority: '', my_tasks: false, search: '' })
  const [projects, setProjects] = useState([])

  useEffect(() => {
    api.get('/projects/').then(r => setProjects(r.data))
    fetchTasks()
  }, [])

  const fetchTasks = async (f = filters) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.status) params.set('status', f.status)
    if (f.my_tasks) params.set('my_tasks', 'true')
    try {
      const { data } = await api.get(`/tasks/?${params}`)
      setTasks(data)
    } finally { setLoading(false) }
  }

  const setFilter = k => v => {
    const next = { ...filters, [k]: v }
    setFilters(next)
    fetchTasks(next)
  }

  const handleStatusChange = async (task, newStatus) => {
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, { status: newStatus })
      setTasks(ts => ts.map(t => t.id === task.id ? data : t))
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (task) => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${task.id}`)
    setTasks(ts => ts.filter(t => t.id !== task.id))
    toast.success('Deleted')
  }

  const filtered = tasks.filter(t =>
    !filters.search || t.title.toLowerCase().includes(filters.search.toLowerCase())
  )

  return (
    <div style={{ padding: '28px 32px', flex: 1 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Tasks</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: 2 }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="fade-up-1" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => setFilter('search')(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '13px',
              fontFamily: 'var(--font-body)', outline: 'none',
            }}
          />
        </div>
        <select
          value={filters.status} onChange={e => setFilter('status')(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '13px', fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button
          onClick={() => setFilter('my_tasks')(!filters.my_tasks)}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px',
            background: filters.my_tasks ? 'var(--accent)' : 'var(--bg-2)',
            color: filters.my_tasks ? '#fff' : 'var(--text-2)',
            border: `1px solid ${filters.my_tasks ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'all 0.15s',
          }}
        >Mine only</button>
      </div>

      {/* Tasks list */}
      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>
        : filtered.length === 0
          ? <EmptyState icon="✅" title="No tasks found" description="Adjust your filters or create tasks in a project" />
          : (
            <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(task => {
                const overdue = isOverdue(task.due_date, task.status)
                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--bg-2)', border: `1px solid ${overdue ? 'rgba(255,95,109,0.2)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = overdue ? 'rgba(255,95,109,0.2)' : 'var(--border)'}
                  >
                    {/* Color indicator */}
                    <div style={{ width: 3, height: 36, borderRadius: 3, background: task.project?.color || 'var(--accent)', flexShrink: 0 }} />

                    {/* Main content */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: task.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{task.project?.icon} {task.project?.name}</span>
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
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Badge {...PRIORITY_META[task.priority]} />
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          padding: '3px 8px', borderRadius: 20, fontSize: '11px', fontWeight: 600,
                          background: STATUS_META[task.status].bg,
                          color: STATUS_META[task.status].color,
                          border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none',
                        }}
                      >
                        {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      {task.assignee ? <Avatar user={task.assignee} size={26} /> : (
                        <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>?</span>
                        </div>
                      )}
                      <button onClick={() => handleDelete(task)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, fontSize: 16, lineHeight: 1, opacity: 0, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                      >×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
      }
    </div>
  )
}

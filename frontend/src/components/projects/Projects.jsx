import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Users, CheckCircle2, MoreHorizontal, Trash2, Archive, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { Btn, Modal, Input, Textarea, EmptyState, Spinner, Avatar } from '../ui'
import { useAuthStore } from '../../store/authStore'
import AddMemberModal from './AddMemberModal'

const ICONS = ['🚀', '⚡', '🎯', '🔥', '💎', '🌟', '🛠️', '🎨', '📊', '🤖']
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#f5c542']

function CreateProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '🚀' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name required')
    setLoading(true)
    try {
      const { data } = await api.post('/projects/', form)
      toast.success('Project created!')
      onCreated(data)
      onClose()
      setForm({ name: '', description: '', color: '#6366f1', icon: '🚀' })
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create project')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Project" width={480}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Icon + Color picker */}
        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Icon & Color</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  style={{
                    width: 36, height: 36, borderRadius: 8, background: form.icon === ic ? 'var(--bg-4)' : 'var(--bg-3)',
                    border: form.icon === ic ? '2px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                }} />
            ))}
          </div>
        </div>
        <Input label="Project Name" placeholder="e.g. Website Redesign" value={form.name} onChange={set('name')} />
        <Textarea label="Description" placeholder="What's this project about?" value={form.description} onChange={set('description')} rows={2} />
        <Btn type="submit" loading={loading} style={{ alignSelf: 'flex-end' }}>Create Project</Btn>
      </form>
    </Modal>
  )
}

function ProjectCard({ project, onDelete, onAddMember, onClick }) {
  const { user } = useAuthStore()
  const pct = project.task_count > 0 ? Math.round((project.completed_count / project.task_count) * 100) : 0
  const [menu, setMenu] = useState(false)
  const isOwner = project.owner_id === user?.id || user?.role === 'admin'

  return (
    <div
      style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 0, overflow: 'hidden',
        transition: 'border-color 0.15s, transform 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Color bar */}
      <div style={{ height: 4, background: project.color }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: 24 }}>{project.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>{project.name}</div>
              {project.description && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: 2 }}>{project.description}</div>}
            </div>
          </div>
          {isOwner && (
            <div style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setMenu(v => !v) }}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <MoreHorizontal size={16} />
              </button>
              {menu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 100,
                  background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8,
                  minWidth: 160, overflow: 'hidden', boxShadow: 'var(--shadow)',
                }}
                  onBlur={() => setMenu(false)}
                >
                  <button onClick={e => { e.stopPropagation(); setMenu(false); onAddMember(project) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '13px' }}>
                    <UserPlus size={14} /> Add Member
                  </button>
                  <button onClick={e => { e.stopPropagation(); setMenu(false); onDelete(project) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '13px' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 12 }} onClick={onClick}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginBottom: 5 }}>
            <span>{project.completed_count}/{project.task_count} tasks</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-4)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: project.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Members */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={onClick}>
          <div style={{ display: 'flex' }}>
            {(project.members || []).slice(0, 4).map((m, i) => (
              <div key={m.id} title={m.full_name} style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-2)', borderRadius: '50%' }}>
                <Avatar user={m} size={24} />
              </div>
            ))}
          </div>
          {project.members?.length > 4 && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>+{project.members.length - 4}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [addMemberTarget, setAddMemberTarget] = useState(null)

  useEffect(() => {
    api.get('/projects/').then(r => setProjects(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/projects/${project.id}`)
      setProjects(ps => ps.filter(p => p.id !== project.id))
      toast.success('Project deleted')
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>

  return (
    <div style={{ padding: '28px 32px', flex: 1 }}>
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Projects</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: 2 }}>{projects.length} active project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>New Project</Btn>
      </div>

      {projects.length === 0
        ? <EmptyState icon="🚀" title="No projects yet" description="Create your first project to start tracking tasks" action={<Btn icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Create Project</Btn>} />
        : (
          <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={handleDelete}
                onAddMember={setAddMemberTarget}
                onClick={() => navigate(`/projects/${p.id}`)}
              />
            ))}
          </div>
        )}

      <CreateProjectModal
        open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={p => setProjects(ps => [p, ...ps])}
      />
      <AddMemberModal
        project={addMemberTarget}
        onClose={() => setAddMemberTarget(null)}
        onUpdated={updated => setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))}
      />
    </div>
  )
}

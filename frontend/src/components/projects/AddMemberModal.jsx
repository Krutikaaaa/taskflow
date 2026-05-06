import React, { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { Modal, Btn, Input, Avatar } from '../ui'

export default function AddMemberModal({ project, onClose, onUpdated }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post(`/projects/${project.id}/members`, { email })
      toast.success('Member added!')
      onUpdated(data)
      setEmail('')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add member')
    } finally { setLoading(false) }
  }

  const remove = async (userId) => {
    try {
      await api.delete(`/projects/${project.id}/members/${userId}`)
      const { data } = await api.get(`/projects/${project.id}`)
      onUpdated(data)
      toast.success('Member removed')
    } catch { toast.error('Failed to remove') }
  }

  return (
    <Modal open={!!project} onClose={onClose} title={`Members — ${project?.name}`} width={440}>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <Input placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} icon={<UserPlus size={14} />} />
        <Btn type="submit" loading={loading} style={{ flexShrink: 0 }}>Add</Btn>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(project?.members || []).map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8 }}>
            <Avatar user={m} size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.full_name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{m.email}</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>{m.role}</span>
            {m.id !== project?.owner_id && (
              <button onClick={() => remove(m.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', padding: 2 }}>
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}

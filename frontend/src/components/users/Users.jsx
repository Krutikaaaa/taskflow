import React, { useEffect, useState } from 'react'
import { Shield, ShieldOff, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { Avatar, Badge, Spinner } from '../ui'
import { fmtDateFull } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

export default function UsersPage() {
  const { user: me } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const toggleRole = async (user) => {
    if (user.id === me.id) return toast.error("Can't change your own role")
    const newRole = user.role === 'admin' ? 'member' : 'admin'
    try {
      const { data } = await api.patch(`/users/${user.id}/role?role=${newRole}`)
      setUsers(us => us.map(u => u.id === data.id ? data : u))
      toast.success(`${user.full_name} is now ${newRole}`)
    } catch { toast.error('Failed to update role') }
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={28} /></div>

  return (
    <div style={{ padding: '28px 32px', flex: 1 }}>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800 }}>Team</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: 2 }}>{users.length} member{users.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="fade-up-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(user => (
          <div key={user.id} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Avatar user={user} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{user.full_name}</span>
                {user.id === me.id && <span style={{ fontSize: '10px', color: 'var(--text-3)', background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 20 }}>You</span>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: 2 }}>{user.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 2 }}>Joined {fmtDateFull(user.created_at)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge
                label={user.role.toUpperCase()}
                color={user.role === 'admin' ? 'var(--accent-2)' : 'var(--text-3)'}
                bg={user.role === 'admin' ? 'var(--accent-glow)' : 'var(--bg-3)'}
              />
              {user.id !== me.id && (
                <button
                  onClick={() => toggleRole(user)}
                  title={user.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                  style={{
                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                    color: user.role === 'admin' ? 'var(--red)' : 'var(--accent)',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 500,
                    fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  }}
                >
                  {user.role === 'admin' ? <><ShieldOff size={13} /> Demote</> : <><Shield size={13} /> Promote</>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

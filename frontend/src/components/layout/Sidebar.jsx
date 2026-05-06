import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Zap, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui'

const NavItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px', borderRadius: 'var(--radius-sm)',
      textDecoration: 'none', fontSize: '14px', fontWeight: 500,
      color: isActive ? '#fff' : 'var(--text-2)',
      background: isActive ? 'var(--accent)' : 'transparent',
      transition: 'all 0.15s',
    })}
  >
    <Icon size={16} strokeWidth={2} />
    {label}
  </NavLink>
)

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const content = (
    <aside style={{
      width: 'var(--sidebar-width)', background: 'var(--bg-2)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', height: '100vh', position: 'sticky',
      top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px var(--accent-glow)',
        }}>
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em' }}>TaskFlow</span>
        {user?.role === 'admin' && (
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 6px', borderRadius: 20, marginLeft: 'auto' }}>ADMIN</span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-3)', padding: '8px 14px 4px', textTransform: 'uppercase' }}>Main</div>
        <NavItem to="/" end icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/projects" icon={FolderKanban} label="Projects" />
        <NavItem to="/tasks" icon={CheckSquare} label="My Tasks" />
        {user?.role === 'admin' && (
          <>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-3)', padding: '12px 14px 4px', textTransform: 'uppercase' }}>Admin</div>
            <NavItem to="/users" icon={Users} label="Team" />
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-3)' }}>
          <Avatar user={user} size={30} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <div className="sidebar-desktop">{content}</div>

      <button
        className="sidebar-toggle"
        onClick={() => setMobileOpen(v => !v)}
        style={{
          display: 'none', position: 'fixed', top: 12, left: 12, zIndex: 900,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 8, color: 'var(--text)', cursor: 'pointer',
        }}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', zIndex: 801 }}>
            {content}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-toggle { display: flex !important; }
        }
        nav a:hover { opacity: 0.85; }
      `}</style>
    </>
  )
}

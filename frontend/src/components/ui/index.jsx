import React from 'react'
import { initials } from '../../lib/utils'

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', loading, icon, className = '', ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer',
    border: 'none', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)' },
    danger: { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(255,95,109,0.2)' },
    subtle: { background: 'var(--bg-3)', color: 'var(--text)' },
  }
  const sizes = {
    sm: { padding: '5px 10px', fontSize: '13px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '11px 22px', fontSize: '15px' },
  }
  return (
    <button
      style={{ ...base, ...variants[variant], ...sizes[size], opacity: loading ? 0.6 : 1 }}
      className={className}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, icon, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex' }}>{icon}</span>}
        <input
          style={{
            width: '100%', padding: icon ? '9px 12px 9px 34px' : '9px 12px',
            background: 'var(--bg-3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            fontSize: '14px', fontFamily: 'var(--font-body)',
            transition: 'border-color 0.15s',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, error, rows = 3, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>}
      <textarea
        rows={rows}
        style={{
          width: '100%', padding: '9px 12px', resize: 'vertical',
          background: 'var(--bg-3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', color: 'var(--text)',
          fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, children, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>}
      <select
        style={{
          width: '100%', padding: '9px 12px',
          background: 'var(--bg-3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', color: 'var(--text)',
          fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
        }}
        {...props}
      >{children}</select>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 20, fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em',
      color, background: bg,
    }}>{label}</span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ user, size = 32 }) {
  if (!user) return null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: user.avatar_color || '#6366f1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      flexShrink: 0, fontFamily: 'var(--font-display)',
    }}>
      {initials(user.full_name)}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >{children}</div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border-bright)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.2s ease',
      }}>
        {title && (
          <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
        )}
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${color}30`,
      borderTop: `2px solid ${color}`, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-2)' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: 20 }}>{description}</div>}
      {action}
    </div>
  )
}

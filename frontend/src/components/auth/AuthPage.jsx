import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { Btn, Input } from '../ui'

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const { login, signup } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Required'
    if (!form.password || form.password.length < 8) errs.password = 'Min 8 characters'
    if (mode === 'signup' && !form.full_name.trim()) errs.full_name = 'Required'
    setErrors(errs)
    return !Object.keys(errs).length
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        await signup(form.email, form.full_name, form.password)
        toast.success('Account created!')
      }
      navigate('/')
    } catch (err) {
      // Show the most useful error message possible
      if (!err.response) {
        toast.error('Cannot reach server. Is the backend running on port 8000?')
      } else if (err.response.status === 422) {
        const detail = err.response.data?.detail
        if (Array.isArray(detail)) {
          toast.error(detail.map(d => d.msg).join(', '))
        } else {
          toast.error(String(detail) || 'Validation error')
        }
      } else {
        toast.error(err.response.data?.detail || `Error ${err.response.status}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden', background: 'var(--bg)',
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 0 32px var(--accent-glow)',
          }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your TaskFlow account'}
          </p>
        </div>

        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <Input
                label="Full Name" placeholder="Jane Smith"
                value={form.full_name} onChange={set('full_name')}
                error={errors.full_name} icon={<User size={14} />}
              />
            )}
            <Input
              label="Email" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')}
              error={errors.email} icon={<Mail size={14} />}
            />
            <div style={{ position: 'relative' }}>
              <Input
                label="Password" type={showPass ? 'text' : 'password'}
                placeholder="••••••••" value={form.password} onChange={set('password')}
                error={errors.password} icon={<Lock size={14} />}
              />
              <button
                type="button" onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, bottom: errors.password ? 26 : 8,
                  background: 'none', border: 'none', color: 'var(--text-3)',
                  cursor: 'pointer', display: 'flex',
                }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <Btn type="submit" loading={loading} size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Btn>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '13px', color: 'var(--text-2)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Link
            to={mode === 'login' ? '/signup' : '/login'}
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}

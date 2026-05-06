import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/layout/Sidebar'
import AuthPage from './components/auth/AuthPage'
import Dashboard from './components/dashboard/Dashboard'
import Projects from './components/projects/Projects'
import ProjectDetail from './components/projects/ProjectDetail'
import Tasks from './components/tasks/Tasks'
import UsersPage from './components/users/Users'
import { Spinner } from './components/ui'

function ProtectedLayout({ children }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}

function AdminRoute({ children }) {
  const { user } = useAuthStore()
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { init, loading, user } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Spinner size={36} />
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage mode="login" />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <AuthPage mode="signup" />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
      <Route path="/projects/:id" element={<ProtectedLayout><ProjectDetail /></ProtectedLayout>} />
      <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout><AdminRoute><UsersPage /></AdminRoute></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-3)',
            color: 'var(--text)',
            border: '1px solid var(--border-bright)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-3)' } },
          error: { iconTheme: { primary: 'var(--red)', secondary: 'var(--bg-3)' } },
        }}
      />
    </BrowserRouter>
  )
}

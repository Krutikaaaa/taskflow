import { create } from 'zustand'
import api from '../lib/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { set({ loading: false }); return }
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data, loading: false })
    } catch {
      localStorage.clear()
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    // throws on error — caught in component
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ user: data.user })
    return data.user
  },

  signup: async (email, full_name, password) => {
    // throws on error — caught in component
    const { data } = await api.post('/auth/signup', { email, full_name, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ user: data.user })
    return data.user
  },

  logout: () => {
    localStorage.clear()
    set({ user: null })
  },

  updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),
}))

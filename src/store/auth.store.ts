import { create } from 'zustand'
import type { AdminUser } from '@/types'

const LEGACY_TOKEN_KEY = 'sfo-admin-token'

interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  setUser: (user: AdminUser) => void
  setBootstrapping: (bootstrapping: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  setUser: (user) => {
    set({ user, isAuthenticated: true, isBootstrapping: false })
  },
  setBootstrapping: (isBootstrapping) => set({ isBootstrapping }),
  clear: () => {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    set({ user: null, isAuthenticated: false, isBootstrapping: false })
  },
}))

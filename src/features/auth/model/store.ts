import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  uuid: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  type?: 'microsoft' | 'offline'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 액션
  setUser: (user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  refreshToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          error: null,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      refreshToken: async () => {
        const { user, setUser } = get()
        if (!user?.refreshToken || user.type !== 'microsoft') return false

        try {
          const result = await window.electronAPI?.auth.refreshToken(user.refreshToken)
          if (result?.success && result.user) {
            setUser(result.user)
            return true
          }
          get().logout()
          return false
        } catch (error) {
          get().logout()
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

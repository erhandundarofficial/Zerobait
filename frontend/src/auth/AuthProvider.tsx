import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type AuthUser = {
  id: string
  username: string | null
  email: string | null
  score: number
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('zb_token')
    const u = localStorage.getItem('zb_user')
    if (t) setToken(t)
    if (u) {
      try {
        setUser(JSON.parse(u) as AuthUser)
      } catch {
        setUser(null)
      }
    }
    setLoading(false)
    if (t) {
      // refresh user from server if token exists
      fetch('http://localhost:4000/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(async (res) => {
          const data = await res.json()
          if (res.ok && data.user) {
            setUser(data.user as AuthUser)
            localStorage.setItem('zb_user', JSON.stringify(data.user))
          }
        })
        .catch(() => {})
    }
  }, [])

  // fetchMe used on mount via inline fetch; skip defining to reduce unused warnings

  const login = async (username: string, password: string) => {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('zb_token', data.token)
    localStorage.setItem('zb_user', JSON.stringify(data.user))
  }

  const register = async (username: string, password: string, email?: string) => {
    const res = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('zb_token', data.token)
    localStorage.setItem('zb_user', JSON.stringify(data.user))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('zb_token')
    localStorage.removeItem('zb_user')
  }

  const value: AuthContextValue = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

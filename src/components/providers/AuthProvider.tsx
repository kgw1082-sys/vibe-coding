'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { PublicUser } from '@/lib/auth'

interface AuthContextValue {
  user: PublicUser | null
  loading: boolean
  token: string | null
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  token: null,
  logout: async () => {},
  refresh: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const storedToken = typeof window !== 'undefined'
        ? localStorage.getItem('auth-token')
        : null
      const headers: HeadersInit = storedToken
        ? { Authorization: `Bearer ${storedToken}` }
        : {}
      const res = await fetch('/api/auth/me', { headers })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        if (storedToken) setToken(storedToken)
      } else {
        setUser(null)
        setToken(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    const storedToken = localStorage.getItem('auth-token')
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
    })
    localStorage.removeItem('auth-token')
    setUser(null)
    setToken(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, token, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  employeeNumber: string
  employeeName: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (employeeNumber: string, password: string) => Promise<void>
  signup: (employeeNumber: string, employeeName: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 初回ロード時に認証状態を確認
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (employeeNumber: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeNumber, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'ログインに失敗しました')
    }

    const data = await res.json()
    setUser(data.user)
  }

  const signup = async (
    employeeNumber: string,
    employeeName: string,
    password: string
  ) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeNumber, employeeName, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'ユーザー登録に失敗しました')
    }

    const data = await res.json()
    setUser(data.user)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

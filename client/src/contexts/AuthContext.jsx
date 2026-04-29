import { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../lib/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('nexus_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiClient.get('/api/auth/me', token)
        .then(data => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('nexus_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await apiClient.post('/api/auth/login', { email, password })
    localStorage.setItem('nexus_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const register = async (username, email, password, displayName) => {
    const data = await apiClient.post('/api/auth/register', { username, email, password, displayName })
    localStorage.setItem('nexus_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const updateUser = async (profileData) => {
    const data = await apiClient.patch('/api/auth/profile', profileData, token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('nexus_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

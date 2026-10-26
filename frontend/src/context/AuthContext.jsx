import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../services'
import { realApi } from '../services/realApi'
import { tokenStore } from '../services/http'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('ps_user')) } catch { return null } })

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem('ps_user')
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('ps:unauthorized', logout)
    return () => window.removeEventListener('ps:unauthorized', logout)
  }, [logout])

  const startSession = (res) => {
    tokenStore.set(res.access_token)
    localStorage.setItem('ps_user', JSON.stringify(res.user))
    setUser(res.user)
    return res.user
  }

  const login = async (email, password) => startSession(await api.login(email, password))

  // Registration always uses the real backend (never the mock layer).
  const register = async (payload) => startSession(await realApi.register(payload))

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>
}
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, hasToken, setToken } from './api'
import { getJson, removeKey, setJson } from './storage'

const USER_KEY = 'deepweed.user'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // The signed-in user is cached, so the app still knows who you are with no connection.
  // Only a real "401 not authorised" from the server signs you out - never a missing connection.
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!hasToken()) { setLoading(false); return }
      const cached = await getJson(USER_KEY, null)
      if (cached && alive) { setUser(cached); setLoading(false) }
      try {
        const fresh = await api.me()
        if (alive) setUser(fresh)
        await setJson(USER_KEY, fresh)
      } catch (e) {
        if (e?.status === 401) { await setToken(null); await removeKey(USER_KEY); if (alive) setUser(null) }
      } finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login({ email, password })
    await setToken(token); setUser(user); await setJson(USER_KEY, user)
  }, [])
  const register = useCallback(async (form) => {
    const { token, user } = await api.register(form)
    await setToken(token); setUser(user); await setJson(USER_KEY, user)
  }, [])
  const logout = useCallback(async () => { await setToken(null); await removeKey(USER_KEY); setUser(null) }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

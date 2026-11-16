import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { useAuth } from './auth'

// Number shown on the Account tab: admins = new feedback, farmers = unread replies.
const Ctx = createContext({ count: 0, refresh: () => {} })
export const useBadge = () => useContext(Ctx)

export function BadgeProvider({ children }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    if (!user) { setCount(0); return }
    const p = user.role === 'admin'
      ? api.feedbackSummary().then((s) => s.pending)
      : api.myFeedback().then((l) => l.filter((f) => f.replied_at && !f.reply_seen_at).length)
    p.then(setCount).catch(() => {})
  }, [user])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60000)
    return () => clearInterval(id)
  }, [refresh])

  const value = useMemo(() => ({ count, refresh }), [count, refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

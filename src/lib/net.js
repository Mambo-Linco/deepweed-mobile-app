import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useAuth } from './auth'
import { flushOutbox, outboxCount, subscribeOutbox } from './outbox'
import { syncHerbicides } from './herbicideCache'

// online = the phone has a network connection (Wi-Fi or mobile data). Failed requests are still handled one by one.
const Ctx = createContext({ online: true, pending: 0 })
export const useNet = () => useContext(Ctx)

export function NetProvider({ children }) {
  const { user } = useAuth()
  const [online, setOnline] = useState(true)
  const [pending, setPending] = useState(0)

  useEffect(() => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)), [])
  useEffect(() => { outboxCount().then(setPending); return subscribeOutbox(setPending) }, [])

  // whenever we (re)gain a connection, the app starts, the user signs in, or the app comes to the foreground:
  // send what was saved offline and refresh the herbicide data
  useEffect(() => {
    const sync = () => { flushOutbox().catch(() => {}); syncHerbicides().catch(() => {}) }
    if (online) sync()
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') sync() })
    return () => sub.remove()
  }, [online, user?.id])

  const value = useMemo(() => ({ online, pending }), [online, pending])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

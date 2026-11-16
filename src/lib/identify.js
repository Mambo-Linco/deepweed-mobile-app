import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// State of one identification run across the Identify stack screens.
const Ctx = createContext(null)
export const useIdentify = () => useContext(Ctx)
const initial = { photo: null, result: null, crop: '', feedbackDone: false, feedbackQueued: false, localId: null }

export function IdentifyProvider({ children }) {
  const [state, setState] = useState(initial)
  const setPhoto = useCallback((photo) => setState((s) => ({ ...initial, crop: s.crop, photo })), [])
  const patch = useCallback((p) => setState((s) => ({ ...s, ...p })), [])
  const reset = useCallback(() => setState((s) => ({ ...initial, crop: s.crop })), [])
  const value = useMemo(() => ({ ...state, setPhoto, patch, reset }), [state, setPhoto, patch, reset])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

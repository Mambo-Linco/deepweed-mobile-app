import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import en from '../locales/en.json'
import sn from '../locales/sn.json'
import nd from '../locales/nd.json'

const DICTS = { en, sn, nd }
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sn', label: 'chiShona' },
  { code: 'nd', label: 'isiNdebele' },
]
const KEY = 'deepweed.lang'

export async function loadLang() {
  try {
    const saved = await SecureStore.getItemAsync(KEY)
    return saved && DICTS[saved] ? saved : 'en'
  } catch { return 'en' }
}

const interpolate = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : s)

const Ctx = createContext(null)
export const useI18n = () => useContext(Ctx)

export function I18nProvider({ initial = 'en', children }) {
  const [lang, setLangState] = useState(initial)

  const setLang = useCallback((code) => {
    if (!DICTS[code]) return
    setLangState(code)
    SecureStore.setItemAsync(KEY, code).catch(() => {})
  }, [])

  const value = useMemo(() => {
    const dict = DICTS[lang]
    const t = (key, vars) => interpolate(dict[key] ?? en[key] ?? key, vars)
    // plural helper: base.none (n = 0, if defined) / base.one / base.other
    const tn = (base, n, vars) => {
      const suffix = n === 0 && en[`${base}.none`] ? 'none' : n === 1 ? 'one' : 'other'
      return t(`${base}.${suffix}`, { n, ...vars })
    }
    // errors from api.js carry an i18n key; server messages are shown as sent
    const errText = (e) => (e?.key ? t(e.key, e.params) : e?.message || t('err.generic'))
    // crop values are stored in English ("Maize", "All crops"); only the label is translated
    const cropLabel = (c) => {
      if (!c) return ''
      if (c === 'All crops') return t('crop.all')
      const k = `crop.${c}`
      return dict[k] ?? en[k] ?? c
    }
    return { lang, setLang, t, tn, errText, cropLabel }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

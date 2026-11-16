import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert as RNAlert, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Alert, Button, Field, H1, Lead, Muted, Screen } from '../components/UI'
import HerbicideCard from '../components/HerbicideCard'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { getHerbicideCache, syncHerbicides } from '../lib/herbicideCache'

// Cache-first: the list is read from the phone, then refreshed from the server when there is a connection.
export default function Herbicides({ navigation, route }) {
  const { t, errText, lang } = useI18n()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [q, setQ] = useState('')
  const [items, setItems] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [tick, setTick] = useState(0)

  useFocusEffect(useCallback(() => { setTick((n) => n + 1) }, []))

  useEffect(() => {
    const n = route.params?.notice
    if (n) { setNotice(n); navigation.setParams({ notice: undefined }) }
  }, [route.params?.notice, navigation])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const cached = await getHerbicideCache()
      if (!alive) return
      setItems(cached.items); setUpdatedAt(cached.updated_at)
      try {
        const fresh = await syncHerbicides()
        if (alive) { setItems(fresh.items); setUpdatedAt(fresh.updated_at); setOffline(false) }
      } catch { if (alive) setOffline(true) }
    })()
    return () => { alive = false }
  }, [tick])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!items) return null
    if (!needle) return items
    return items.filter((h) => [h.weed_name, h.herbicide_name, h.crop, h.active_ingredient].some((v) => (v || '').toLowerCase().includes(needle)))
  }, [items, q])

  function confirmDelete(h) {
    RNAlert.alert(t('herbadmin.confirmDelete', { name: h.herbicide_name }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: () => api.deleteHerbicide(h.id).then(() => { setNotice('herbadmin.deleted'); setTick((n) => n + 1) }).catch((e) => setError(e)),
      },
    ])
  }

  const date = updatedAt ? new Date(updatedAt).toLocaleString(lang === 'en' ? undefined : lang) : t('offline.herbNever')

  return (
    <Screen>
      <H1>{t('herbinfo.title')}</H1>
      <Lead>{t('herbinfo.lead')}</Lead>
      {isAdmin
        ? <Button title={`+ ${t('herbadmin.add')}`} onPress={() => (offline ? setError({ key: 'offline.needsInternet' }) : navigation.navigate('HerbicideForm'))} />
        : <Muted>{t('herbadmin.signInHint')}</Muted>}
      <Field label={t('herbinfo.searchLabel')} placeholder={t('herbinfo.search')} value={q} onChangeText={setQ} returnKeyType="search" />
      <Muted>{t('offline.herbUpdated', { date })}{items ? ` · ${t('offline.records', { n: items.length })}` : ''}</Muted>
      {offline && !!items?.length && <Alert kind="warn">{t('offline.showingSaved')}</Alert>}
      {!updatedAt && <Alert kind="warn">{t('offline.noHerbData')}</Alert>}
      {!!notice && <Alert kind="info">{t(notice)}</Alert>}
      {!!error && <Alert>{errText(error)}</Alert>}
      {shown && !shown.length && !!updatedAt && <Muted>{t('herbinfo.none', { q })}</Muted>}
      {shown && shown.length > 0 && <Muted>{t('herbinfo.dataNote')}</Muted>}
      <View>
        {(shown || []).map((h) => (
          <HerbicideCard key={h.id} h={h} showWeed admin={isAdmin} onEdit={(rec) => (offline ? setError({ key: 'offline.needsInternet' }) : navigation.navigate('HerbicideForm', { record: rec }))} onDelete={confirmDelete} />
        ))}
      </View>
    </Screen>
  )
}

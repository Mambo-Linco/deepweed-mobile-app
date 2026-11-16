import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Field, Lead, Muted, Screen } from '../components/UI'
import { defaultBaseUrl, getBaseUrl, setBaseUrl } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useNet } from '../lib/net'
import { modelInfo, isOnDeviceAvailable } from '../lib/classifier'
import { getHerbicideCache, syncHerbicides } from '../lib/herbicideCache'
import { flushOutbox } from '../lib/outbox'

export default function Settings() {
  const { t, lang } = useI18n()
  const { pending } = useNet()
  const [url, setUrl] = useState(getBaseUrl())
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(null)
  const [model, setModel] = useState('offline.modelMissing')
  const [herb, setHerb] = useState({ items: [], updated_at: null })
  const [syncMsg, setSyncMsg] = useState('')

  const refreshInfo = useCallback(async () => {
    const info = modelInfo()
    if (!info.installed) setModel('offline.modelMissing')
    else if (!info.nativeModule) setModel('offline.modelNoNative')
    else setModel((await isOnDeviceAvailable()) ? 'offline.modelReady' : 'offline.modelFailed')
    setHerb(await getHerbicideCache())
  }, [])
  useEffect(() => { refreshInfo() }, [refreshInfo])

  async function save() { await setBaseUrl(url); setUrl(getBaseUrl()); setMsg(t('set.saved')); setOk(null) }
  async function test() {
    setMsg(t('set.testing')); setOk(null)
    try {
      const r = await fetch(`${url.trim().replace(/\/$/, '')}/api/predict/status`)
      const j = await r.json()
      setOk(j.status === 'ok'); setMsg(j.status === 'ok' ? t('set.ok') : t('set.noModel', { s: j.status }))
    } catch { setOk(false); setMsg(t('set.unreachable')) }
  }
  async function syncAll() {
    setSyncMsg(t('set.testing'))
    try { await flushOutbox() } catch { /* offline */ }
    try { await syncHerbicides(); setSyncMsg(t('offline.synced')) } catch { setSyncMsg(t('set.unreachable')) }
    refreshInfo()
  }

  const date = herb.updated_at ? new Date(herb.updated_at).toLocaleString(lang === 'en' ? undefined : lang) : t('offline.herbNever')

  return (
    <Screen>
      <Card>
        <Muted style={{ fontWeight: '800', color: '#1f4a3f', fontSize: 16 }}>{t('offline.modelStatus')}</Muted>
        <Alert kind={model === 'offline.modelReady' ? 'info' : 'warn'}>{t(model)}</Alert>
        <Muted>{t('offline.herbUpdated', { date })} · {t('offline.records', { n: herb.items.length })}</Muted>
        <Muted>{t('offline.pending', { n: pending })}</Muted>
        <Button title={`${t('offline.syncNow')} / ${t('offline.updateHerb')}`} variant="outline" onPress={syncAll} />
        {!!syncMsg && <Muted>{syncMsg}</Muted>}
      </Card>

      <Lead>{t('set.lead')}</Lead>
      <Card>
        <Field label={t('set.url')} value={url} onChangeText={setUrl} keyboardType="url" autoCorrect={false} />
        <Button title={t('common.save')} onPress={save} />
        <Button title={t('set.test')} variant="outline" onPress={test} />
        <Button title={t('set.default')} variant="ghost" onPress={() => setUrl(defaultBaseUrl())} />
        {!!msg && (ok === false ? <Alert>{msg}</Alert> : <Alert kind={ok ? 'info' : 'warn'}>{msg}</Alert>)}
      </Card>
      <Muted>{t('set.default2', { url: defaultBaseUrl() })}</Muted>
    </Screen>
  )
}

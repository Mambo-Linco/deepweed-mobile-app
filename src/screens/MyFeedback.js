import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Alert, Button, Card, Field, H1, Lead, Muted, Screen } from '../components/UI'
import { FeedbackBody, Pill, ReplyBox, StatusPill } from '../components/FeedbackCommon'
import { colors } from '../theme'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useBadge } from '../lib/badge'
import { getJson, setJson } from '../lib/storage'
import { listOutbox, submitOrQueue } from '../lib/outbox'

const CACHE_KEY = 'deepweed.myFeedback'

// Farmer: send a message to the administrators and read their replies. Works offline: messages wait, the last list is kept.
export default function MyFeedback() {
  const { t, errText, lang } = useI18n()
  const { refresh } = useBadge()
  const [items, setItems] = useState(null)
  const [waiting, setWaiting] = useState([])
  const [offline, setOffline] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(null)
  const fmt = (d) => new Date(d).toLocaleString(lang === 'en' ? undefined : lang)

  const load = useCallback(async () => {
    setWaiting((await listOutbox()).filter((i) => i.type === 'message'))
    try {
      const list = await api.myFeedback()
      setItems(list); setOffline(false); setError(null)
      await setJson(CACHE_KEY, list)
      // viewing the replies = reading them
      const unread = list.filter((f) => f.replied_at && !f.reply_seen_at)
      if (unread.length) { await Promise.all(unread.map((f) => api.markReplySeen(f.id).catch(() => null))); refresh() }
    } catch (e) {
      const cached = await getJson(CACHE_KEY, null)
      if (cached) { setItems(cached); setOffline(true) } else setError(e)
    }
  }, [refresh])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function send() {
    if (!text.trim()) return
    setBusy(true); setError(null); setNotice('')
    try {
      const { queued } = await submitOrQueue({ type: 'message', message: text.trim() })
      setText(''); setNotice(queued ? t('offline.queued') : t('fbk.newSent')); load()
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  return (
    <Screen>
      <H1>{t('fbk.title.mine')}</H1>
      <Lead>{t('fbk.lead.mine')}</Lead>
      <Card>
        <Text style={{ fontWeight: '800', color: colors.green, fontSize: 17 }}>{t('fbk.newTitle')}</Text>
        <Field label={t('fbk.yourMessage')} value={text} onChangeText={setText} placeholder={t('fbk.newPlaceholder')} multiline maxLength={2000} autoCapitalize="sentences" style={{ minHeight: 90, textAlignVertical: 'top' }} />
        <Button title={t('fbk.newSend')} onPress={send} loading={busy} disabled={!text.trim()} />
      </Card>
      {!!notice && <Alert kind="info">{notice}</Alert>}
      {offline && <Alert kind="warn">{t('offline.cachedNote')}</Alert>}
      {!!error && <Alert>{errText(error)}</Alert>}
      {waiting.map((w) => (
        <Card key={w.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Muted style={{ flex: 1 }}>{t('fbk.sentOn', { date: fmt(w.queued_at) })}</Muted>
            <Pill kind="pending" label={t('offline.waitingSync')} />
          </View>
          <Text style={{ color: colors.ink, fontSize: 15 }}>{w.message}</Text>
        </Card>
      ))}
      {items && !items.length && !waiting.length && <Muted>{t('fbk.empty')}</Muted>}
      {(items || []).map((f) => (
        <Card key={f.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Muted style={{ flex: 1 }}>{t('fbk.sentOn', { date: fmt(f.created_at) })}</Muted>
            {f.replied_at && !f.reply_seen_at && <Pill kind="pending" label={t('fbk.newReply')} />}
            <StatusPill status={f.status} />
          </View>
          <FeedbackBody f={f} mine />
          {f.admin_note ? <ReplyBox label={`${t('fbk.adminReply')}${f.replied_at ? ` · ${fmt(f.replied_at)}` : ''}`} text={f.admin_note} /> : <Muted>{t('fbk.noReply')}</Muted>}
        </Card>
      ))}
    </Screen>
  )
}

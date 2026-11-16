import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Alert, Button, Card, Field, Muted, Screen } from '../components/UI'
import { FeedbackBody, ReplyBox, StatusPill } from '../components/FeedbackCommon'
import { colors } from '../theme'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useBadge } from '../lib/badge'

// Admin: read one farmer's feedback and reply. Opening it marks new feedback as reviewed.
export default function FeedbackDetail({ route }) {
  const { t, errText, lang } = useI18n()
  const { refresh } = useBadge()
  const [f, setF] = useState(route.params.item)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(null)
  const fmt = (d) => new Date(d).toLocaleString(lang === 'en' ? undefined : lang)

  useEffect(() => {
    if (route.params.item.status === 'pending') {
      api.updateFeedback(route.params.item.id, { status: 'reviewed' })
        .then((u) => { setF((x) => ({ ...x, ...u })); refresh() }).catch(() => {})
    }
  }, [route.params.item, refresh])

  async function send() {
    if (!reply.trim()) return
    setBusy(true); setError(null); setNotice('')
    try {
      const u = await api.updateFeedback(f.id, { reply: reply.trim() })
      setF((x) => ({ ...x, ...u })); setReply(''); setNotice(t('fbk.replySent')); refresh()
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  async function setStatus(status) {
    try { const u = await api.updateFeedback(f.id, { status }); setF((x) => ({ ...x, ...u })); refresh() } catch (e) { setError(e) }
  }

  return (
    <Screen>
      <Card>
        <View style={styles.head}>
          <Text style={styles.name}>{f.farmer_name}</Text>
          <StatusPill status={f.status} />
        </View>
        <Muted>{f.farmer_email} · {fmt(f.created_at)}</Muted>
        <View style={{ marginTop: 10 }}><FeedbackBody f={f} /></View>
        {!!f.admin_note && <ReplyBox label={`${t('fbk.yourReply')}${f.replied_at ? ` · ${fmt(f.replied_at)}` : ''}`} text={f.admin_note} />}
      </Card>

      <Field label={t('fbk.reply')} value={reply} onChangeText={setReply} placeholder={t('fbk.replyPlaceholder')} multiline maxLength={2000} autoCapitalize="sentences" style={{ minHeight: 100, textAlignVertical: 'top' }} />
      {!!notice && <Alert kind="info">{notice}</Alert>}
      {!!error && <Alert>{errText(error)}</Alert>}
      <Button title={t('fbk.sendReply')} onPress={send} loading={busy} disabled={!reply.trim()} />
      {f.status !== 'resolved'
        ? <Button title={t('fbk.markResolved')} variant="outline" onPress={() => setStatus('resolved')} />
        : <Button title={t('fbk.reopen')} variant="ghost" onPress={() => setStatus('reviewed')} />}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.green },
})

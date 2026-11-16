import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Alert, Button, Card, Chips, H1, Lead, Muted, Screen } from '../components/UI'
import { Pill, StatusPill } from '../components/FeedbackCommon'
import { colors } from '../theme'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useBadge } from '../lib/badge'

const FILTERS = ['', 'pending', 'reviewed', 'resolved']

// Admin: all farmer feedback. Tap an item to read it and reply.
export default function FeedbackInbox({ navigation }) {
  const { t, errText, lang } = useI18n()
  const { refresh } = useBadge()
  const [filter, setFilter] = useState('')
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const fmt = (d) => new Date(d).toLocaleString(lang === 'en' ? undefined : lang)

  const load = useCallback((f = filter) => {
    api.feedbackInbox(f).then((d) => { setItems(d); setError(null) }).catch(setError)
    refresh()
  }, [filter, refresh])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <Screen>
      <H1>{t('fbk.title.admin')}</H1>
      <Lead>{t('fbk.lead.admin')}</Lead>
      <Chips options={FILTERS} value={filter} onChange={(f) => { setFilter(f); setItems(null) }} labelOf={(f) => t(f ? `fbk.s.${f}` : 'fbk.filter.all')} />
      <Button title={t('fbk.refresh')} variant="ghost" onPress={() => load()} />
      {!!error && <Alert>{errText(error)}</Alert>}
      {items && !items.length && <Muted>{t('fbk.empty')}</Muted>}
      {(items || []).map((f) => (
        <Pressable key={f.id} onPress={() => navigation.navigate('FeedbackDetail', { item: f })} accessibilityRole="button">
          <Card style={f.status === 'pending' ? styles.unread : null}>
            <View style={styles.head}>
              <Text style={styles.name} numberOfLines={1}>{f.farmer_name}</Text>
              {!!f.replied_at && <Pill kind="replied" label={`${t('fbk.reply')} ✓`} />}
              <StatusPill status={f.status} />
            </View>
            <Muted>{f.farmer_email} · {fmt(f.created_at)}</Muted>
            <Text style={styles.preview} numberOfLines={2}>{f.is_correct === true ? '✓ ' : f.is_correct === false ? '✗ ' : ''}{f.message}</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  unread: { borderLeftWidth: 5, borderLeftColor: colors.rust },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.green },
  preview: { color: colors.ink, marginTop: 6, fontSize: 15 },
})

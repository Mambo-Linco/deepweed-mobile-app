import { StyleSheet, Text, View } from 'react-native'
import { Muted } from './UI'
import { colors } from '../theme'
import { useI18n } from '../lib/i18n'
import { displayName } from '../lib/names'
import { confPct, isDefaultMessage } from '../lib/feedbackText'

const PILL = {
  pending: { bg: colors.rust, fg: '#fff' },
  reviewed: { bg: '#cfdcc4', fg: colors.ink },
  resolved: { bg: colors.green, fg: '#fff' },
  replied: { bg: '#dfe9d6', fg: colors.green },
}

export function Pill({ kind, label }) {
  const c = PILL[kind] || PILL.reviewed
  return <View style={[styles.pill, { backgroundColor: c.bg }]}><Text style={[styles.pillText, { color: c.fg }]}>{label}</Text></View>
}

export function StatusPill({ status }) {
  const { t } = useI18n()
  return <Pill kind={status} label={t(`fbk.s.${status}`)} />
}

// Verdict, suggested species, message and the scan a feedback item refers to.
export function FeedbackBody({ f, mine = false }) {
  const { t, cropLabel } = useI18n()
  return (
    <View>
      {f.is_correct !== null && f.is_correct !== undefined && (
        <Text style={[styles.verdict, { color: f.is_correct ? colors.green2 : colors.danger }]}>{f.is_correct ? '✓ ' : '✗ '}{t(f.is_correct ? 'fbk.correct' : 'fbk.incorrect')}</Text>
      )}
      {!!f.corrected_weed_name && <Text style={styles.strong}>{t(mine ? 'fbk.suggestedMine' : 'fbk.suggested', { name: displayName(f.corrected_weed_name) })}</Text>}
      {!isDefaultMessage(f.message) && <Text style={styles.msg}>{f.message}</Text>}
      {!!f.scan_weed_name && <Muted>{t('fbk.scanLine', { weed: displayName(f.scan_weed_name), pct: confPct(f.scan_confidence), crop: cropLabel(f.scan_crop_type) })}</Muted>}
    </View>
  )
}

export function ReplyBox({ label, text }) {
  return (
    <View style={styles.reply}>
      <Muted style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>{label}</Muted>
      <Text style={styles.msg}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  pillText: { fontSize: 12, fontWeight: '800' },
  verdict: { fontWeight: '800', marginBottom: 6 },
  strong: { fontWeight: '700', color: colors.ink, marginBottom: 4 },
  msg: { color: colors.ink, fontSize: 15, lineHeight: 21, marginVertical: 4 },
  reply: { backgroundColor: '#e9efdd', borderRadius: 12, padding: 12, marginVertical: 10 },
})

import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Alert, Button, Card, Chips, Eyebrow, Field, H1, H2, Muted, Screen } from '../components/UI'
import { colors } from '../theme'
import { useIdentify } from '../lib/identify'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { submitOrQueue } from '../lib/outbox'
import { parseSpecies } from '../lib/names'
import HerbicideCard from '../components/HerbicideCard'

export function HerbicideCards({ list }) {
  const { t } = useI18n()
  if (!list.length) {
    return (
      <Card>
        <Text style={{ fontWeight: '700', color: colors.ink }}>{t('results.noneTitle')}</Text>
        <Muted style={{ marginTop: 4 }}>{t('results.noneBodyMobile')}</Muted>
      </Card>
    )
  }
  return list.map((h) => <HerbicideCard key={h.id} h={h} />)
}

export default function Results({ navigation }) {
  const { result, crop, feedbackDone, feedbackQueued, localId, patch, reset } = useIdentify()
  const { user } = useAuth()
  const { t, errText } = useI18n()
  const [tab, setTab] = useState(0)
  const [verdict, setVerdict] = useState(null)
  const [choice, setChoice] = useState('unsure')
  const [other, setOther] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scanId, setScanId] = useState(null)

  if (!result) return <Screen><Muted>{t('matches.noResult')}</Muted><Button title={t('matches.startOver')} onPress={() => navigation.popToTop()} /></Screen>
  const top = result.top3[0]
  const m = result.top3[tab]
  const s = parseSpecies(m.class_name)
  const wrongOptions = ['unsure', ...result.top3.slice(1).map((x) => x.class_name), 'other']
  const labelOf = (o) => (o === 'unsure' ? t('fb.notSureShort') : o === 'other' ? t('fb.else') : parseSpecies(o).common)

  // 13-17: submitFeedback -> storeFeedback -> saveToDatabase -> confirmation.
  // With no connection the feedback is kept on the phone and sent automatically later.
  async function submit() {
    setBusy(true); setError('')
    const item = {
      type: 'feedback',
      local_id: localId,
      scan_id: scanId || undefined,
      scan: {
        weed_name: top.class_name,
        confidence: top.confidence,
        crop_type: crop || user?.primary_crop || 'Unknown',
        recommendations: top.herbicides.map((h) => `${h.herbicide_name} — ${h.dosage}`),
        top3: result.top3.map((x) => ({ class_name: x.class_name, confidence: x.confidence })),
      },
      feedback: {
        is_correct: verdict,
        corrected_weed_name: (verdict === false && (choice === 'other' ? other.trim() : choice === 'unsure' ? '' : choice)) || undefined,
        message: note.trim() || undefined,
      },
    }
    try {
      const { queued } = await submitOrQueue(item)
      patch({ feedbackDone: true, feedbackQueued: queued })
    } catch (e) { setError(errText(e)) } finally {
      if (item.scan_id) setScanId(item.scan_id)
      setBusy(false)
    }
  }

  return (
    <Screen>
      <Eyebrow num="06">{t('results.eyebrow')}</Eyebrow>
      <H1>{parseSpecies(top.class_name).common}</H1>
      {result.source === 'device' && <Muted>{t('offline.onDevice')}</Muted>}
      <Muted style={{ fontSize: 16, marginBottom: 8 }}>{t('results.best', { pct: top.confidence.toFixed(1) })}{result.low_confidence ? ` — ${t('results.low')}` : ''}.</Muted>

      <Chips options={[0, 1, 2]} value={tab} onChange={setTab} labelOf={(i) => `${i + 1}. ${parseSpecies(result.top3[i].class_name).common}`} />
      <H2 style={{ marginTop: 10 }}>{s.common}</H2>
      {!!(s.detail || s.local) && <Muted>{[s.detail, s.local].filter(Boolean).join(' · ')}</Muted>}

      <H2 style={{ marginTop: 16 }}>{t('results.herbTitle')}</H2>
      {result.herbicide_data_missing && <Alert kind="warn">{t('offline.noHerbData')}</Alert>}
      <HerbicideCards list={m.herbicides} />
      <Alert kind="info">{t('results.guidance')}</Alert>

      <Card>
        {feedbackDone ? (
          <>
            <Text style={styles.herbName}>✓ {t('fb.thanks')}</Text>
            <Muted>{feedbackQueued ? t('offline.queued') : t('fb.thanksSubMobile')}</Muted>
          </>
        ) : !user ? (
          <>
            <Text style={styles.herbName}>{t('fb.title')}</Text>
            <Muted>{t('fb.signinPrompt')}</Muted>
            <Button title={t('fb.signinBtn')} onPress={() => navigation.navigate('AccountTab')} />
          </>
        ) : (
          <>
            <Text style={styles.herbName}>{t('fb.title')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button style={{ flex: 1 }} title={t('fb.yes')} variant={verdict === true ? 'primary' : 'outline'} onPress={() => setVerdict(true)} />
              <Button style={{ flex: 1 }} title={t('fb.no')} variant={verdict === false ? 'primary' : 'outline'} onPress={() => setVerdict(false)} />
            </View>
            {verdict === false && (
              <>
                <Muted style={{ marginTop: 6 }}>{t('fb.whatIs')}</Muted>
                <Chips options={wrongOptions} value={choice} onChange={setChoice} labelOf={labelOf} />
                {choice === 'other' && <Field label={t('fb.species')} value={other} onChangeText={setOther} maxLength={200} autoCapitalize="sentences" />}
              </>
            )}
            {verdict !== null && <Field label={t('fb.comment')} hint={t('common.optional')} value={note} onChangeText={setNote} multiline maxLength={1000} autoCapitalize="sentences" style={{ minHeight: 80, textAlignVertical: 'top' }} />}
            {!!error && <Alert>{error}</Alert>}
            <Button title={t('fb.submit')} disabled={verdict === null} loading={busy} onPress={submit} />
          </>
        )}
      </Card>

      <Button title={t('results.another')} variant="outline" onPress={() => { reset(); navigation.popToTop() }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  herbName: { fontSize: 17, fontWeight: '800', color: colors.green },
  k: { width: 92, color: colors.muted, fontWeight: '600', fontSize: 14 },
  v: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
})

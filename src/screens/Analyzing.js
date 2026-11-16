import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { Alert, Button, Eyebrow, H1, Lead, Muted, Screen } from '../components/UI'
import { colors } from '../theme'
import { useIdentify } from '../lib/identify'
import { useI18n } from '../lib/i18n'
import { identify } from '../lib/engine'
import { addLocalScan } from '../lib/localScans'
import { useAuth } from '../lib/auth'

const STEP_KEYS = ['analyze.s1', 'analyze.s2', 'analyze.s3', 'analyze.s4']
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default function Analyzing({ navigation }) {
  const { photo, crop, patch } = useIdentify()
  const { user } = useAuth()
  const { t, errText } = useI18n()
  const started = useRef(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!photo || started.current) return
    started.current = true
    setError(null); setStage(0)
    ;(async () => {
      try {
        const res = await identify(photo, setStage) // 3-11: on-device model (offline) or server; herbicides from the local cache
        setStage(2); await wait(350)
        setStage(3); await wait(350)
        setStage(STEP_KEYS.length)
        const top = res.top3[0]
        const localId = await addLocalScan({
          weed_name: top.class_name, confidence: top.confidence, crop_type: crop || user?.primary_crop || 'Unknown',
          top3: res.top3.map((x) => ({ class_name: x.class_name, confidence: x.confidence })),
          recommendations: top.herbicides.map((h) => `${h.herbicide_name} — ${h.dosage}`),
        })
        patch({ result: res, localId })
        await wait(300)
        navigation.replace('Matches')
      } catch (e) {
        setError(e?.key || e?.message ? e : { key: 'err.analyze' })
      }
    })()
  }, [photo, attempt, navigation, patch])

  return (
    <Screen>
      <Eyebrow num="04">{t('step.appModel')}</Eyebrow>
      <H1>{t('analyze.title')}</H1>
      <Lead>{t('analyze.subtitle')}</Lead>
      {photo && <Image source={{ uri: photo.uri }} style={styles.img} accessibilityLabel={t('analyze.alt')} />}
      <View style={{ marginTop: 14 }}>
        {STEP_KEYS.map((k, i) => {
          const done = stage > i, active = stage === i && !error
          return (
            <View key={k} style={[styles.row, !done && !active && { opacity: 0.55 }]}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {active ? <ActivityIndicator size="small" color={colors.green} /> : <Text style={[styles.dotText, done && { color: '#fff' }]}>{done ? '✓' : i + 1}</Text>}
              </View>
              <Text style={styles.stepTitle}>{t(k)}</Text>
              <Muted>{done ? t('status.complete') : active ? t('status.working') : t('status.pending')}</Muted>
            </View>
          )
        })}
      </View>
      {!!error && (
        <>
          <Alert>{errText(error)}</Alert>
          <Button title={t('common.tryAgain')} onPress={() => { started.current = false; setAttempt((a) => a + 1) }} />
          <Button title={t('analyze.another')} variant="outline" onPress={() => navigation.popToTop()} />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  img: { width: '100%', height: 200, borderRadius: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.sage, borderRadius: 14, padding: 12, marginVertical: 5 },
  dot: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  dotActive: { borderColor: colors.green, backgroundColor: '#fff' },
  dotDone: { backgroundColor: colors.green, borderColor: colors.green },
  dotText: { fontWeight: '700', color: colors.muted },
  stepTitle: { flex: 1, fontWeight: '700', color: colors.ink },
})

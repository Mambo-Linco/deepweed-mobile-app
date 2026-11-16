import { Image, StyleSheet, Text, View } from 'react-native'
import { Alert, Button, Eyebrow, H1, Lead, Muted, Screen } from '../components/UI'
import { colors } from '../theme'
import { useIdentify } from '../lib/identify'
import { useI18n } from '../lib/i18n'
import { parseSpecies } from '../lib/names'

export default function Matches({ navigation }) {
  const { result, photo } = useIdentify()
  const { t, tn } = useI18n()
  if (!result) return <Screen><Lead>{t('matches.noResult')}</Lead><Button title={t('matches.startOver')} onPress={() => navigation.popToTop()} /></Screen>

  return (
    <Screen>
      <Eyebrow num="05">{t('step.modelApp')}</Eyebrow>
      <H1>{t('matches.title')}</H1>
      <Lead>{t('matches.subtitle')}</Lead>
      {result.low_confidence && <Alert kind="warn">{t('matches.lowConf')}</Alert>}

      {result.top3.map((m, i) => {
        const s = parseSpecies(m.class_name)
        return (
          <View key={m.class_index} style={[styles.card, i === 0 && styles.first]}>
            <View style={styles.thumb}>
              {i === 0 && photo ? <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} /> : <Text style={{ fontSize: 30 }}>🌿</Text>}
              <View style={[styles.rank, i === 0 && { backgroundColor: colors.rust }]}><Text style={styles.rankText}>{m.rank}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{s.common}</Text>
              {!!(s.detail || s.local) && <Muted>{[s.detail, s.local].filter(Boolean).join(' · ')}</Muted>}
              <Text style={styles.score}>{m.confidence.toFixed(1)}% <Text style={styles.scoreLbl}>{t('matches.confidence')}</Text></Text>
              <View style={styles.meter}><View style={[styles.fill, { width: `${Math.max(2, Math.min(100, m.confidence))}%` }]} /></View>
              <Muted style={{ marginTop: 6 }}>{tn('matches.rec', m.herbicides.length)}</Muted>
            </View>
          </View>
        )
      })}
      <Button title={t('matches.see')} onPress={() => navigation.navigate('Results')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, backgroundColor: colors.sage, borderRadius: 18, padding: 12, marginVertical: 7, borderWidth: 1, borderColor: colors.line },
  first: { borderColor: colors.rust, borderWidth: 2 },
  thumb: { width: 92, height: 92, borderRadius: 14, backgroundColor: '#dfe5d1', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rank: { position: 'absolute', top: 5, left: 5, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#fff', fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.green },
  score: { fontSize: 22, fontWeight: '800', color: colors.green, marginTop: 6 },
  scoreLbl: { fontSize: 12, fontWeight: '400', color: colors.muted },
  meter: { height: 7, borderRadius: 99, backgroundColor: '#d0d7c4', overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', backgroundColor: colors.green2 },
})

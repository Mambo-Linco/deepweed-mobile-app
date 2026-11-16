import { StyleSheet, Text, View } from 'react-native'
import { Button, Card, Muted } from './UI'
import { colors } from '../theme'
import { useI18n } from '../lib/i18n'

// One herbicide record. Pass `admin` with onEdit / onDelete to show the management buttons.
export default function HerbicideCard({ h, showWeed = false, admin = false, onEdit, onDelete }) {
  const { t, cropLabel } = useI18n()
  const rows = [
    ['herb.crop', h.crop && cropLabel(h.crop)],
    ['herb.timing', h.application_timing],
    ['herb.dosage', h.dosage],
    ['herb.application', h.application_method],
    ['herb.moa', h.mode_of_action],
    ['herb.phi', h.pre_harvest_interval],
    ['herb.safety', h.safety_notes],
  ].filter(([, v]) => v)

  return (
    <Card>
      {showWeed && <Muted style={styles.weed}>{h.weed_name}</Muted>}
      <Text style={styles.name}>{h.herbicide_name}</Text>
      {!!h.active_ingredient && <Muted>{h.active_ingredient}</Muted>}
      {rows.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text style={styles.k}>{t(k)}</Text>
          <Text style={styles.v}>{v}</Text>
        </View>
      ))}
      {admin && (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button style={{ flex: 1 }} title={t('herbadmin.edit')} variant="outline" onPress={() => onEdit?.(h)} />
          <Button style={{ flex: 1 }} title={t('common.delete')} variant="danger" onPress={() => onDelete?.(h)} />
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  weed: { textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  name: { fontSize: 18, fontWeight: '800', color: colors.green },
  row: { flexDirection: 'row', marginTop: 6, gap: 8 },
  k: { width: 104, color: colors.muted, fontWeight: '600', fontSize: 14 },
  v: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
})

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Alert, Button, Card, Chips, Field, Lead, Muted, Screen } from '../components/UI'
import { colors, CROPS } from '../theme'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import classNames from '../lib/class_names.json'

const EMPTY = {
  weed_name: '', herbicide_name: '', active_ingredient: '', crop: '', dosage: '',
  application_method: '', application_timing: '', mode_of_action: '', pre_harvest_interval: '', safety_notes: '',
}
const FIELDS = Object.keys(EMPTY)

// Add or edit a herbicide record in the database (admin only). Pass route.params.record to edit.
export default function HerbicideForm({ navigation, route }) {
  const record = route.params?.record
  const { user } = useAuth()
  const { t, errText, cropLabel } = useI18n()
  const [f, setF] = useState(() => (record ? Object.fromEntries(FIELDS.map((k) => [k, record[k] ?? ''])) : EMPTY))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))

  if (user?.role !== 'admin') {
    return <Screen><Alert>{t('herbadmin.adminOnly')}</Alert></Screen>
  }

  const q = f.weed_name.trim().toLowerCase()
  const suggestions = q.length >= 2 && !classNames.includes(f.weed_name)
    ? classNames.filter((n) => n.toLowerCase().includes(q)).slice(0, 6) : []

  async function submit() {
    if (!f.weed_name.trim() || !f.herbicide_name.trim() || !f.dosage.trim()) {
      setError(`${t('herbform.required')}: ${t('herbform.weed')}, ${t('herbform.name')}, ${t('herbform.dosage')}`)
      return
    }
    setBusy(true); setError('')
    try {
      if (record) await api.updateHerbicide(record.id, f)
      else await api.createHerbicide(f)
      navigation.navigate('HerbicideList', { notice: 'herbadmin.saved' })
    } catch (e) { setError(errText(e)) } finally { setBusy(false) }
  }

  return (
    <Screen>
      <Lead>{t('herbform.lead')}</Lead>
      <Card>
        <Field label={`${t('herbform.weed')} *`} value={f.weed_name} onChangeText={set('weed_name')} autoCorrect={false} maxLength={300} />
        {suggestions.map((n) => (
          <Pressable key={n} onPress={() => set('weed_name')(n)} style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <Text style={{ color: colors.green, fontWeight: '600' }}>{n}</Text>
          </Pressable>
        ))}
        <Muted>{t('herbform.weedHint')}</Muted>

        <Field label={`${t('herbform.name')} *`} value={f.herbicide_name} onChangeText={set('herbicide_name')} autoCapitalize="words" maxLength={200} />
        <Field label={t('herbform.active')} hint={t('common.optional')} value={f.active_ingredient} onChangeText={set('active_ingredient')} maxLength={300} />

        <Text style={{ fontWeight: '600', color: colors.ink, marginTop: 8 }}>{t('herbform.crop')} <Text style={{ fontWeight: '400', color: colors.muted }}>{t('common.optional')}</Text></Text>
        <Chips options={['All crops', ...CROPS]} value={f.crop} onChange={(c) => set('crop')(f.crop === c ? '' : c)} labelOf={cropLabel} />

        <Field label={`${t('herbform.dosage')} *`} value={f.dosage} onChangeText={set('dosage')} placeholder="2L per 100L water" maxLength={500} />
        <Field label={t('herbform.method')} hint={t('common.optional')} value={f.application_method} onChangeText={set('application_method')} multiline maxLength={2000} autoCapitalize="sentences" style={{ minHeight: 84, textAlignVertical: 'top' }} />
        <Muted>{t('herbform.methodHint')}</Muted>
        <Field label={t('herbform.timing')} hint={t('common.optional')} value={f.application_timing} onChangeText={set('application_timing')} multiline maxLength={1000} autoCapitalize="sentences" style={{ minHeight: 64, textAlignVertical: 'top' }} />
        <Muted>{t('herbform.timingHint')}</Muted>
        <Field label={t('herbform.moa')} hint={t('common.optional')} value={f.mode_of_action} onChangeText={set('mode_of_action')} autoCapitalize="sentences" maxLength={200} />
        <Muted>{t('herbform.moaHint')}</Muted>
        <Field label={t('herbform.phi')} hint={t('common.optional')} value={f.pre_harvest_interval} onChangeText={set('pre_harvest_interval')} autoCapitalize="sentences" maxLength={100} />
        <Muted>{t('herbform.phiHint')}</Muted>
        <Field label={t('herbform.safety')} hint={t('common.optional')} value={f.safety_notes} onChangeText={set('safety_notes')} multiline maxLength={2000} autoCapitalize="sentences" style={{ minHeight: 84, textAlignVertical: 'top' }} />

        {!!error && <Alert>{error}</Alert>}
        <Button title={t('herbform.save')} onPress={submit} loading={busy} />
        <Button title={t('common.cancel')} variant="ghost" onPress={() => navigation.goBack()} />
      </Card>
    </Screen>
  )
}

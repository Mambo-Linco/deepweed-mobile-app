import { Text } from 'react-native'
import { Card, H1, H2, Lead, Muted, Screen } from '../components/UI'
import { colors } from '../theme'
import classNames from '../lib/class_names.json'
import { parseSpecies } from '../lib/names'
import { useI18n } from '../lib/i18n'

export default function Learn() {
  const { t } = useI18n()
  return (
    <Screen>
      <H1>{t('learn.title')}</H1>
      <Lead>{t('learn.lead')}</Lead>

      <H2>{t('learn.how')}</H2>
      {[1, 2, 3, 4, 5].map((n) => (
        <Card key={n}><Text style={{ fontWeight: '800', color: colors.green }}>{n}. {t(`learn.f${n}`)}</Text><Muted>{t(`learn.f${n}d`)}</Muted></Card>
      ))}

      <H2 style={{ marginTop: 18 }}>{t('learn.resTitle')}</H2>
      <Muted>{t('learn.resNote')}</Muted>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <Card key={n}><Text style={{ fontWeight: '800', color: colors.green }}>{t(`res.t${n}`)}</Text><Muted>{t(`res.d${n}`)}</Muted></Card>
      ))}

      <H2 style={{ marginTop: 18 }}>{t('learn.species', { n: classNames.length })}</H2>
      {classNames.map((n) => {
        const s = parseSpecies(n)
        return (
          <Card key={n} style={{ paddingVertical: 10 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>{s.common}</Text>
            {!!(s.detail || s.local) && <Muted>{[s.detail, s.local].filter(Boolean).join(' · ')}</Muted>}
          </Card>
        )
      })}
    </Screen>
  )
}

import { Image, StyleSheet } from 'react-native'
import { Button, Card, Chips, Eyebrow, H1, Lead, Muted, Screen } from '../components/UI'
import { useIdentify } from '../lib/identify'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { CROPS } from '../theme'

export default function Review({ navigation }) {
  const { photo, crop, patch } = useIdentify()
  const { user } = useAuth()
  const { t } = useI18n()
  if (!photo) return <Screen><Lead>{t('review.none')}</Lead><Button title={t('review.choose')} onPress={() => navigation.popToTop()} /></Screen>
  const selected = crop || user?.primary_crop || ''

  return (
    <Screen>
      <Eyebrow num="02">{t('step.farmerApp')}</Eyebrow>
      <H1>{t('review.title')}</H1>
      <Lead>{t('review.subtitle')}</Lead>
      <Image source={{ uri: photo.uri }} style={styles.img} resizeMode="cover" accessibilityLabel={t('review.alt')} />
      <Card>
        <Muted>{t('review.sent')}</Muted>
        <Muted style={{ marginTop: 12, fontWeight: '700', color: '#1b3a33' }}>{t('review.crop')} {t('common.optional')}</Muted>
        <Chips options={['', ...CROPS]} value={selected} onChange={(c) => patch({ crop: c })} labelOf={(c) => t(c ? `crop.${c}` : 'crop.none')} />
      </Card>
      <Button title={t('review.continue')} onPress={() => navigation.navigate('Analyzing')} />
      <Button title={t('review.change')} variant="outline" onPress={() => navigation.popToTop()} />
    </Screen>
  )
}
const styles = StyleSheet.create({ img: { width: '100%', height: 320, borderRadius: 18, backgroundColor: '#1b2b26' } })

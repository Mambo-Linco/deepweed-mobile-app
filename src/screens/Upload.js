import { useEffect, useState } from 'react'
import { Alert as RNAlert, Linking, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Alert, Button, Card, Eyebrow, H1, Lead, Muted, Screen } from '../components/UI'
import { useIdentify } from '../lib/identify'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

export default function Upload({ navigation }) {
  const { setPhoto } = useIdentify()
  const { t } = useI18n()
  const [error, setError] = useState('') // an i18n key
  useEffect(() => { api.wake() }, []) // free hosting sleeps when idle; wake it early
  const tips = [['tip.lit', 'tip.litSub'], ['tip.whole', 'tip.wholeSub'], ['tip.detail', 'tip.detailSub']]

  function accept(result) {
    if (result.canceled || !result.assets?.length) return
    const a = result.assets[0]
    setError('')
    setPhoto({ uri: a.uri, width: a.width, height: a.height }) // 1–2: capturePhoto / uploadImage
    navigation.navigate('Review')
  }

  async function camera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      setError('perm.cameraOff')
      RNAlert.alert(t('perm.title'), t('perm.body'), [
        { text: t('common.cancel'), style: 'cancel' }, { text: t('perm.open'), onPress: () => Linking.openSettings() },
      ])
      return
    }
    try { accept(await ImagePicker.launchCameraAsync({ quality: 0.9 })) } catch { setError('err.openCamera') }
  }

  async function library() {
    try { accept(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 })) } catch { setError('err.openGallery') }
  }

  return (
    <Screen>
      <Eyebrow num="01">{t('step.farmerApp')}</Eyebrow>
      <H1>{t('upload.title')}</H1>
      <Lead>{t('upload.subtitle')}</Lead>

      <Card style={{ alignItems: 'stretch', paddingVertical: 22 }}>
        <Button title={t('upload.take')} onPress={camera} />
        <Button title={t('upload.gallery')} variant="outline" onPress={library} />
      </Card>
      {!!error && <Alert>{t(error)}</Alert>}

      <Card>
        <Muted style={{ fontWeight: '700', fontSize: 16, color: '#1f4a3f', marginBottom: 8 }}>{t('upload.tips')}</Muted>
        {tips.map(([a, b]) => (
          <View key={a} style={{ marginVertical: 5 }}>
            <Muted style={{ color: '#1b3a33', fontWeight: '700' }}>{t(a)}</Muted>
            <Muted>{t(b)}</Muted>
          </View>
        ))}
      </Card>
    </Screen>
  )
}

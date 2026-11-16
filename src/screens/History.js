import { useCallback, useState } from 'react'
import { Alert as RNAlert, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Alert, Button, Card, Muted, Screen } from '../components/UI'
import { Pill } from '../components/FeedbackCommon'
import { colors } from '../theme'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { useNet } from '../lib/net'
import { displayName } from '../lib/names'
import { deleteLocalScan, listLocalScans, mergeServerScans } from '../lib/localScans'

// Device-first: every identification is kept on the phone. Scans saved to the account are merged in when online.
export default function History() {
  const { t, errText, lang, cropLabel } = useI18n()
  const { user } = useAuth()
  const { online } = useNet()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setItems(await listLocalScans())
    if (user && online) {
      try {
        const srv = await api.scans(50)
        await mergeServerScans(srv.data)
        setItems(await listLocalScans())
      } catch { /* offline or server down: keep the phone's copy */ }
    }
  }, [user, online])
  useFocusEffect(useCallback(() => { load() }, [load]))

  function confirmDelete(s) {
    RNAlert.alert(t('history.deleteQ'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          if (s.server_id && online) { try { await api.deleteScan(s.server_id) } catch (e) { setError(e); return } }
          await deleteLocalScan(s.id)
          setItems(await listLocalScans())
        },
      },
    ])
  }

  return (
    <Screen>
      {!!error && <Alert>{errText(error)}</Alert>}
      {items && !items.length && <Muted>{t('history.empty')}</Muted>}
      {items?.map((s) => (
        <Card key={s.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.green }}>{displayName(s.weed_name)}</Text>
            <Pill kind={s.server_id ? 'resolved' : 'reviewed'} label={t(s.server_id ? 'offline.savedAccount' : 'offline.onlyPhone')} />
          </View>
          <Muted>{Number(s.confidence).toFixed(1)}% · {cropLabel(s.crop_type)} · {new Date(s.created_at).toLocaleString(lang === 'en' ? undefined : lang)}</Muted>
          {s.recommendations?.length > 0 && <Muted style={{ color: colors.ink }}>{s.recommendations.join(' · ')}</Muted>}
          <Button title={t('common.delete')} variant="ghost" onPress={() => confirmDelete(s)} />
        </Card>
      ))}
    </Screen>
  )
}

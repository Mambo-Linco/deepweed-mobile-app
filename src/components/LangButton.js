import { Alert, Pressable, Text } from 'react-native'
import { LANGUAGES, useI18n } from '../lib/i18n'
import { colors } from '../theme'

// Shown in the header of every screen. Tap to pick English / chiShona / isiNdebele.
export default function LangButton() {
  const { lang, setLang, t } = useI18n()
  const open = () =>
    Alert.alert(t('lang.label'), undefined, LANGUAGES.map((l) => ({ text: (l.code === lang ? '✓ ' : '') + l.label, onPress: () => setLang(l.code) })), { cancelable: true })
  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={t('lang.label')} hitSlop={10}
      style={{ borderWidth: 1.5, borderColor: colors.green, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, marginRight: 4 }}>
      <Text style={{ color: colors.green, fontWeight: '800', fontSize: 13 }}>{lang.toUpperCase()}</Text>
    </Pressable>
  )
}

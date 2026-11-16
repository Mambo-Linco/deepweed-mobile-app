import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../theme'
import { useNet } from '../lib/net'
import { useI18n } from '../lib/i18n'

export function OfflineNote() {
  const { online } = useNet()
  const { t } = useI18n()
  if (online) return null
  return <View style={s.offline} accessibilityRole="alert"><Text style={s.offlineText}>{t('offline.banner')}</Text></View>
}

export function Screen({ children, scroll = true, style }) {
  if (!scroll) return <View style={[s.screen, style]}><OfflineNote />{children}</View>
  return (
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={[s.screen, style]} keyboardShouldPersistTaps="handled">
      <OfflineNote />
      {children}
    </ScrollView>
  )
}

export const H1 = ({ children, style }) => <Text style={[s.h1, style]} accessibilityRole="header">{children}</Text>
export const H2 = ({ children, style }) => <Text style={[s.h2, style]}>{children}</Text>
export const Eyebrow = ({ num, children }) => (
  <Text style={s.eyebrow}><Text style={s.eyebrowNum}>{num} / </Text>{children}</Text>
)
export const Muted = ({ children, style }) => <Text style={[s.muted, style]}>{children}</Text>
export const Lead = ({ children }) => <Text style={s.lead}>{children}</Text>
export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }) {
  const v = variant
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, v === 'primary' && s.btnPrimary, v === 'outline' && s.btnOutline, (v === 'ghost' || v === 'danger') && s.btnGhost, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.8 }, style]}
    >
      {loading ? <ActivityIndicator color={v === 'primary' ? '#fff' : colors.green} /> : (
        <Text style={[s.btnText, v !== 'primary' && { color: v === 'danger' ? colors.danger : colors.green }]}>{title}</Text>
      )}
    </Pressable>
  )
}

export function Alert({ kind = 'error', children }) {
  const bg = kind === 'error' ? colors.errorBg : kind === 'warn' ? colors.warnBg : colors.sage
  const fg = kind === 'error' ? colors.danger : kind === 'warn' ? colors.warn : colors.ink
  return <View style={[s.alert, { backgroundColor: bg }]} accessibilityRole="alert"><Text style={{ color: fg, fontSize: 15 }}>{children}</Text></View>
}

export function Field({ label, hint, style, ...props }) {
  return (
    <View style={{ marginVertical: 8 }}>
      <Text style={s.label}>{label}{hint ? <Text style={s.hint}> {hint}</Text> : null}</Text>
      <TextInput placeholderTextColor={colors.muted} autoCapitalize="none" style={[s.input, style]} {...props} />
    </View>
  )
}

export function Chips({ options, value, onChange, labelOf = (x) => x }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
      {options.map((o) => {
        const on = value === o
        return (
          <Pressable key={String(o)} onPress={() => onChange(o)} style={[s.chip, on && s.chipOn]} accessibilityState={{ selected: on }}>
            <Text style={[s.chipText, on && { color: '#fff' }]}>{labelOf(o)}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  offline: { backgroundColor: colors.warnBg, borderRadius: 12, padding: 10, marginBottom: 12 },
  offlineText: { color: colors.warn, fontSize: 13, lineHeight: 18 },
  screen: { padding: 20, paddingBottom: 48, backgroundColor: colors.cream, flexGrow: 1 },
  h1: { fontSize: 34, fontWeight: '800', color: colors.green, letterSpacing: -0.5, marginBottom: 6 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.green, marginBottom: 6 },
  eyebrow: { color: colors.muted, fontWeight: '700', letterSpacing: 1.2, fontSize: 13, textTransform: 'uppercase', marginBottom: 4 },
  eyebrowNum: { color: colors.rust, fontSize: 18 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  lead: { color: colors.muted, fontSize: 17, lineHeight: 24, marginBottom: 14 },
  card: { backgroundColor: colors.sage, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 16, marginVertical: 8 },
  btn: { minHeight: 50, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', marginVertical: 5 },
  btnPrimary: { backgroundColor: colors.green },
  btnOutline: { borderColor: colors.green, backgroundColor: 'transparent' },
  btnGhost: { backgroundColor: 'transparent' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  alert: { padding: 12, borderRadius: 12, marginVertical: 10 },
  label: { fontWeight: '600', color: colors.ink, marginBottom: 4 },
  hint: { fontWeight: '400', color: colors.muted },
  input: { borderWidth: 1.5, borderColor: colors.line, borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, color: colors.ink },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5, borderColor: colors.green, backgroundColor: 'transparent' },
  chipOn: { backgroundColor: colors.green },
  chipText: { color: colors.green, fontWeight: '600' },
})

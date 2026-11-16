import { useState } from 'react'
import { Text } from 'react-native'
import { Alert, Button, Card, Chips, Field, H1, Lead, Muted, Screen } from '../components/UI'
import { colors, CROPS } from '../theme'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { useBadge } from '../lib/badge'

export default function Account({ navigation }) {
  const { user, loading, login, register, logout } = useAuth()
  const { t, errText } = useI18n()
  const { count } = useBadge()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', password: '', farm_location: '', primary_crop: 'Maize' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))

  if (loading) return <Screen><Muted>{t('common.loading')}</Muted></Screen>

  if (user) {
    return (
      <Screen>
        <H1>{t('auth.hello', { name: user.first_name })}</H1>
        <Lead>{user.email}</Lead>
        <Button title={`${t(user.role === 'admin' ? 'fbk.nav.inbox' : 'fbk.nav.mine')}${count > 0 ? ` (${count})` : ''}`} onPress={() => navigation.navigate('Feedback')} />
        <Button title={t('nav.myScans')} onPress={() => navigation.navigate('History')} />
        <Button title={t('set.title')} variant="outline" onPress={() => navigation.navigate('Settings')} />
        <Button title={t('nav.signOut')} variant="ghost" onPress={logout} />
      </Screen>
    )
  }

  async function submit() {
    setBusy(true); setError('')
    try {
      if (mode === 'login') await login(f.email.trim(), f.password)
      else {
        const body = { ...f, email: f.email.trim() }
        if (!body.farm_location.trim()) delete body.farm_location
        await register(body)
      }
    } catch (e) { setError(errText(e)) } finally { setBusy(false) }
  }

  return (
    <Screen>
      <H1>{mode === 'login' ? t('auth.signinTitle') : t('auth.registerTitle')}</H1>
      <Lead>{t('auth.lead')}</Lead>
      <Card>
        {mode === 'register' && (
          <>
            <Field label={t('auth.first')} value={f.first_name} onChangeText={set('first_name')} autoCapitalize="words" />
            <Field label={t('auth.last')} value={f.last_name} onChangeText={set('last_name')} autoCapitalize="words" />
          </>
        )}
        <Field label={t('auth.email')} value={f.email} onChangeText={set('email')} keyboardType="email-address" autoComplete="email" />
        <Field label={t('auth.password')} hint={mode === 'register' ? t('auth.passwordHint') : ''} value={f.password} onChangeText={set('password')} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        {mode === 'register' && (
          <>
            <Field label={t('auth.farm')} hint={t('common.optional')} value={f.farm_location} onChangeText={set('farm_location')} autoCapitalize="words" />
            <Text style={{ fontWeight: '600', color: colors.ink }}>{t('auth.crop')}</Text>
            <Chips options={CROPS} value={f.primary_crop} onChange={set('primary_crop')} labelOf={(c) => t(`crop.${c}`)} />
          </>
        )}
        {!!error && <Alert>{error}</Alert>}
        <Button title={mode === 'login' ? t('auth.signinTitle') : t('nav.createAccount')} onPress={submit} loading={busy} />
        <Button title={mode === 'login' ? t('auth.noAccountBtn') : t('auth.haveAccountBtn')} variant="ghost" onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} />
      </Card>
      <Button title={t('set.title')} variant="ghost" onPress={() => navigation.navigate('Settings')} />
    </Screen>
  )
}

import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { colors } from './src/theme'
import { initApi } from './src/lib/api'
import { AuthProvider, useAuth } from './src/lib/auth'
import { IdentifyProvider } from './src/lib/identify'
import { I18nProvider, loadLang, useI18n } from './src/lib/i18n'
import LangButton from './src/components/LangButton'
import Upload from './src/screens/Upload'
import Review from './src/screens/Review'
import Analyzing from './src/screens/Analyzing'
import Matches from './src/screens/Matches'
import Results from './src/screens/Results'
import Herbicides from './src/screens/Herbicides'
import HerbicideForm from './src/screens/HerbicideForm'
import Learn from './src/screens/Learn'
import Account from './src/screens/Account'
import History from './src/screens/History'
import Feedback from './src/screens/Feedback'
import FeedbackDetail from './src/screens/FeedbackDetail'
import { BadgeProvider, useBadge } from './src/lib/badge'
import { NetProvider } from './src/lib/net'
import Settings from './src/screens/Settings'

const Tabs = createBottomTabNavigator()
const IdentifyStack = createNativeStackNavigator()
const AccountStack = createNativeStackNavigator()
const HerbStack = createNativeStackNavigator()

// Every header carries the language button, so the language can be changed on every screen.
const header = {
  headerStyle: { backgroundColor: colors.cream }, headerTintColor: colors.green, headerTitleStyle: { fontWeight: '800' },
  headerShadowVisible: false, contentStyle: { backgroundColor: colors.cream }, headerRight: () => <LangButton />,
}
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.cream, primary: colors.green, card: colors.cream, text: colors.ink, border: colors.line } }

function IdentifyNav() {
  const { t } = useI18n()
  return (
    <IdentifyStack.Navigator screenOptions={header}>
      <IdentifyStack.Screen name="Upload" component={Upload} options={{ title: 'FieldGuide' }} />
      <IdentifyStack.Screen name="Review" component={Review} options={{ title: t('review.title') }} />
      <IdentifyStack.Screen name="Analyzing" component={Analyzing} options={{ title: t('analyze.title'), headerBackVisible: false, gestureEnabled: false }} />
      <IdentifyStack.Screen name="Matches" component={Matches} options={{ title: t('matches.title'), headerBackVisible: false }} />
      <IdentifyStack.Screen name="Results" component={Results} options={{ title: t('results.eyebrow') }} />
    </IdentifyStack.Navigator>
  )
}

function HerbicidesNav() {
  const { t } = useI18n()
  return (
    <HerbStack.Navigator screenOptions={header}>
      <HerbStack.Screen name="HerbicideList" component={Herbicides} options={{ title: t('nav.herbicides') }} />
      <HerbStack.Screen name="HerbicideForm" component={HerbicideForm} options={({ route }) => ({ title: route.params?.record ? t('herbform.titleEdit') : t('herbform.titleNew') })} />
    </HerbStack.Navigator>
  )
}

function AccountNav() {
  const { t } = useI18n()
  const { user } = useAuth()
  return (
    <AccountStack.Navigator screenOptions={header}>
      <AccountStack.Screen name="Account" component={Account} options={{ title: t('nav.account') }} />
      <AccountStack.Screen name="History" component={History} options={{ title: t('nav.myScans') }} />
      <AccountStack.Screen name="Feedback" component={Feedback} options={{ title: t(user?.role === 'admin' ? 'fbk.nav.inbox' : 'fbk.nav.mine') }} />
      <AccountStack.Screen name="FeedbackDetail" component={FeedbackDetail} options={{ title: t('fbk.title.admin') }} />
      <AccountStack.Screen name="Settings" component={Settings} options={{ title: t('set.title') }} />
    </AccountStack.Navigator>
  )
}

const icon = (glyph) => ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{glyph}</Text>

function Root() {
  const { t } = useI18n()
  const { count } = useBadge()
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Tabs.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.line } }}>
        <Tabs.Screen name="IdentifyTab" component={IdentifyNav} options={{ title: t('tab.identify'), tabBarIcon: icon('📷') }} />
        <Tabs.Screen name="HerbicidesTab" component={HerbicidesNav} options={{ title: t('tab.herbicides'), tabBarIcon: icon('🧪') }} />
        <Tabs.Screen name="LearnTab" component={Learn} options={{ title: t('nav.learn'), tabBarIcon: icon('📖'), headerShown: true, ...header }} />
        <Tabs.Screen name="AccountTab" component={AccountNav} options={{ title: t('nav.account'), tabBarIcon: icon('👤'), tabBarBadge: count > 0 ? count : undefined }} />
      </Tabs.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  const [boot, setBoot] = useState(null) // { lang }
  useEffect(() => { Promise.all([initApi(), loadLang()]).then(([, lang]) => setBoot({ lang })).catch(() => setBoot({ lang: 'en' })) }, [])

  if (!boot) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}><ActivityIndicator color={colors.green} /></View>
  }

  return (
    <SafeAreaProvider>
      <I18nProvider initial={boot.lang}>
        <AuthProvider>
          <NetProvider>
            <BadgeProvider>
              <IdentifyProvider>
                <Root />
              </IdentifyProvider>
            </BadgeProvider>
          </NetProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  )
}

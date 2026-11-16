import AsyncStorage from '@react-native-async-storage/async-storage'

export async function getJson(key, fallback = null) {
  try {
    const s = await AsyncStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}
export async function setJson(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)) } catch { /* storage full / unavailable */ }
}
export const removeKey = (key) => AsyncStorage.removeItem(key).catch(() => {})

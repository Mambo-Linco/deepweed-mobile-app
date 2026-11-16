// Same REST API as the web app. Raw image bytes go to POST /api/predict (steps 3-11 of the flow).
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const TOKEN_KEY = 'deepweed.token'
const URL_KEY = 'deepweed.apiUrl'

let baseUrl = ''
let token = null

export function defaultBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
  // While developing, Expo knows the IP of the computer serving the bundle; the backend runs on that machine.
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  return host ? `http://${host}:5000` : 'http://localhost:5000'
}

export async function initApi() {
  baseUrl = ((await SecureStore.getItemAsync(URL_KEY)) || defaultBaseUrl()).replace(/\/$/, '')
  token = await SecureStore.getItemAsync(TOKEN_KEY)
}
export const getBaseUrl = () => baseUrl
export async function setBaseUrl(url) {
  const clean = (url || '').trim().replace(/\/$/, '')
  if (clean) await SecureStore.setItemAsync(URL_KEY, clean)
  else await SecureStore.deleteItemAsync(URL_KEY)
  baseUrl = clean || defaultBaseUrl()
}
export const hasToken = () => !!token
export async function setToken(t) {
  token = t
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t)
  else await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

async function request(path, { method = 'GET', body, headers = {}, raw = false, auth = true, timeout = 30000 } = {}) {
  const h = { ...headers }
  if (auth && token) h.Authorization = `Bearer ${token}`
  let payload = body
  if (body && !raw) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  let res
  try {
    res = await fetch(`${baseUrl}${path}`, { method, headers: h, body: payload, signal: ctrl.signal })
  } catch {
    throw Object.assign(new ApiError(`Cannot reach the server at ${baseUrl}.`, 0), { key: 'err.networkMobile', params: { url: baseUrl } })
  } finally {
    clearTimeout(timer)
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) await setToken(null)
    const fe = data?.details?.fieldErrors
    const detail = fe ? Object.values(fe).flat().join(' ') : ''
    const apiErr = new ApiError([data?.error, detail].filter(Boolean).join(' — ') || `Request failed (${res.status})`, res.status)
    if (res.status === 403) apiErr.key = 'err.forbidden'
    if (res.status === 409) apiErr.key = 'err.duplicate'
    throw apiErr
  }
  return data
}

export const api = {
  register: (b) => request('/api/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => request('/api/auth/login', { method: 'POST', body: b, auth: false }),
  me: () => request('/api/auth/me'),
  predict: async (uri) => {
    const blob = await (await fetch(uri)).blob()
    return request('/api/predict', { method: 'POST', body: blob, raw: true, headers: { 'Content-Type': 'image/jpeg' }, auth: false, timeout: 90000 })
  },
  saveScan: (b) => request('/api/scans', { method: 'POST', body: b }),
  scans: (limit = 50, offset = 0) => request(`/api/scans?limit=${limit}&offset=${offset}`),
  deleteScan: (id) => request(`/api/scans/${id}`, { method: 'DELETE' }),
  sendFeedback: (b) => request('/api/feedback', { method: 'POST', body: b }),
  myFeedback: () => request('/api/feedback/my'),
  feedbackInbox: (status) => request(`/api/feedback?limit=200${status ? `&status=${status}` : ''}`),
  feedbackSummary: () => request('/api/feedback/summary'),
  updateFeedback: (id, b) => request(`/api/feedback/${id}`, { method: 'PATCH', body: b }),
  markReplySeen: (id) => request(`/api/feedback/${id}/seen`, { method: 'PATCH' }),
  herbicidesAll: () => request('/api/herbicide?limit=500', { auth: false }),
  herbicides: (q) => request(`/api/herbicide${q ? `?q=${encodeURIComponent(q)}` : ''}`, { auth: false }),
  herbicide: (id) => request(`/api/herbicide/${id}`, { auth: false }),
  createHerbicide: (b) => request('/api/herbicide', { method: 'POST', body: b }),
  updateHerbicide: (id, b) => request(`/api/herbicide/${id}`, { method: 'PUT', body: b }),
  deleteHerbicide: (id) => request(`/api/herbicide/${id}`, { method: 'DELETE' }),
}

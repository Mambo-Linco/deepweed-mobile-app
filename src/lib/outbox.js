import { api, ApiError, hasToken } from './api'
import { getJson, setJson } from './storage'
import { markScanSynced } from './localScans'

// Feedback and messages written offline wait here and are sent automatically when the connection is back.
const KEY = 'deepweed.outbox'
const listeners = new Set()
export const subscribeOutbox = (cb) => { listeners.add(cb); return () => listeners.delete(cb) }

const load = () => getJson(KEY, [])
async function save(items) { await setJson(KEY, items); listeners.forEach((cb) => cb(items.length)) }

export const listOutbox = load
export const outboxCount = async () => (await load()).length
const isNetworkError = (e) => e instanceof ApiError && e.status === 0

// item = { type: 'feedback', local_id?, scan?: {...saveScan body}, scan_id?, feedback: {...} } | { type: 'message', message }
export async function sendItem(item) {
  if (item.type === 'message') {
    await api.sendFeedback({ message: item.message })
    return
  }
  if (item.scan && !item.scan_id) {
    const saved = await api.saveScan(item.scan)
    item.scan_id = saved.id // remembered, so a retry never creates the scan twice
    if (item.local_id) await markScanSynced(item.local_id, saved.id)
  }
  await api.sendFeedback({ ...item.feedback, scan_id: item.scan_id })
}

export async function enqueue(item) {
  const items = await load()
  items.push({ ...item, id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, queued_at: new Date().toISOString() })
  await save(items)
}

// Send now; if there is no connection, keep it for later. Resolves { queued }.
export async function submitOrQueue(item) {
  try {
    await sendItem(item)
    return { queued: false }
  } catch (e) {
    if (isNetworkError(e)) { await enqueue(item); return { queued: true } }
    throw e
  }
}

let flushing = false
export async function flushOutbox() {
  if (flushing || !hasToken()) return 0
  flushing = true
  let sent = 0
  try {
    let items = await load()
    for (const item of [...items]) {
      try {
        await sendItem(item)
        items = items.filter((i) => i.id !== item.id)
        sent++
        await save(items)
      } catch (e) {
        const permanent = e instanceof ApiError && e.status >= 400 && e.status < 500 && ![401, 403, 429].includes(e.status)
        if (permanent) { items = items.filter((i) => i.id !== item.id); await save(items) } // invalid or already gone: don't retry forever
        else { await save(items); break }                                                  // offline / expired login: keep, try later
      }
    }
  } finally { flushing = false }
  return sent
}

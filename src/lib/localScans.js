import { getJson, setJson } from './storage'

// Every identification is kept on the phone (works offline). Entries get a server_id once saved to the account.
const KEY = 'deepweed.localScans'
const MAX = 200

export const listLocalScans = () => getJson(KEY, [])

export async function addLocalScan(entry) {
  const list = await listLocalScans()
  const id = `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  list.unshift({ id, created_at: new Date().toISOString(), server_id: null, ...entry })
  await setJson(KEY, list.slice(0, MAX))
  return id
}

export async function markScanSynced(localId, serverId) {
  const list = await listLocalScans()
  const hit = list.find((s) => s.id === localId)
  if (hit) { hit.server_id = serverId; await setJson(KEY, list) }
}

export async function deleteLocalScan(id) {
  const list = await listLocalScans()
  await setJson(KEY, list.filter((s) => s.id !== id))
}

// Add scans saved from other devices (or earlier versions) that the phone doesn't know yet.
export async function mergeServerScans(serverScans) {
  const list = await listLocalScans()
  const known = new Set(list.map((s) => s.server_id).filter(Boolean))
  let added = false
  for (const s of serverScans) {
    if (known.has(s.id)) continue
    list.push({ id: `s${s.id}`, server_id: s.id, created_at: s.created_at, weed_name: s.weed_name, confidence: Number(s.confidence), crop_type: s.crop_type, top3: s.top3 || [], recommendations: s.recommendations || [] })
    added = true
  }
  if (added) {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    await setJson(KEY, list.slice(0, MAX))
  }
}

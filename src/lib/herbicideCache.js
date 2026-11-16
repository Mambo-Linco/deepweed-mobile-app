import { api } from './api'
import { getJson, setJson } from './storage'
import { matchHerbicides } from './herbMatch'

// The herbicide database is copied to the phone so results and the Herbicides tab work offline.
const KEY = 'deepweed.herbicides'
let mem = null

export async function getHerbicideCache() {
  if (!mem) mem = await getJson(KEY, { items: [], updated_at: null })
  return mem
}

// Download the latest records. Throws when there is no connection (callers ignore that).
export async function syncHerbicides() {
  const items = await api.herbicidesAll()
  mem = { items, updated_at: new Date().toISOString() }
  await setJson(KEY, mem)
  return mem
}

export async function lookupHerbicides(className) {
  const cache = await getHerbicideCache()
  return matchHerbicides(className, cache.items)
}

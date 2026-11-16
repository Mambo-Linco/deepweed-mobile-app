// The "controller" of the flow on the phone: photo -> top-3 species + herbicides.
// Uses the on-device model when available (works offline); otherwise falls back to the server.
import { api, ApiError } from './api'
import { prepareImage } from './image'
import { classify, isOnDeviceAvailable } from './classifier'
import { getHerbicideCache, lookupHerbicides } from './herbicideCache'

const LOW_CONFIDENCE = 50

export async function identify(photo, onStage = () => {}) {
  const resized = await prepareImage(photo)  // 4: preprocess(image)
  onStage(1)

  let deviceError = null
  if (await isOnDeviceAvailable()) {
    try {
      const top = await classify(resized)    // 5-7: predict / forwardPass / top3Species
      const cache = await getHerbicideCache()
      const top3 = []
      for (let i = 0; i < top.length; i++) {
        top3.push({ rank: i + 1, ...top[i], herbicides: await lookupHerbicides(top[i].class_name) }) // 8-10
      }
      return { top3, low_confidence: (top3[0]?.confidence ?? 0) < LOW_CONFIDENCE, herbicide_data_missing: !cache.updated_at, source: 'device', model: 'on-device' }
    } catch (e) {
      deviceError = e // fall through to the server
    }
  }

  try {
    const res = await api.predict(resized)
    return { ...res, source: 'server' }
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) {
      throw Object.assign(new Error('offline: no on-device model'), { key: deviceError ? 'err.analyze' : 'offline.noModel' })
    }
    throw e
  }
}

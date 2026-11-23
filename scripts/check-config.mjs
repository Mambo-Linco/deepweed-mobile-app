// Runs before building the app (npm run build:release / prebuild:android).
// Refuses to build an app that would try to reach a computer on your own network instead of the hosted backend.
// To build for local testing on purpose:  ALLOW_LOCAL_API=1 npm run build:release
import { existsSync, readFileSync } from 'node:fs'

const appJson = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'))
let envFileUrl = ''
const envPath = new URL('../.env', import.meta.url)
if (existsSync(envPath)) {
  const m = readFileSync(envPath, 'utf8').match(/^\s*EXPO_PUBLIC_API_URL\s*=\s*(.+?)\s*$/m)
  if (m) envFileUrl = m[1].replace(/^["']|["']$/g, '')
}
const url = process.env.EXPO_PUBLIC_API_URL || envFileUrl || appJson.expo?.extra?.apiUrl || ''
const source = process.env.EXPO_PUBLIC_API_URL ? 'EXPO_PUBLIC_API_URL' : envFileUrl ? '.env' : 'app.json (expo.extra.apiUrl)'

const local = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.)/i.test(url)
if ((!url || local) && !process.env.ALLOW_LOCAL_API) {
  console.error(`\nThe app would use "${url || '(nothing)'}" as its backend (from ${source}).`)
  console.error('That is not a hosted address. Set expo.extra.apiUrl in app.json to your backend, e.g. https://deepweed-backend.onrender.com\n')
  process.exit(1)
}
console.log(`Backend address for this build: ${url} (from ${source})`)

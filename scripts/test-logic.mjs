// Runs the pure offline logic tests with plain Node (no phone needed):  npm run test:logic
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

const dir = mkdtempSync(join(tmpdir(), 'dw-'))
for (const f of ['bytes', 'scoring', 'herbMatch']) writeFileSync(join(dir, `${f}.mjs`), readFileSync(new URL(`../src/lib/${f}.js`, import.meta.url), 'utf8'))
const load = (f) => import(pathToFileURL(join(dir, `${f}.mjs`)).href)
const { b64ToBytes } = await load('bytes')
const { toFloatInput, toProbabilities, topK } = await load('scoring')
const { searchTerms, matchHerbicides } = await load('herbMatch')

for (const n of [0, 1, 2, 3, 4, 5, 100, 1001]) {
  const buf = Buffer.from(Array.from({ length: n }, (_, i) => (i * 37 + 11) & 255))
  assert.deepEqual(Buffer.from(b64ToBytes(buf.toString('base64'))), buf)
}
assert.deepEqual(Array.from(toFloatInput(new Uint8Array([0, 128, 255]), 1, 1, 'rescale')).map((v) => +v.toFixed(3)), [0, 0.502, 1])
assert.deepEqual(Array.from(toFloatInput(new Uint8Array([0, 128, 255]), 1, 1, 'mobilenet')).map((v) => +v.toFixed(3)), [-1, 0.004, 1])
assert.ok(Math.abs(toProbabilities(new Float32Array([2, 1, 0])).reduce((a, b) => a + b) - 1) < 1e-9)
assert.deepEqual(topK([0.1, 0.6, 0.05, 0.25], ['a', 'b', 'c', 'd']).map((x) => x.class_name), ['b', 'd', 'a'])
assert.deepEqual(searchTerms('Blackjack (Bidens pilosa  Tsine)'), ['blackjack', 'bidens pilosa', 'tsine'])
const db = [{ weed_name: 'Blackjack (Bidens pilosa)', herbicide_name: 'X' }, { weed_name: 'Pigweed (Amaranthus hybridus)', herbicide_name: 'Y' }]
assert.deepEqual(matchHerbicides('Pigweed (Amaranthus spp.  Mbowa)', db).map((h) => h.herbicide_name), ['Y'])
assert.deepEqual(matchHerbicides('Chaarendo', db), [])
console.log('offline logic tests passed')

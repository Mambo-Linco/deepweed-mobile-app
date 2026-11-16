// Pure helpers (no React Native imports) so they can be unit-tested.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const LOOKUP = new Uint8Array(256).fill(255)
for (let i = 0; i < B64.length; i++) LOOKUP[B64.charCodeAt(i)] = i

export function b64ToBytes(b64) {
  const clean = b64.replace(/^data:[^,]+,/, '').replace(/[\r\n\s]/g, '')
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4) - pad)
  let o = 0
  for (let i = 0; i < clean.length; i += 4) {
    const a = LOOKUP[clean.charCodeAt(i)], b = LOOKUP[clean.charCodeAt(i + 1)]
    const c = LOOKUP[clean.charCodeAt(i + 2)], d = LOOKUP[clean.charCodeAt(i + 3)]
    if (o < out.length) out[o++] = (a << 2) | (b >> 4)
    if (o < out.length) out[o++] = ((b & 15) << 4) | (c >> 2)
    if (o < out.length) out[o++] = ((c & 3) << 6) | d
  }
  return out
}

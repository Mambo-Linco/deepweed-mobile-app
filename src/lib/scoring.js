// Pure helpers for the on-device model (unit-tested without React Native).

// RGB bytes (w*h*3, or RGBA) -> Float32Array in the scaling the model was trained with.
export function toFloatInput(pixels, width, height, preprocess = 'rescale') {
  const channels = pixels.length / (width * height)
  const out = new Float32Array(width * height * 3)
  const mobilenet = preprocess === 'mobilenet'
  for (let i = 0, p = 0; i < width * height; i++, p += channels) {
    for (let c = 0; c < 3; c++) {
      const v = pixels[p + c]
      out[i * 3 + c] = mobilenet ? v / 127.5 - 1 : v / 255
    }
  }
  return out
}

// The model ends in softmax, but if a build outputs logits, make them probabilities.
export function toProbabilities(raw) {
  let sum = 0, min = Infinity
  for (let i = 0; i < raw.length; i++) { sum += raw[i]; if (raw[i] < min) min = raw[i] }
  if (min >= 0 && Math.abs(sum - 1) < 0.02) return Array.from(raw)
  let max = -Infinity
  for (let i = 0; i < raw.length; i++) if (raw[i] > max) max = raw[i]
  const exps = Array.from(raw, (v) => Math.exp(v - max))
  const total = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / total)
}

export function topK(probs, classes, k = 3) {
  return probs
    .map((p, i) => ({ class_index: i, class_name: classes[i], confidence: Math.round(p * 10000) / 100 }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, k)
}

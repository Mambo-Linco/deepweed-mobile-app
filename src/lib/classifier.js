// On-device weed identification (works with no internet).
// Needs: (1) a development/release build with react-native-fast-tflite (not Expo Go),
//        (2) assets/model/weed_classifier.tflite made by ml-service/convert_to_tflite.py.
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import jpeg from 'jpeg-js'
import meta from '../../assets/model/model_meta.json'
import { b64ToBytes } from './bytes'
import { toFloatInput, toProbabilities, topK } from './scoring'

const MODEL_ASSET = require('../../assets/model/weed_classifier.tflite')

let tflite = null
try { tflite = require('react-native-fast-tflite') } catch { tflite = null } // missing in Expo Go

let modelPromise = null
function getModel() {
  if (!modelPromise) {
    modelPromise = tflite.loadTensorflowModel(MODEL_ASSET).catch((e) => { modelPromise = null; throw e })
  }
  return modelPromise
}

export const modelInfo = () => ({ installed: !!meta.installed, nativeModule: !!tflite, preprocess: meta.preprocess, quantization: meta.quantization })

export async function isOnDeviceAvailable() {
  if (!meta.installed || !tflite) return false
  try { await getModel(); return true } catch { return false }
}

// `photo` is the 1024px JPEG produced by prepareImage (or any image URI): squash to 224x224 like the server does.
async function toInput(uri) {
  const S = meta.input_size || 224
  const out = await manipulateAsync(uri, [{ resize: { width: S, height: S } }], { compress: 1, format: SaveFormat.JPEG, base64: true })
  const { data, width, height } = jpeg.decode(b64ToBytes(out.base64), { useTArray: true, formatAsRGBA: false })
  return toFloatInput(data, width, height, meta.preprocess)
}

// Returns [{ class_index, class_name, confidence (0-100) }] x3
export async function classify(uri) {
  const model = await getModel()
  const input = await toInput(uri)
  const outputs = await model.run([input])
  return topK(toProbabilities(outputs[0]), meta.classes, 3)
}

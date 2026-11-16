// Step 4 (client side): fix orientation, downscale and re-encode as JPEG before upload.
import * as ImageManipulator from 'expo-image-manipulator'

const MAX_SIDE = 1024

export async function prepareImage(photo) {
  const { uri, width, height } = photo
  const actions = []
  if (width && height && Math.max(width, height) > MAX_SIDE) {
    actions.push({ resize: width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE } })
  }
  const out = await ImageManipulator.manipulateAsync(uri, actions, { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG })
  return out.uri
}

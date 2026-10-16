import https from 'node:https'
import sharp from 'sharp'
import logger from '@adonisjs/core/services/logger'
import { MAX_IMAGE_UPLOAD_SIZE_BYTES, PRODUCT_IMAGES_FOLDER } from '#constants/upload_limits'
import { uploadImageBytes } from '#utils/uploader'

/**
 * Prefer GitHub raw over img.appledb.dev: the CDN often blocks non-browser
 * clients, and several full-resolution device PNGs exceed the 5 MB upload
 * cap. We download from the apple-device-images repo and resize to fit.
 * https://github.com/littlebyteorg/apple-device-images
 */
const RAW_BASE = 'https://raw.githubusercontent.com/littlebyteorg/apple-device-images/main/device'
const MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024
const MAX_EDGE = 800
const TIMEOUT_MS = 30_000

/**
 * Builds a GitHub raw URL for a device key and colour filename
 * (e.g. `iPhone15,4` + `Natural Titanium`).
 */
export function appledbImageUrl(deviceKey: string, color: string): string {
  const key = encodeURIComponent(deviceKey)
  const file = encodeURIComponent(`${color}.png`)
  return `${RAW_BASE}/${key}/${file}`
}

function download(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        timeout: TIMEOUT_MS,
        headers: { 'user-agent': 'Akinai-DemoSeed/1.0', 'accept': 'image/*' },
      },
      (response) => {
        const status = response.statusCode ?? 0
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume()
          return resolve(download(new URL(response.headers.location, url).toString()))
        }
        if (status !== 200) {
          response.resume()
          return reject(new Error(`HTTP ${status}`))
        }
        const chunks: Buffer[] = []
        let size = 0
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > MAX_DOWNLOAD_BYTES) {
            response.destroy()
            reject(new Error('Image too large to download'))
            return
          }
          chunks.push(chunk)
        })
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', reject)
      }
    )
    request.on('error', reject)
    request.on('timeout', () => {
      request.destroy()
      reject(new Error('Image download timed out'))
    })
  })
}

/**
 * Downloads, resizes to fit the upload limit, and returns PNG bytes.
 */
export async function fetchAppledbImageBytes(deviceKey: string, color: string): Promise<Buffer> {
  const url = appledbImageUrl(deviceKey, color)
  const raw = await download(url)
  let resized = await sharp(raw)
    .rotate()
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 8 })
    .toBuffer()

  if (resized.length > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    resized = await sharp(raw)
      .rotate()
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer()
  }

  if (resized.length > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error(`Resized image still exceeds ${MAX_IMAGE_UPLOAD_SIZE_BYTES} bytes`)
  }
  return resized
}

/**
 * Downloads an appledb product photo into Drive. Returns null when the
 * source is unreachable so seeding can continue offline.
 */
export async function importAppledbCover(
  deviceKey: string,
  color: string,
  label: string
): Promise<string | null> {
  try {
    const contents = await fetchAppledbImageBytes(deviceKey, color)
    const { key } = await uploadImageBytes(contents, PRODUCT_IMAGES_FOLDER, 'coverImage')
    return key
  } catch (error) {
    logger.warn(
      `Demo seed: skipped cover for "${label}" (${appledbImageUrl(deviceKey, color)}): ${
        error instanceof Error ? error.message : error
      }`
    )
    return null
  }
}

/**
 * Downloads an appledb image into a Drive folder (e.g. hero slides).
 */
export async function uploadAppledbToFolder(
  folder: string,
  deviceKey: string,
  color: string,
  label: string
): Promise<string | null> {
  try {
    const contents = await fetchAppledbImageBytes(deviceKey, color)
    const { key } = await uploadImageBytes(contents, folder, 'image')
    return key
  } catch (error) {
    logger.warn(
      `Demo seed: skipped hero image for "${label}" (${appledbImageUrl(deviceKey, color)}): ${
        error instanceof Error ? error.message : error
      }`
    )
    return null
  }
}

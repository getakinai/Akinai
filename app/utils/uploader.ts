import drive from '@adonisjs/drive/services/main'
import logger from '@adonisjs/core/services/logger'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { errors } from '@vinejs/vine'
import sharp from 'sharp'
import { v7 as uuidv7 } from 'uuid'
import MediaRepository from '#repositories/media_repository'
import { auditActor } from '#services/audit_actor'
import { privateDriveDisk } from '#utils/drive_disk'
import { imageUrl } from '#utils/image_url'

export { imageUrl }

export type UploadedImage = {
  key: string
  url: string
}

type RasterFormat = 'jpeg' | 'png' | 'webp' | 'gif'

const RASTER_FORMATS: Record<string, { format: RasterFormat; contentType: string }> = {
  jpg: { format: 'jpeg', contentType: 'image/jpeg' },
  jpeg: { format: 'jpeg', contentType: 'image/jpeg' },
  png: { format: 'png', contentType: 'image/png' },
  webp: { format: 'webp', contentType: 'image/webp' },
  gif: { format: 'gif', contentType: 'image/gif' },
}

/**
 * Decodes and re-encodes the image, so what is stored is a clean file of
 * the declared type: polyglot payloads, scripts hidden after the image
 * data and EXIF metadata (including GPS) are dropped.
 */
async function reencode(file: MultipartFile, format: RasterFormat): Promise<Buffer> {
  if (!file.tmpPath) throw new Error('Uploaded file has no temporary path')
  return reencodeSource(file.tmpPath, format, file.fieldName)
}

async function reencodeSource(
  input: string | Buffer,
  format: RasterFormat,
  field: string
): Promise<Buffer> {
  try {
    return await sharp(input, { animated: format === 'gif' || format === 'webp' })
      .rotate()
      .toFormat(format)
      .toBuffer()
  } catch {
    throw new errors.E_VALIDATION_ERROR([
      { field, message: 'This file isn’t a valid image', rule: 'image' },
    ])
  }
}

/** Extension for each format sharp detects, limited to the stored formats. */
const DETECTED_EXTENSIONS: Record<string, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
}

/**
 * Like `uploadImage`, for bytes that didn't come from a form (e.g. an image
 * downloaded during a CSV import). The type is read from the image data
 * itself, never from a file name or header, and the image is re-encoded.
 */
export async function uploadImageBytes(
  contents: Buffer,
  folder: string,
  field = 'image'
): Promise<UploadedImage> {
  let detected: string | undefined
  try {
    const metadata = await sharp(contents).metadata()
    detected = metadata.format
  } catch {
    detected = undefined
  }
  const extension = detected ? DETECTED_EXTENSIONS[detected] : undefined
  if (!extension) {
    throw new errors.E_VALIDATION_ERROR([
      { field, message: 'This image type isn’t supported', rule: 'image' },
    ])
  }

  const raster = RASTER_FORMATS[extension]
  const key = `${folder}/${uuidv7()}.${extension}`
  const encoded = await reencodeSource(contents, raster.format, field)
  await storePublicImage(key, folder, encoded, raster.contentType, null)

  return { key, url: imageUrl(key) }
}

/**
 * Writes a public image and lists it in the media gallery, credited to the
 * staff User of the running request (if any).
 */
async function storePublicImage(
  key: string,
  folder: string,
  contents: Buffer,
  contentType: string,
  originalName: string | null
): Promise<void> {
  await drive.use().put(key, contents, { contentType, contentDisposition: 'inline' })

  const { width, height } = await sharp(contents)
    .metadata()
    .catch(() => ({ width: undefined, height: undefined }))
  await new MediaRepository().create({
    key,
    folder,
    contentType,
    sizeBytes: contents.length,
    width: width ?? null,
    height: height ?? null,
    originalName: originalName ? originalName.slice(0, 255) : null,
    uploadedById: auditActor.current()?.userId ?? null,
  })
}

/**
 * Stores an already validated image under `folder/<uuidv7>.<ext>` on the
 * default disk. Size and extension checks belong in the Vine validator;
 * the Content-Type comes from the validated extension, never from the
 * browser.
 */
export async function uploadImage(file: MultipartFile, folder: string): Promise<UploadedImage> {
  const extension = (file.extname ?? '').toLowerCase()
  const raster = RASTER_FORMATS[extension]
  if (!raster) {
    throw new errors.E_VALIDATION_ERROR([
      { field: file.fieldName, message: 'This image type isn’t supported', rule: 'image' },
    ])
  }

  const key = `${folder}/${uuidv7()}.${extension}`
  const contents = await reencode(file, raster.format)
  await storePublicImage(key, folder, contents, raster.contentType, file.clientName)

  return { key, url: imageUrl(key) }
}

function privateDisk() {
  return drive.use(privateDriveDisk())
}

/**
 * Private keys start with this. When `S3_PRIVATE_BUCKET` isn't set the
 * private disk shares the public bucket, so this prefix must be blocked
 * at the CDN (e.g. a CloudFront behavior for `/private/*`).
 */
export const PRIVATE_KEY_PREFIX = 'private'

/**
 * Like `uploadImage`, but stores the file on the private disk and returns
 * only its key. Private files have no public URL; serve them with
 * `readPrivateImage` from an authorized route.
 */
export async function uploadPrivateImage(file: MultipartFile, folder: string): Promise<string> {
  const extension = (file.extname ?? '').toLowerCase()
  const raster = RASTER_FORMATS[extension]
  if (!raster) {
    throw new errors.E_VALIDATION_ERROR([
      { field: file.fieldName, message: 'This image type isn’t supported', rule: 'image' },
    ])
  }

  const key = `${PRIVATE_KEY_PREFIX}/${folder}/${uuidv7()}.${extension}`
  const contents = await reencode(file, raster.format)
  await privateDisk().put(key, contents, { contentType: raster.contentType })
  return key
}

/** Bytes and Content-Type (from the stored extension) of a private image. */
export async function readPrivateImage(
  key: string
): Promise<{ contents: Uint8Array; contentType: string }> {
  const extension = key.split('.').pop()?.toLowerCase() ?? ''
  const raster = RASTER_FORMATS[extension]
  if (!raster) throw new Error(`Unsupported private image type: ${extension}`)
  const contents = await privateDisk().getBytes(key)
  return { contents, contentType: raster.contentType }
}

/** Best-effort delete on the private disk; failures are logged, not thrown. */
export async function deletePrivateFiles(keys: string[]): Promise<void> {
  const disk = privateDisk()
  const results = await Promise.allSettled(keys.map((key) => disk.delete(key)))
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn({ err: result.reason, key: keys[index] }, 'Could not delete private file')
    }
  })
}

export type GeneratedFile = { name: string; contentType: string; contents: Buffer }

/** Writes generated files under `folder/<name>` on the default disk. */
export async function putFiles(folder: string, files: GeneratedFile[]): Promise<void> {
  const disk = drive.use()
  await Promise.all(
    files.map(({ name, contentType, contents }) =>
      disk.put(`${folder}/${name}`, contents, { contentType, contentDisposition: 'inline' })
    )
  )
}

/** Best-effort delete of everything under `folder`; failures are logged, not thrown. */
export async function deleteFolder(folder: string): Promise<void> {
  try {
    await drive.use().deleteAll(folder)
  } catch (error) {
    logger.warn({ err: error, folder }, 'Could not delete uploaded folder')
  }
}

export async function imageExists(key: string): Promise<boolean> {
  return drive.use().exists(key)
}

/**
 * Removes images from the media gallery and Drive. The file delete is
 * best-effort; failures are logged, not thrown, so they can be cleaned up later.
 */
export async function deleteImages(keys: string[]): Promise<void> {
  await new MediaRepository().deleteByKeys(keys)
  const results = await Promise.allSettled(keys.map((key) => drive.use().delete(key)))
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn({ err: result.reason, key: keys[index] }, 'Could not delete uploaded image')
    }
  })
}

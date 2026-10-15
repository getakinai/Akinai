import { errors } from '@vinejs/vine'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { PRODUCT_IMAGES_FOLDER } from '#constants/upload_limits'
import { fetchRemoteImage, parseRemoteImageUrl, RemoteImageError } from '#utils/remote_image'
import {
  deleteImages,
  imageExists,
  imageUrl,
  uploadImage,
  uploadImageBytes,
  type UploadedImage,
} from '#utils/uploader'
import { PRODUCT_IMAGE_KEY_PATTERN } from '#validators/helpers/product_image_fields'

export type ProductImageKeys = {
  coverImage?: string | null
  galleryImages?: string[]
}

export type ImportedImage = {
  key: string
  /** False when the URL was one of the product's current photos. */
  uploaded: boolean
}

/**
 * Stores product photos on Drive. Products keep the returned keys; files
 * are uploaded before the product is saved, so the create page can attach
 * photos to a product that does not exist yet.
 */
export default class ProductImageService {
  upload(file: MultipartFile): Promise<UploadedImage> {
    return uploadImage(file, PRODUCT_IMAGES_FOLDER)
  }

  /**
   * Rejects keys that were never uploaded (or were already removed) with a
   * 422 on the matching field.
   */
  async assertUploaded({ coverImage, galleryImages = [] }: ProductImageKeys): Promise<void> {
    const checks = [
      ...(coverImage ? [{ field: 'coverImage', key: coverImage }] : []),
      ...galleryImages.map((key, index) => ({ field: `galleryImages.${index}`, key })),
    ]
    const results = await Promise.all(checks.map(({ key }) => imageExists(key)))
    const missing = checks.filter((_, index) => !results[index])

    if (missing.length > 0) {
      throw new errors.E_VALIDATION_ERROR(
        missing.map(({ field }) => ({
          field,
          message: 'This photo is no longer available. Upload it again.',
          rule: 'imageExists',
        }))
      )
    }
  }

  /** Why `url` can't be imported, or null when it can. Doesn't download anything. */
  urlProblem(url: string): string | null {
    if (this.ownKey(url)) return null
    try {
      parseRemoteImageUrl(url)
      return null
    } catch (error) {
      if (error instanceof RemoteImageError) return error.message
      throw error
    }
  }

  /**
   * Copies the photo at `url` into our storage and returns its key. A URL
   * of one of `reusableKeys` (the product's current photos) keeps that key,
   * so files are never shared between products. Throws `RemoteImageError`
   * when the photo can't be used.
   */
  async importFromUrl(url: string, reusableKeys: string[] = []): Promise<ImportedImage> {
    const own = this.ownKey(url)
    if (own && reusableKeys.includes(own) && (await imageExists(own))) {
      return { key: own, uploaded: false }
    }

    const contents = await fetchRemoteImage(url)
    try {
      const { key } = await uploadImageBytes(contents, PRODUCT_IMAGES_FOLDER, 'image_urls')
      return { key, uploaded: true }
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        throw new RemoteImageError('The URL is not a JPG, PNG, WebP or GIF image.')
      }
      throw error
    }
  }

  remove(keys: string[]): Promise<void> {
    return deleteImages(keys)
  }

  /** The key when `url` is the public URL of one of our product photos. */
  protected ownKey(url: string): string | null {
    const prefix = imageUrl('')
    if (!url.startsWith(prefix)) return null
    const key = url.slice(prefix.length)
    return PRODUCT_IMAGE_KEY_PATTERN.test(key) ? key : null
  }
}

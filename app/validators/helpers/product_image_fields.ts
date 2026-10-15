import vine from '@vinejs/vine'
import {
  IMAGE_EXTENSIONS,
  MAX_GALLERY_IMAGES,
  PRODUCT_IMAGES_FOLDER,
} from '#constants/upload_limits'

/** Keys issued by the uploader: `products/<uuid>.<ext>`. */
export const PRODUCT_IMAGE_KEY_PATTERN = new RegExp(
  `^${PRODUCT_IMAGES_FOLDER}/[0-9a-f-]{36}\\.(${IMAGE_EXTENSIONS.join('|')})$`
)

const imageKey = () => vine.string().trim().regex(PRODUCT_IMAGE_KEY_PATTERN)

/**
 * Drive keys returned by POST /admin/products/images. Optional so an
 * omitted field leaves the product's photos unchanged.
 */
export const productImageFields = () => ({
  coverImage: imageKey().nullable().optional(),
  galleryImages: vine.array(imageKey()).maxLength(MAX_GALLERY_IMAGES).distinct().optional(),
})

import vine from '@vinejs/vine'
import { HERO_IMAGE_EXTENSIONS, MAX_HERO_IMAGE_UPLOAD_SIZE_MB } from '#constants/storefront'

export const adminCollectionImageStoreValidator = vine.create({
  image: vine.file({ size: `${MAX_HERO_IMAGE_UPLOAD_SIZE_MB}mb`, extnames: HERO_IMAGE_EXTENSIONS }),
})

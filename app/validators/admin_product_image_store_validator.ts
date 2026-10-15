import vine from '@vinejs/vine'
import { IMAGE_EXTENSIONS, MAX_IMAGE_UPLOAD_SIZE_MB } from '#constants/upload_limits'

export const adminProductImageStoreValidator = vine.create({
  image: vine.file({ size: `${MAX_IMAGE_UPLOAD_SIZE_MB}mb`, extnames: IMAGE_EXTENSIONS }),
})

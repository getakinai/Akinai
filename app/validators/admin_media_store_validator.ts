import vine from '@vinejs/vine'
import { MAX_MEDIA_FILES_PER_UPLOAD } from '#constants/media'
import { IMAGE_EXTENSIONS, MAX_IMAGE_UPLOAD_SIZE_MB } from '#constants/upload_limits'

export const adminMediaStoreValidator = vine.create({
  images: vine
    .array(vine.file({ size: `${MAX_IMAGE_UPLOAD_SIZE_MB}mb`, extnames: IMAGE_EXTENSIONS }))
    .minLength(1)
    .maxLength(MAX_MEDIA_FILES_PER_UPLOAD),
})

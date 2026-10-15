import vine from '@vinejs/vine'
import { FAVICON_EXTENSIONS, MAX_FAVICON_UPLOAD_SIZE_MB } from '#constants/branding'

export const adminStorefrontFaviconStoreValidator = vine.create({
  favicon: vine.file({ size: `${MAX_FAVICON_UPLOAD_SIZE_MB}mb`, extnames: FAVICON_EXTENSIONS }),
})

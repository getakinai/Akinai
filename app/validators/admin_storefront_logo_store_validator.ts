import vine from '@vinejs/vine'
import { LOGO_EXTENSIONS, MAX_LOGO_UPLOAD_SIZE_MB } from '#constants/branding'

export const adminStorefrontLogoStoreValidator = vine.create({
  logo: vine.file({ size: `${MAX_LOGO_UPLOAD_SIZE_MB}mb`, extnames: LOGO_EXTENSIONS }),
})

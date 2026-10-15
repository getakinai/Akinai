import vine from '@vinejs/vine'
import { FAVICON_FILE_NAMES } from '#constants/branding'

export const brandFaviconShowValidator = vine.create({
  file: vine.enum(FAVICON_FILE_NAMES),
})

import vine from '@vinejs/vine'
import { MEDIA_FOLDERS } from '#constants/media'

export const adminMediaListQueryValidator = vine.create({
  q: vine.string().trim().maxLength(100).optional(),
  folder: vine.enum(MEDIA_FOLDERS).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().in([24, 48, 96]).optional(),
})

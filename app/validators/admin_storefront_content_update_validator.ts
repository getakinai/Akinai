import vine from '@vinejs/vine'
import { MENU_URL } from '#validators/helpers/storefront_menu_fields'

export const adminStorefrontContentUpdateValidator = vine.create({
  announcementText: vine.string().trim().maxLength(160).nullable(),
  announcementUrl: vine.string().trim().maxLength(500).regex(MENU_URL).nullable(),
  footerTagline: vine.string().trim().maxLength(200).nullable(),
})

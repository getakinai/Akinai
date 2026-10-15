import vine from '@vinejs/vine'
import { storefrontMenuItemFields } from '#validators/helpers/storefront_menu_fields'

export const adminStorefrontMenuItemUpdateValidator = vine.create(storefrontMenuItemFields())

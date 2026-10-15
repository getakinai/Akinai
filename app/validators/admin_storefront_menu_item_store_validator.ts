import vine from '@vinejs/vine'
import { storefrontMenuItemFields } from '#validators/helpers/storefront_menu_fields'

export const adminStorefrontMenuItemStoreValidator = vine.create(storefrontMenuItemFields())

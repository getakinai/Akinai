import vine from '@vinejs/vine'
import { MENU_ITEM_TYPES } from '#constants/storefront'

/**
 * A site-relative path (`/sale`) or an absolute http(s) URL.
 */
export const MENU_URL = /^(\/(?!\/)\S*|https?:\/\/\S+)$/

/**
 * Link target shared by menu items, hero slides and promo banners: a
 * collection, a page or a URL.
 */
export const storefrontLinkFields = () => ({
  type: vine.enum(MENU_ITEM_TYPES),
  collectionId: vine
    .string()
    .uuid()
    .exists({ table: 'collections', column: 'id' })
    .nullable()
    .optional()
    .requiredWhen('type', '=', 'collection'),
  pageId: vine
    .string()
    .uuid()
    .exists({ table: 'pages', column: 'id' })
    .nullable()
    .optional()
    .requiredWhen('type', '=', 'page'),
  url: vine
    .string()
    .trim()
    .maxLength(500)
    .regex(MENU_URL)
    .nullable()
    .optional()
    .requiredWhen('type', '=', 'url'),
})

export const storefrontMenuItemFields = () => ({
  label: vine.string().trim().minLength(1).maxLength(60),
  ...storefrontLinkFields(),
  isVisible: vine.boolean({ strict: true }).optional(),
})

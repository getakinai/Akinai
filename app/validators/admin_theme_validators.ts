import vine from '@vinejs/vine'
import { MAX_THEME_PACKAGE_MB } from '#constants/themes'

/** The `:id` route param of a theme library entry. */
export const adminThemeIdValidator = vine.create({
  params: vine.object({
    id: vine.string().uuid(),
  }),
})

/** `:id` of the theme to preview; `builtin` previews the React storefront. */
export const adminThemePreviewValidator = vine.create({
  params: vine.object({
    id: vine
      .string()
      .trim()
      .regex(/^(builtin|[0-9a-f-]{36})$/),
  }),
})

export const adminThemeStoreValidator = vine.create({
  theme: vine.file({ size: `${MAX_THEME_PACKAGE_MB}mb`, extnames: ['zip'] }),
})

export const adminThemeRenameValidator = vine.create({
  params: vine.object({
    id: vine.string().uuid(),
  }),
  name: vine.string().trim().minLength(1).maxLength(120),
})

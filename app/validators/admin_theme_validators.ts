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

const draftSection = vine.object({
  type: vine.string(),
  settings: vine.record(vine.any().nullable()).optional(),
  blocks: vine.record(vine.any()).optional(),
  block_order: vine.array(vine.string()).optional(),
  blockOrder: vine.array(vine.string()).optional(),
  disabled: vine.boolean().optional(),
})

export const adminThemeDraftSettingsValidator = vine.create({
  params: vine.object({ id: vine.string().uuid() }),
  current: vine.record(vine.any().nullable()),
  sections: vine.record(draftSection),
})

export const adminThemeDraftTemplateValidator = vine.create({
  params: vine.object({
    id: vine.string().uuid(),
    name: vine
      .string()
      .trim()
      .regex(/^(index|product|collection|page)(\.[a-z0-9_-]{1,40})?$/),
  }),
  sections: vine.record(draftSection),
  order: vine.array(vine.string()),
})

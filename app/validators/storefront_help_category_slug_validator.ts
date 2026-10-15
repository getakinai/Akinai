import vine from '@vinejs/vine'

export const storefrontHelpCategorySlugValidator = vine.create({
  category: vine
    .string()
    .maxLength(100)
    .regex(/^[a-z0-9-]+$/),
})

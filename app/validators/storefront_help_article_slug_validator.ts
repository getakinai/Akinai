import vine from '@vinejs/vine'

export const storefrontHelpArticleSlugValidator = vine.create({
  category: vine
    .string()
    .maxLength(100)
    .regex(/^[a-z0-9-]+$/),
  slug: vine
    .string()
    .maxLength(100)
    .regex(/^[a-z0-9-]+$/),
})

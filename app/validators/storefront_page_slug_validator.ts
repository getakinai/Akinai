import vine from '@vinejs/vine'

export const storefrontPageSlugValidator = vine.create({
  slug: vine
    .string()
    .maxLength(255)
    .regex(/^[a-z0-9-]+$/),
})

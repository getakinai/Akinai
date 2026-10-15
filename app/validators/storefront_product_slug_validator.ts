import vine from '@vinejs/vine'

export const storefrontProductSlugValidator = vine.create({
  slug: vine
    .string()
    .maxLength(255)
    .regex(/^[a-z0-9-]+$/),
})

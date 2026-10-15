import vine from '@vinejs/vine'

export const storefrontProductShowQueryValidator = vine.create({
  collection: vine
    .string()
    .maxLength(255)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
})

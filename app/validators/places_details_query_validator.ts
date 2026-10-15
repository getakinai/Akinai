import vine from '@vinejs/vine'

export const placesDetailsQueryValidator = vine.create({
  params: vine.object({
    placeId: vine
      .string()
      .maxLength(512)
      .regex(/^[A-Za-z0-9_-]+$/),
  }),
  sessionToken: vine.string().uuid(),
})

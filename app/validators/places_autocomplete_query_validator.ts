import vine from '@vinejs/vine'

export const placesAutocompleteQueryValidator = vine.create({
  input: vine.string().trim().minLength(3).maxLength(200),
  sessionToken: vine.string().uuid(),
  countryCode: vine
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .optional(),
})

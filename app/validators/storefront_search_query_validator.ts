import vine from '@vinejs/vine'

export const storefrontSearchQueryValidator = vine.create({
  q: vine.string().trim().minLength(1).maxLength(100),
})

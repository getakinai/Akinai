import vine from '@vinejs/vine'

export const storefrontHelpSearchQueryValidator = vine.create({
  q: vine.string().trim().minLength(2).maxLength(100),
})

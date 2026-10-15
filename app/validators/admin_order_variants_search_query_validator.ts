import vine from '@vinejs/vine'

export const adminOrderVariantsSearchQueryValidator = vine.create({
  q: vine.string().trim().maxLength(100).optional(),
})

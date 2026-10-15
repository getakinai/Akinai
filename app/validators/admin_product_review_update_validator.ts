import vine from '@vinejs/vine'

export const adminProductReviewUpdateValidator = vine.create({
  isHidden: vine.boolean({ strict: true }).optional(),
  isFeatured: vine.boolean({ strict: true }).optional(),
})

import vine from '@vinejs/vine'

export const adminStorefrontMenuReorderValidator = vine.create({
  ids: vine.array(vine.string().uuid()).minLength(1).maxLength(100).distinct(),
})

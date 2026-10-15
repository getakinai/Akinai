import vine from '@vinejs/vine'

export const adminCollectionProductsReorderValidator = vine.create({
  productId: vine.string().uuid(),
  position: vine.number({ strict: true }).withoutDecimals().min(0),
})

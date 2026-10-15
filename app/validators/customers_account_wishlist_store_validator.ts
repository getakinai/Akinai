import vine from '@vinejs/vine'

export const customersAccountWishlistStoreValidator = vine.create({
  productId: vine.string().uuid(),
})

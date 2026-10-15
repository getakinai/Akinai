import vine from '@vinejs/vine'

export const adminCollectionProductsStoreValidator = vine.create({
  productIds: vine.array(vine.string().uuid()).minLength(1).maxLength(250),
})

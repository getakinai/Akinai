import vine from '@vinejs/vine'

export const adminStoreSettingsCheckoutUpdateValidator = vine.create({
  checkoutDeliveryHeading: vine.string().trim().maxLength(120).nullable(),
  checkoutDeliveryNote: vine.string().trim().maxLength(500).nullable(),
})

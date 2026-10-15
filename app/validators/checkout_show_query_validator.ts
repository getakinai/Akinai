import vine from '@vinejs/vine'

/** Unknown values are ignored rather than rejected, so a bad link still opens the page. */
export const checkoutShowQueryValidator = vine.create({
  payment: vine.string().trim().maxLength(20).optional(),
})

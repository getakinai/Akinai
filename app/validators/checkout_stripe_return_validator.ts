import vine from '@vinejs/vine'

export const checkoutStripeReturnValidator = vine.create({
  session_id: vine
    .string()
    .trim()
    .maxLength(255)
    .regex(/^cs_[A-Za-z0-9_]+$/),
})

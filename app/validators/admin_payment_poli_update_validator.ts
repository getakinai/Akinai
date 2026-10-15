import vine from '@vinejs/vine'
import { POLI_MERCHANT_CODE, POLI_MODES } from '#constants/payment_methods'
import { MAX_PAYMENT_MARKETS } from '#validators/admin_payment_stripe_update_validator'

const poliCredentialsSchema = vine
  .object({
    merchantCode: vine.string().trim().maxLength(64).regex(POLI_MERCHANT_CODE).nullable(),
    authenticationCode: vine.string().trim().maxLength(128).nullable().optional(),
  })
  .optional()

export const adminPaymentPoliUpdateValidator = vine.create({
  mode: vine.enum(POLI_MODES),
  test: poliCredentialsSchema,
  live: poliCredentialsSchema.clone(),
  marketIds: vine.array(vine.string().uuid()).distinct().maxLength(MAX_PAYMENT_MARKETS),
})

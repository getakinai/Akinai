import vine from '@vinejs/vine'
import {
  STRIPE_MODES,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
} from '#constants/payment_methods'

export const MAX_PAYMENT_MARKETS = 500

const stripeKeysSchema = vine
  .object({
    publishableKey: vine.string().trim().maxLength(255).regex(STRIPE_PUBLISHABLE_KEY).nullable(),
    secretKey: vine.string().trim().maxLength(255).regex(STRIPE_SECRET_KEY).nullable().optional(),
    webhookSecret: vine
      .string()
      .trim()
      .maxLength(255)
      .regex(STRIPE_WEBHOOK_SECRET)
      .nullable()
      .optional(),
  })
  .optional()

export const adminPaymentStripeUpdateValidator = vine.create({
  mode: vine.enum(STRIPE_MODES),
  test: stripeKeysSchema,
  live: stripeKeysSchema.clone(),
  marketIds: vine.array(vine.string().uuid()).distinct().maxLength(MAX_PAYMENT_MARKETS),
  cancelUrl: vine
    .string()
    .trim()
    .maxLength(500)
    .url({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
    .nullable()
    .optional(),
})

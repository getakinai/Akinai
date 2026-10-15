import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StripePaymentService from '#services/stripe_payment_service'

/**
 * Receives Stripe events. The signature is checked against the webhook
 * secret stored (encrypted) on the admin Payments page.
 */
@inject()
export default class StripeWebhookController {
  constructor(protected stripePaymentService: StripePaymentService) {}

  async handle(ctx: HttpContext) {
    const signature = ctx.request.header('stripe-signature')
    const payload = ctx.request.raw()
    if (!signature || !payload) {
      return ctx.response.badRequest({ errors: [{ message: 'Missing Stripe signature' }] })
    }

    try {
      await this.stripePaymentService.handleWebhook(payload, signature)
    } catch (error) {
      ctx.logger.warn({ err: error }, 'Rejected Stripe webhook')
      return ctx.response.badRequest({ errors: [{ message: 'Invalid Stripe webhook' }] })
    }
    return ctx.response.ok({ data: { received: true } })
  }
}

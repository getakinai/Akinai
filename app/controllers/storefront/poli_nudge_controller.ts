import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PoliPaymentService from '#services/poli_payment_service'
import { poliNudgeValidator } from '#validators/poli_nudge_validator'

/**
 * Receives POLi's nudge (server-to-server notification). It isn't signed,
 * so it only triggers a lookup with POLi. Always answers 200 so POLi stops
 * retrying; failures are logged.
 */
@inject()
export default class PoliNudgeController {
  constructor(protected poliPaymentService: PoliPaymentService) {}

  async handle(ctx: HttpContext) {
    const { Token: token } = await ctx.request.validateUsing(poliNudgeValidator)
    try {
      await this.poliPaymentService.handleNudge(token)
    } catch (error) {
      ctx.logger.warn({ err: error }, 'Could not process POLi nudge')
    }
    return ctx.response.ok({ data: { received: true } })
  }
}

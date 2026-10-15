import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import TaxRatePolicy from '#policies/tax_rate_policy'
import TaxService from '#services/tax_service'
import TaxRateTransformer from '#transformers/tax_rate_transformer'

@inject()
export default class AdminTaxesUnarchiveController {
  constructor(protected taxService: TaxService) {}

  async handle(ctx: HttpContext) {
    const taxRate = await this.taxService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(TaxRatePolicy).authorize('unarchive', taxRate)

    const restored = await this.taxService.unarchive(taxRate)

    return ctx.serialize(TaxRateTransformer.transform(restored))
  }
}

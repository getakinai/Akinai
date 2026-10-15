import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import TaxRatePolicy from '#policies/tax_rate_policy'
import TaxService from '#services/tax_service'
import TaxRateTransformer from '#transformers/tax_rate_transformer'
import { adminTaxRateUpdateValidator } from '#validators/admin_tax_rate_update_validator'

@inject()
export default class AdminTaxesUpdateController {
  constructor(protected taxService: TaxService) {}

  async handle(ctx: HttpContext) {
    const taxRate = await this.taxService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(TaxRatePolicy).authorize('update', taxRate)

    const { name, countryCode, regionCode, rate, appliesToShipping } =
      await ctx.request.validateUsing(adminTaxRateUpdateValidator, {
        meta: { taxRateId: taxRate.id },
      })
    const updated = await this.taxService.update(taxRate, {
      name,
      countryCode,
      regionCode,
      rate,
      appliesToShipping,
    })

    return ctx.serialize(TaxRateTransformer.transform(updated))
  }
}

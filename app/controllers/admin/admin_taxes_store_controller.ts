import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import TaxService from '#services/tax_service'
import TaxRateTransformer from '#transformers/tax_rate_transformer'
import { adminTaxRateStoreValidator } from '#validators/admin_tax_rate_store_validator'

@inject()
export default class AdminTaxesStoreController {
  constructor(protected taxService: TaxService) {}

  async handle(ctx: HttpContext) {
    const { name, countryCode, regionCode, rate, appliesToShipping } =
      await ctx.request.validateUsing(adminTaxRateStoreValidator)
    const taxRate = await this.taxService.create({
      name,
      countryCode,
      regionCode,
      rate,
      appliesToShipping,
    })

    ctx.response.status(201)
    return ctx.serialize(TaxRateTransformer.transform(taxRate))
  }
}

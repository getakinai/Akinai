import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import TaxService from '#services/tax_service'
import TaxRateTransformer from '#transformers/tax_rate_transformer'
import { adminTaxRatesListQueryValidator } from '#validators/admin_tax_rates_list_query_validator'

@inject()
export default class AdminTaxesListController {
  constructor(protected taxService: TaxService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminTaxRatesListQueryValidator,
      { data: ctx.request.qs() }
    )
    const taxRates = await this.taxService.paginate({ q, status, sort, direction, page, perPage })

    return ctx.serialize(TaxRateTransformer.paginate(taxRates.all(), taxRates.getMeta()))
  }
}

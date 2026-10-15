import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorService from '#services/vendor_service'
import VendorTransformer from '#transformers/vendor_transformer'
import { adminVendorsListQueryValidator } from '#validators/admin_vendors_list_query_validator'

@inject()
export default class AdminVendorsListController {
  constructor(protected vendorService: VendorService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminVendorsListQueryValidator,
      { data: ctx.request.qs() }
    )
    const vendors = await this.vendorService.paginate({ q, status, sort, direction, page, perPage })

    return ctx.serialize(VendorTransformer.paginate(vendors.all(), vendors.getMeta()))
  }
}

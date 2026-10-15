import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorService from '#services/vendor_service'
import VendorTransformer from '#transformers/vendor_transformer'
import { adminVendorStoreValidator } from '#validators/admin_vendor_store_validator'

@inject()
export default class AdminVendorsStoreController {
  constructor(protected vendorService: VendorService) {}

  async handle(ctx: HttpContext) {
    const { name } = await ctx.request.validateUsing(adminVendorStoreValidator)
    const vendor = await this.vendorService.create({ name })

    ctx.response.status(201)
    return ctx.serialize(VendorTransformer.transform(vendor))
  }
}

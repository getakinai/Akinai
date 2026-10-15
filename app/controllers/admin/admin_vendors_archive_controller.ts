import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorPolicy from '#policies/vendor_policy'
import VendorService from '#services/vendor_service'
import VendorTransformer from '#transformers/vendor_transformer'

@inject()
export default class AdminVendorsArchiveController {
  constructor(protected vendorService: VendorService) {}

  async handle(ctx: HttpContext) {
    const vendor = await this.vendorService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(VendorPolicy).authorize('archive', vendor)

    const archived = await this.vendorService.archive(vendor)

    return ctx.serialize(VendorTransformer.transform(archived))
  }
}

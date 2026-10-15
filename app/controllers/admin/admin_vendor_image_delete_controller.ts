import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorPolicy from '#policies/vendor_policy'
import VendorService from '#services/vendor_service'
import VendorTransformer from '#transformers/vendor_transformer'

@inject()
export default class AdminVendorImageDeleteController {
  constructor(protected vendorService: VendorService) {}

  async handle(ctx: HttpContext) {
    const vendor = await this.vendorService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(VendorPolicy).authorize('upload', vendor)

    const updated = await this.vendorService.removeImage(vendor)

    return ctx.serialize(VendorTransformer.transform(updated))
  }
}

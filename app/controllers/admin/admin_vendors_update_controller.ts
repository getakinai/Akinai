import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorPolicy from '#policies/vendor_policy'
import VendorService from '#services/vendor_service'
import VendorTransformer from '#transformers/vendor_transformer'
import { adminVendorUpdateValidator } from '#validators/admin_vendor_update_validator'

@inject()
export default class AdminVendorsUpdateController {
  constructor(protected vendorService: VendorService) {}

  async handle(ctx: HttpContext) {
    const vendor = await this.vendorService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(VendorPolicy).authorize('update', vendor)

    const { name } = await ctx.request.validateUsing(adminVendorUpdateValidator, {
      meta: { vendorId: vendor.id },
    })
    const updated = await this.vendorService.update(vendor, { name })

    return ctx.serialize(VendorTransformer.transform(updated))
  }
}

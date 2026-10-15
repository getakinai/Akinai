import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import VendorPolicy from '#policies/vendor_policy'
import VendorService from '#services/vendor_service'
import VendorTransformer from '#transformers/vendor_transformer'
import { adminVendorImageStoreValidator } from '#validators/admin_vendor_image_store_validator'

@inject()
export default class AdminVendorImageStoreController {
  constructor(protected vendorService: VendorService) {}

  async handle(ctx: HttpContext) {
    const vendor = await this.vendorService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(VendorPolicy).authorize('upload', vendor)

    const { image } = await ctx.request.validateUsing(adminVendorImageStoreValidator)
    const updated = await this.vendorService.setImage(vendor, image)

    return ctx.serialize(VendorTransformer.transform(updated))
  }
}

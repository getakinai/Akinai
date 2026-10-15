import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationService from '#services/location_service'
import ProductVariantService from '#services/product_variant_service'
import ProductVariantTransformer from '#transformers/product_variant_transformer'
import { adminProductVariantParamsValidator } from '#validators/admin_product_variant_params_validator'

@inject()
export default class AdminVariantsViewController {
  constructor(
    protected productVariantService: ProductVariantService,
    protected locationService: LocationService
  ) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminProductVariantParamsValidator)
    const variant = await this.productVariantService.findForProductOrFail(
      params.productId,
      ctx.params.id
    )
    const locations = await this.locationService.allActive()

    return ctx.serialize(ProductVariantTransformer.transform(variant, locations))
  }
}

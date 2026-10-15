import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductPolicy from '#policies/product_policy'
import LocationService from '#services/location_service'
import ProductVariantService from '#services/product_variant_service'
import ProductVariantTransformer from '#transformers/product_variant_transformer'
import { adminProductVariantParamsValidator } from '#validators/admin_product_variant_params_validator'
import { adminProductVariantUpdateValidator } from '#validators/admin_product_variant_update_validator'

@inject()
export default class AdminVariantsUpdateController {
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
    await ctx.bouncer.with(ProductPolicy).authorize('updateVariant', variant)

    const {
      optionValueIds,
      sku,
      barcode,
      price,
      compareAtPrice,
      weight,
      trackInventory,
      marketPrices,
    } = await ctx.request.validateUsing(adminProductVariantUpdateValidator, {
      meta: { variantId: variant.id },
    })
    const updated = await this.productVariantService.update(variant, {
      optionValueIds,
      sku,
      barcode,
      price,
      compareAtPrice,
      weight,
      trackInventory,
      marketPrices,
    })
    const locations = await this.locationService.allActive()

    return ctx.serialize(ProductVariantTransformer.transform(updated, locations))
  }
}

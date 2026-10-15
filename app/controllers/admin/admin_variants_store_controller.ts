import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductPolicy from '#policies/product_policy'
import LocationService from '#services/location_service'
import ProductVariantService from '#services/product_variant_service'
import ProductVariantTransformer from '#transformers/product_variant_transformer'
import { adminProductVariantParamsValidator } from '#validators/admin_product_variant_params_validator'
import { adminProductVariantStoreValidator } from '#validators/admin_product_variant_store_validator'

@inject()
export default class AdminVariantsStoreController {
  constructor(
    protected productVariantService: ProductVariantService,
    protected locationService: LocationService
  ) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminProductVariantParamsValidator)
    const product = await this.productVariantService.findProductOrFail(params.productId)
    await ctx.bouncer.with(ProductPolicy).authorize('createVariant', product)

    const {
      optionValueIds,
      sku,
      barcode,
      price,
      compareAtPrice,
      weight,
      trackInventory,
      marketPrices,
    } = await ctx.request.validateUsing(adminProductVariantStoreValidator)
    const variant = await this.productVariantService.create(product, {
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

    ctx.response.status(201)
    return ctx.serialize(ProductVariantTransformer.transform(variant, locations))
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductPolicy from '#policies/product_policy'
import InventoryService from '#services/inventory_service'
import LocationService from '#services/location_service'
import ProductVariantService from '#services/product_variant_service'
import ProductVariantTransformer from '#transformers/product_variant_transformer'
import { adminInventoryLevelsUpdateValidator } from '#validators/admin_inventory_levels_update_validator'
import { adminProductVariantParamsValidator } from '#validators/admin_product_variant_params_validator'

@inject()
export default class AdminVariantInventoryUpdateController {
  constructor(
    protected productVariantService: ProductVariantService,
    protected inventoryService: InventoryService,
    protected locationService: LocationService
  ) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminProductVariantParamsValidator)
    const variant = await this.productVariantService.findForProductOrFail(
      params.productId,
      ctx.params.id
    )
    await ctx.bouncer.with(ProductPolicy).authorize('editInventory', variant)

    const { levels } = await ctx.request.validateUsing(adminInventoryLevelsUpdateValidator)
    const updated = await this.inventoryService.setLevels(variant, levels)
    const locations = await this.locationService.allActive()

    return ctx.serialize(ProductVariantTransformer.transform(updated, locations))
  }
}

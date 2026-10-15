import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductPolicy from '#policies/product_policy'
import ProductVariantService from '#services/product_variant_service'
import { adminProductVariantParamsValidator } from '#validators/admin_product_variant_params_validator'

@inject()
export default class AdminVariantsDeleteController {
  constructor(protected productVariantService: ProductVariantService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminProductVariantParamsValidator)
    const variant = await this.productVariantService.findForProductOrFail(
      params.productId,
      ctx.params.id
    )
    await ctx.bouncer.with(ProductPolicy).authorize('deleteVariant', variant)

    await this.productVariantService.delete(variant)

    return ctx.response.noContent()
  }
}

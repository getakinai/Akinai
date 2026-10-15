import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductPolicy from '#policies/product_policy'
import ProductService from '#services/product_service'
import ProductTransformer from '#transformers/product_transformer'
import { adminProductOptionsUpdateValidator } from '#validators/admin_product_options_update_validator'

@inject()
export default class AdminProductOptionsUpdateController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const product = await this.productService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ProductPolicy).authorize('update', product)

    const { options } = await ctx.request.validateUsing(adminProductOptionsUpdateValidator)
    await this.productService.syncOptions(product, options)
    const detail = await this.productService.findDetail(product.id)

    return ctx.serialize(
      ProductTransformer.transform(detail.product, detail.locations).useVariant('toDetail')
    )
  }
}

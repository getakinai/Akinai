import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductTypePolicy from '#policies/product_type_policy'
import ProductTypeService from '#services/product_type_service'
import ProductTypeTransformer from '#transformers/product_type_transformer'

@inject()
export default class AdminProductTypesUnarchiveController {
  constructor(protected productTypeService: ProductTypeService) {}

  async handle(ctx: HttpContext) {
    const productType = await this.productTypeService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ProductTypePolicy).authorize('unarchive', productType)

    const restored = await this.productTypeService.unarchive(productType)

    return ctx.serialize(ProductTypeTransformer.transform(restored))
  }
}

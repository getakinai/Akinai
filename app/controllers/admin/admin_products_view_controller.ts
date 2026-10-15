import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductService from '#services/product_service'
import ProductTransformer from '#transformers/product_transformer'

@inject()
export default class AdminProductsViewController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const { product, locations } = await this.productService.findDetail(ctx.params.id)

    return ctx.serialize(ProductTransformer.transform(product, locations).useVariant('toDetail'))
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductService from '#services/product_service'
import ProductFacetsTransformer from '#transformers/product_facets_transformer'

@inject()
export default class AdminProductsFacetsController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const facets = await this.productService.facets()

    return ctx.serialize(ProductFacetsTransformer.transform(facets))
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductTypeService from '#services/product_type_service'
import ProductTypeTransformer from '#transformers/product_type_transformer'
import { adminProductTypeStoreValidator } from '#validators/admin_product_type_store_validator'

@inject()
export default class AdminProductTypesStoreController {
  constructor(protected productTypeService: ProductTypeService) {}

  async handle(ctx: HttpContext) {
    const { name } = await ctx.request.validateUsing(adminProductTypeStoreValidator)
    const productType = await this.productTypeService.create({ name })

    ctx.response.status(201)
    return ctx.serialize(ProductTypeTransformer.transform(productType))
  }
}

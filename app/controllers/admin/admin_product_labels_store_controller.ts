import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductLabelService from '#services/product_label_service'
import ProductLabelTransformer from '#transformers/product_label_transformer'
import { adminProductLabelStoreValidator } from '#validators/admin_product_label_store_validator'

@inject()
export default class AdminProductLabelsStoreController {
  constructor(protected productLabelService: ProductLabelService) {}

  async handle(ctx: HttpContext) {
    const { name, color } = await ctx.request.validateUsing(adminProductLabelStoreValidator)
    const label = await this.productLabelService.create({ name, color })

    ctx.response.status(201)
    return ctx.serialize(ProductLabelTransformer.transform(label))
  }
}

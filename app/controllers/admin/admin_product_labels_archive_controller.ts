import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductLabelPolicy from '#policies/product_label_policy'
import ProductLabelService from '#services/product_label_service'
import ProductLabelTransformer from '#transformers/product_label_transformer'

@inject()
export default class AdminProductLabelsArchiveController {
  constructor(protected productLabelService: ProductLabelService) {}

  async handle(ctx: HttpContext) {
    const label = await this.productLabelService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ProductLabelPolicy).authorize('archive', label)

    const archived = await this.productLabelService.archive(label)

    return ctx.serialize(ProductLabelTransformer.transform(archived))
  }
}

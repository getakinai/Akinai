import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductLabelPolicy from '#policies/product_label_policy'
import ProductLabelService from '#services/product_label_service'
import ProductLabelTransformer from '#transformers/product_label_transformer'
import { adminProductLabelUpdateValidator } from '#validators/admin_product_label_update_validator'

@inject()
export default class AdminProductLabelsUpdateController {
  constructor(protected productLabelService: ProductLabelService) {}

  async handle(ctx: HttpContext) {
    const label = await this.productLabelService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ProductLabelPolicy).authorize('update', label)

    const { name, color } = await ctx.request.validateUsing(adminProductLabelUpdateValidator, {
      meta: { productLabelId: label.id },
    })
    const updated = await this.productLabelService.update(label, { name, color })

    return ctx.serialize(ProductLabelTransformer.transform(updated))
  }
}

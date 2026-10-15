import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductTypePolicy from '#policies/product_type_policy'
import ProductTypeService from '#services/product_type_service'
import ProductTypeTransformer from '#transformers/product_type_transformer'
import { adminProductTypeUpdateValidator } from '#validators/admin_product_type_update_validator'

@inject()
export default class AdminProductTypesUpdateController {
  constructor(protected productTypeService: ProductTypeService) {}

  async handle(ctx: HttpContext) {
    const productType = await this.productTypeService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ProductTypePolicy).authorize('update', productType)

    const { name } = await ctx.request.validateUsing(adminProductTypeUpdateValidator, {
      meta: { productTypeId: productType.id },
    })
    const updated = await this.productTypeService.update(productType, { name })

    return ctx.serialize(ProductTypeTransformer.transform(updated))
  }
}

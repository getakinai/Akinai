import type { HttpContext } from '@adonisjs/core/http'
import { adminProductVariantParamsValidator } from '#validators/admin_product_variant_params_validator'

export default class AdminVariantsEditController {
  async handle({ inertia, request, params }: HttpContext) {
    const { params: validated } = await request.validateUsing(adminProductVariantParamsValidator)

    return inertia.render('admin/products/variants/edit', {
      productId: validated.productId,
      id: params.id,
    })
  }
}

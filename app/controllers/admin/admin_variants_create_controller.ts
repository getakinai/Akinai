import type { HttpContext } from '@adonisjs/core/http'
import { adminProductVariantParamsValidator } from '#validators/admin_product_variant_params_validator'

export default class AdminVariantsCreateController {
  async handle({ inertia, request }: HttpContext) {
    const { params } = await request.validateUsing(adminProductVariantParamsValidator)

    return inertia.render('admin/products/variants/create', { productId: params.productId })
  }
}

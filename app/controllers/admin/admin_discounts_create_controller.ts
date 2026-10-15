import type { HttpContext } from '@adonisjs/core/http'
import { adminDiscountCreateQueryValidator } from '#validators/admin_discount_create_query_validator'

export default class AdminDiscountsCreateController {
  async handle({ inertia, request }: HttpContext) {
    const [error, query] = await adminDiscountCreateQueryValidator.tryValidate(request.qs())
    return inertia.render('admin/discounts/create', {
      type: error ? 'amount_off_order' : query.type,
    })
  }
}

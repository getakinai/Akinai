import type { HttpContext } from '@adonisjs/core/http'
import { adminOrdersHomeQueryValidator } from '#validators/admin_orders_home_query_validator'

export default class AdminOrdersHomeController {
  async handle({ inertia, request }: HttpContext) {
    const [error, filters] = await adminOrdersHomeQueryValidator.tryValidate(request.qs())
    return inertia.render('admin/orders/home', {
      paymentStatus: error ? '' : (filters.paymentStatus ?? ''),
      fulfillmentStatus: error ? '' : (filters.fulfillmentStatus ?? ''),
    })
  }
}

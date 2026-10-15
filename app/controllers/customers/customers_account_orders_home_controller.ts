import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountOrdersHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/account/orders/home', {})
  }
}

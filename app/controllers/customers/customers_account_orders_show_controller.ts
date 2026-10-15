import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountOrdersShowController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('customers/account/orders/show', { id: params.id })
  }
}

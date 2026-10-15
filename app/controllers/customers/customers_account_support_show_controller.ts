import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountSupportShowController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('customers/account/support/show', { id: params.id })
  }
}

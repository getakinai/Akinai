import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountSupportHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/account/support/home', {})
  }
}

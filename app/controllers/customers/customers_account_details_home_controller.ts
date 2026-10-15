import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountDetailsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/account/details/home', {})
  }
}

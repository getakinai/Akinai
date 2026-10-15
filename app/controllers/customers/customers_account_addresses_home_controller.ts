import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountAddressesHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/account/addresses/home', {})
  }
}

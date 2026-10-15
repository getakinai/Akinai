import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountActivityHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/account/activity/home', {})
  }
}

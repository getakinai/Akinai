import type { HttpContext } from '@adonisjs/core/http'

export default class StorefrontCheckoutHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('checkout/home', {})
  }
}

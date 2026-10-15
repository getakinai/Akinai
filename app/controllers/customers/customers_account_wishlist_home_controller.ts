import type { HttpContext } from '@adonisjs/core/http'

export default class CustomersAccountWishlistHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('customers/account/wishlist/home', {})
  }
}

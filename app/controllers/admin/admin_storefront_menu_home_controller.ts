import type { HttpContext } from '@adonisjs/core/http'

export default class AdminStorefrontMenuHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/storefront/menu', {})
  }
}

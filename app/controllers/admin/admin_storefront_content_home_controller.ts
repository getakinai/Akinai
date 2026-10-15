import type { HttpContext } from '@adonisjs/core/http'

export default class AdminStorefrontContentHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/storefront/content', {})
  }
}

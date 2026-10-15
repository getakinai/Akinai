import type { HttpContext } from '@adonisjs/core/http'

export default class AdminStorefrontHeroHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/storefront/hero', {})
  }
}

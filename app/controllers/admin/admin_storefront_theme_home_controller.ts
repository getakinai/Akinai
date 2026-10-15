import type { HttpContext } from '@adonisjs/core/http'

export default class AdminStorefrontThemeHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/storefront/theme', {})
  }
}

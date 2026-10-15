import type { HttpContext } from '@adonisjs/core/http'

export default class AdminThemesHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/themes/home', {})
  }
}

import type { HttpContext } from '@adonisjs/core/http'

export default class AdminPagesHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/pages/home', {})
  }
}

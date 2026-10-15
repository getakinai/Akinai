import type { HttpContext } from '@adonisjs/core/http'

export default class AdminPagesCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/pages/create', {})
  }
}

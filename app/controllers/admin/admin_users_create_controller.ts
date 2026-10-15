import type { HttpContext } from '@adonisjs/core/http'

export default class AdminUsersCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/users/create', {})
  }
}

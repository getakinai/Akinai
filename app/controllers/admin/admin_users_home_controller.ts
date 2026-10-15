import type { HttpContext } from '@adonisjs/core/http'

export default class AdminUsersHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/users/home', {})
  }
}

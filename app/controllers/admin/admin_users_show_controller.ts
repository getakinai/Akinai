import type { HttpContext } from '@adonisjs/core/http'

export default class AdminUsersShowController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/users/show', { id: params.id })
  }
}

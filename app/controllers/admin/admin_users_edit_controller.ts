import type { HttpContext } from '@adonisjs/core/http'

export default class AdminUsersEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/users/edit', { id: params.id })
  }
}

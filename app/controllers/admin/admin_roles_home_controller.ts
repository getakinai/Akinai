import type { HttpContext } from '@adonisjs/core/http'

export default class AdminRolesHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/roles/home', {})
  }
}

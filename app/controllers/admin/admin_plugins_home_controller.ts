import type { HttpContext } from '@adonisjs/core/http'

export default class AdminPluginsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/plugins/home', {})
  }
}

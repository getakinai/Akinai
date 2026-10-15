import type { HttpContext } from '@adonisjs/core/http'

export default class AdminMediaHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/media/home', {})
  }
}

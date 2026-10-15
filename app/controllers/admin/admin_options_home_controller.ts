import type { HttpContext } from '@adonisjs/core/http'

export default class AdminOptionsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/options/home', {})
  }
}

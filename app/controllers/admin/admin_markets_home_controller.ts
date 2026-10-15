import type { HttpContext } from '@adonisjs/core/http'

export default class AdminMarketsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/markets/home', {})
  }
}

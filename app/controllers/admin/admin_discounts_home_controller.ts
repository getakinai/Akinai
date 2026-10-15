import type { HttpContext } from '@adonisjs/core/http'

export default class AdminDiscountsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/discounts/home', {})
  }
}

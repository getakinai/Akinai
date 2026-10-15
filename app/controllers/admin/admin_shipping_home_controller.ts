import type { HttpContext } from '@adonisjs/core/http'

export default class AdminShippingHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/shipping/home', {})
  }
}

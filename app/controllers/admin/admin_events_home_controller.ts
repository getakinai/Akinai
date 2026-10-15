import type { HttpContext } from '@adonisjs/core/http'

export default class AdminEventsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/events/home', {})
  }
}

import type { HttpContext } from '@adonisjs/core/http'

export default class AdminLocationsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/locations/home', {})
  }
}

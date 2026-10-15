import type { HttpContext } from '@adonisjs/core/http'

export default class AdminCollectionsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/collections/home', {})
  }
}

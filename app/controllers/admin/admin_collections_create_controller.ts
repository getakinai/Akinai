import type { HttpContext } from '@adonisjs/core/http'

export default class AdminCollectionsCreateController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/collections/create', {})
  }
}

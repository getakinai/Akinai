import type { HttpContext } from '@adonisjs/core/http'

export default class AdminCollectionsEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/collections/edit', { id: params.id })
  }
}

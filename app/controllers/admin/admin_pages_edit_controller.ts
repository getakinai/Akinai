import type { HttpContext } from '@adonisjs/core/http'

export default class AdminPagesEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/pages/edit', { id: params.id })
  }
}

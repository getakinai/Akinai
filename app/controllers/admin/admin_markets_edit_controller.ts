import type { HttpContext } from '@adonisjs/core/http'

export default class AdminMarketsEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/markets/edit', { id: params.id })
  }
}

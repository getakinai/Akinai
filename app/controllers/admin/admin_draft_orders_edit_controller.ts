import type { HttpContext } from '@adonisjs/core/http'

export default class AdminDraftOrdersEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/orders/drafts/edit', { id: params.id })
  }
}

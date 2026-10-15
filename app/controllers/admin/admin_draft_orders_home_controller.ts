import type { HttpContext } from '@adonisjs/core/http'

export default class AdminDraftOrdersHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/orders/drafts/home', {})
  }
}

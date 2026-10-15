import type { HttpContext } from '@adonisjs/core/http'

export default class AdminOrdersShowController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/orders/show', { id: params.id })
  }
}

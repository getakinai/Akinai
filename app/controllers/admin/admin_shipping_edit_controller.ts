import type { HttpContext } from '@adonisjs/core/http'

export default class AdminShippingEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/shipping/edit', { id: params.id })
  }
}

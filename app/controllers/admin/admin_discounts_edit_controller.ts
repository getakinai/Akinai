import type { HttpContext } from '@adonisjs/core/http'

export default class AdminDiscountsEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/discounts/edit', { id: params.id })
  }
}

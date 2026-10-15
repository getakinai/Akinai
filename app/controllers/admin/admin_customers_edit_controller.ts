import type { HttpContext } from '@adonisjs/core/http'

export default class AdminCustomersEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/customers/edit', { id: params.id })
  }
}

import type { HttpContext } from '@adonisjs/core/http'

export default class AdminOptionsEditController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/options/edit', { id: params.id })
  }
}

import type { HttpContext } from '@adonisjs/core/http'

export default class AdminEmailsShowController {
  async handle({ inertia, params }: HttpContext) {
    return inertia.render('admin/emails/show', { id: params.id })
  }
}

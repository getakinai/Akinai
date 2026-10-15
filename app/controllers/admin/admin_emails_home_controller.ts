import type { HttpContext } from '@adonisjs/core/http'

export default class AdminEmailsHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/emails/home', {})
  }
}

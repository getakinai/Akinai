import type { HttpContext } from '@adonisjs/core/http'

export default class AdminNewsletterSubscribersHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render('admin/marketing/newsletter/home', {})
  }
}

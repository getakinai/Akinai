import type { HttpContext } from '@adonisjs/core/http'
import { pluginPage } from '#plugin_host/pages'

export default class AdminNewsletterSubscribersHomeController {
  async handle({ inertia }: HttpContext) {
    return inertia.render(pluginPage('newsletter', 'admin/newsletter'), {})
  }
}
